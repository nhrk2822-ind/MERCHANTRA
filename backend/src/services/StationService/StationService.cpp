
#include "StationService.h"
 
#include "../../services/AIClientService/AIClientService.h"
#include "../LifecycleService/LifecycleService.h"
 
namespace merchantra {
 
int StationService::openSession(pqxx::work &txn, const StationCheckInput &input) {
    auto row = txn.exec_params(
        "INSERT INTO packing_sessions "
        "(order_item_id, permanent_product_id, station_id, operator_id, status) "
        "VALUES ($1, $2, $3, NULLIF($4, 0), 'IN_PROGRESS') "
        "RETURNING id",
        input.orderItemId, input.permanentProductId, input.stationId, input.operatorId);
 
    int sessionId = row[0][0].as<int>();
 
    LifecycleService::recordEvent(txn, input.permanentProductId,
                                   ProductEventType::PACKING_STARTED,
                                   "packing_session", sessionId, "{}", input.operatorId);
 
    return sessionId;
}
 
void StationService::recordCheck(pqxx::work &txn,
                                  int sessionId,
                                  const std::string &checkType,
                                  const std::string &result,
                                  double aiConfidence,
                                  const std::string &detailsJson) {
    txn.exec_params(
        "INSERT INTO verification_results "
        "(packing_session_id, check_type, result, ai_confidence, details_json) "
        "VALUES ($1, $2, $3, NULLIF($4, 0), $5::jsonb)",
        sessionId, checkType, result, aiConfidence, detailsJson);
}
 
void StationService::finalizeSession(pqxx::work &txn, int sessionId, const std::string &finalStatus) {
    txn.exec_params(
        "UPDATE packing_sessions SET status = $2, completed_at = now() WHERE id = $1",
        sessionId, finalStatus);
}
 
StationCheckOutcome StationService::runFullVerification(pqxx::work &txn,
                                                          const StationCheckInput &input) {
    int sessionId = openSession(txn, input);
 
    StationCheckOutcome outcome{sessionId, "REVIEW", false, false, 0.0, 0.0};
 
    // CHECK 1: barcode match
    outcome.barcodeMatch = (input.scannedBarcode == input.expectedBarcode) &&
                            !input.scannedBarcode.empty();
    recordCheck(txn, sessionId, "BARCODE_MATCH",
                outcome.barcodeMatch ? "PASS" : "FAIL", 0.0,
                "{\"scanned\":\"" + input.scannedBarcode + "\"}");
 
    if (!outcome.barcodeMatch) {
        finalizeSession(txn, sessionId, "FAIL");
        outcome.finalStatus = "FAIL";
        LifecycleService::recordEvent(txn, input.permanentProductId,
                                       ProductEventType::PACKING_COMPLETED,
                                       "packing_session", sessionId, "{}", input.operatorId);
        return outcome;
    }
 
    // CHECK 2: quantity
    outcome.quantityMatch = (input.scannedQuantity == input.expectedQuantity);
    recordCheck(txn, sessionId, "QUANTITY",
                outcome.quantityMatch ? "PASS" : "FAIL", 0.0,
                "{\"scanned_quantity\":" + std::to_string(input.scannedQuantity) + "}");
 
    if (!outcome.quantityMatch) {
        finalizeSession(txn, sessionId, "FAIL");
        outcome.finalStatus = "FAIL";
        LifecycleService::recordEvent(txn, input.permanentProductId,
                                       ProductEventType::PACKING_COMPLETED,
                                       "packing_session", sessionId, "{}", input.operatorId);
        return outcome;
    }
 
    // CHECK 3: AI visual verification — only reached if barcode + quantity
    // both passed, so we don't spend an AI call on an already-failed item.
    auto aiResult = AIClientService::verifyProduct(txn, input.permanentProductId,
                                                     input.imageUrl, input.expectedCategory);
    outcome.aiConfidence = aiResult.confidence;
    outcome.aiDamageProbability = aiResult.damageProbability;
 
    recordCheck(txn, sessionId, "VISUAL_AI", aiResult.decision, aiResult.confidence,
                "{\"damage_probability\":" + std::to_string(aiResult.damageProbability) + "}");
 
    LifecycleService::recordEvent(txn, input.permanentProductId,
                                   ProductEventType::VISUAL_VERIFICATION,
                                   "packing_session", sessionId, "{}", input.operatorId);
 
    outcome.finalStatus = aiResult.decision;  // PASS | FAIL | REVIEW, degrades to REVIEW if AI unreachable
    finalizeSession(txn, sessionId, outcome.finalStatus);
 
    LifecycleService::recordEvent(txn, input.permanentProductId,
                                   ProductEventType::PACKING_COMPLETED,
                                   "packing_session", sessionId, "{}", input.operatorId);
 
    return outcome;
}
 
}  // namespace merchantra
 
