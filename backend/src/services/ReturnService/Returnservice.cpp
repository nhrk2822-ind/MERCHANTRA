
#include "ReturnService.h"
 
#include <stdexcept>
 
#include "../AIClientService/AIClientService.h"
#include "../InventoryService/InventoryService.h"
#include "../LifecycleService/LifecycleService.h"
 
namespace merchantra {
 
int ReturnService::requestReturn(pqxx::work &txn,
                                  int orderItemId,
                                  const std::string &permanentProductId,
                                  const std::string &reason,
                                  int actorUserId) {
    auto row = txn.exec_params(
        "INSERT INTO returns (order_item_id, permanent_product_id, reason, status) "
        "VALUES ($1, $2, $3, 'REQUESTED') RETURNING id",
        orderItemId, permanentProductId, reason);
    int returnId = row[0][0].as<int>();
 
    LifecycleService::recordEvent(txn, permanentProductId,
                                   ProductEventType::RETURN_REQUESTED,
                                   "return", returnId, "{}", actorUserId);
 
    return returnId;
}
 
void ReturnService::markReceived(pqxx::work &txn, int returnId, int actorUserId) {
    auto rows = txn.exec_params(
        "SELECT permanent_product_id, reason FROM returns WHERE id = $1 FOR UPDATE",
        returnId);
    if (rows.empty()) {
        throw std::runtime_error("Return not found: " + std::to_string(returnId));
    }
    std::string permanentProductId = rows[0][0].as<std::string>();
    std::string reason = rows[0][1].is_null() ? "" : rows[0][1].as<std::string>();
 
    txn.exec_params(
        "UPDATE returns SET status = 'RECEIVED', received_at = now() WHERE id = $1",
        returnId);
 
    LifecycleService::recordEvent(txn, permanentProductId,
                                   ProductEventType::RETURN_RECEIVED,
                                   "return", returnId, "{}", actorUserId);
 
    // Risk assessment is fetched here so it's ready and visible to the
    // inspector by the time they open this return — it does NOT decide
    // anything on its own. The result is persisted in ai_results by
    // AIClientService; inspect() below is where a human acts on it.
    AIClientService::assessReturnRisk(txn, permanentProductId, returnId, reason, "");
}
 
void ReturnService::inspect(pqxx::work &txn, const ReturnInspectionInput &input) {
    auto returnRows = txn.exec_params(
        "SELECT permanent_product_id, order_item_id FROM returns WHERE id = $1",
        input.returnId);
    if (returnRows.empty()) {
        throw std::runtime_error("Return not found: " + std::to_string(input.returnId));
    }
    std::string permanentProductId = returnRows[0][0].as<std::string>();
    int orderItemId = returnRows[0][1].as<int>();
 
    // Pull the most recent AI return-risk result for this product, if
    // any, so the inspector's decision links back to it — see
    // assessReturnRisk in markReceived().
    auto aiRows = txn.exec_params(
        "SELECT id, confidence FROM ai_results "
        "WHERE permanent_product_id = $1 AND ai_type = 'RETURN_RISK' "
        "ORDER BY created_at DESC LIMIT 1",
        permanentProductId);
 
    long long aiResultId = aiRows.empty() ? 0 : aiRows[0][0].as<long long>();
    double aiRiskScore = aiRows.empty() ? 0.0 : aiRows[0][1].as<double>();
 
    txn.exec_params(
        "INSERT INTO return_inspections "
        "(return_id, inspector_id, condition_notes, images_ref, ai_risk_score, ai_result_id, decision) "
        "VALUES ($1, $2, $3, $4, NULLIF($5, 0), NULLIF($6, 0), $7)",
        input.returnId, input.inspectorId, input.conditionNotes, input.imagesRef,
        aiRiskScore, aiResultId, input.decision);
 
    txn.exec_params(
        "UPDATE returns SET status = 'INSPECTED' WHERE id = $1", input.returnId);
 
    LifecycleService::recordEvent(txn, permanentProductId,
                                   ProductEventType::RETURN_INSPECTED,
                                   "return", input.returnId, "{}", input.inspectorId);
 
    if (input.decision == "RESTOCK") {
        auto productRow = txn.exec_params(
            "SELECT product_id FROM order_items WHERE id = $1", orderItemId);
        if (!productRow.empty()) {
            int productId = productRow[0][0].as<int>();
            InventoryService::addStock(txn, productId, 1, MovementType::RESTOCK,
                                        "return", input.returnId, input.inspectorId);
 
            LifecycleService::recordEvent(txn, permanentProductId,
                                           ProductEventType::RESTOCKED,
                                           "return", input.returnId, "{}", input.inspectorId);
        }
    }
}
 
}  // namespace merchantra
 
