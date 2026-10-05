#include "ReturnService.h"

#include <stdexcept>
#include <string>

#include "../AIClientService/AIClientService.h"
#include "../InventoryService/InventoryService.h"
#include "../LifecycleService/LifecycleService.h"

namespace merchantra {

int ReturnService::requestReturn(
    pqxx::work &txn,
    int orderItemId,
    const std::string &permanentProductId,
    const std::string &reason,
    int actorUserId) {

    if (orderItemId <= 0) {
        throw std::runtime_error("Invalid order item id");
    }

    if (permanentProductId.empty()) {
        throw std::runtime_error("Permanent product id cannot be empty");
    }

    // Make sure the order item exists and the permanent product id
    // actually belongs to that order item.
    auto itemRows = txn.exec_params(
        R"SQL(
            SELECT product_id, permanent_product_id
            FROM order_items
            WHERE id = $1
        )SQL",
        orderItemId
    );

    if (itemRows.empty()) {
        throw std::runtime_error("Order item not found");
    }

    const std::string storedPermanentProductId =
        itemRows[0]["permanent_product_id"].as<std::string>();

    if (storedPermanentProductId != permanentProductId) {
        throw std::runtime_error(
            "Permanent product id does not match order item");
    }

    // A return starts after delivery.
    auto orderRows = txn.exec_params(
        R"SQL(
            SELECT o.status
            FROM orders o
            INNER JOIN order_items oi
                ON oi.order_id = o.id
            WHERE oi.id = $1
        )SQL",
        orderItemId
    );

    if (orderRows.empty()) {
        throw std::runtime_error("Order for order item not found");
    }

    const std::string orderStatus =
        orderRows[0]["status"].as<std::string>();

    if (orderStatus != "DELIVERED") {
        throw std::runtime_error(
            "Return can only be requested for a delivered order");
    }

    auto row = txn.exec_params(
        R"SQL(
            INSERT INTO returns
                (order_item_id, permanent_product_id, reason, status)
            VALUES
                ($1, $2, $3, 'REQUESTED')
            RETURNING id
        )SQL",
        orderItemId,
        permanentProductId,
        reason
    );

    if (row.empty()) {
        throw std::runtime_error("Failed to create return");
    }

    const int returnId = row[0]["id"].as<int>();

    LifecycleService::recordEvent(
        txn,
        permanentProductId,
        ProductEventType::RETURN_REQUESTED,
        "return",
        returnId,
        "{}",
        actorUserId
    );

    return returnId;
}


void ReturnService::markReceived(
    pqxx::work &txn,
    int returnId,
    int actorUserId) {

    if (returnId <= 0) {
        throw std::runtime_error("Invalid return id");
    }

    auto rows = txn.exec_params(
        R"SQL(
            SELECT
                permanent_product_id,
                reason,
                status
            FROM returns
            WHERE id = $1
            FOR UPDATE
        )SQL",
        returnId
    );

    if (rows.empty()) {
        throw std::runtime_error(
            "Return not found: " + std::to_string(returnId));
    }

    const std::string permanentProductId =
        rows[0]["permanent_product_id"].as<std::string>();

    const std::string reason =
        rows[0]["reason"].is_null()
            ? ""
            : rows[0]["reason"].as<std::string>();

    const std::string currentStatus =
        rows[0]["status"].as<std::string>();

    if (currentStatus != "REQUESTED") {
        throw std::runtime_error(
            "Return can only be received when status is REQUESTED");
    }

    txn.exec_params(
        R"SQL(
            UPDATE returns
            SET
                status = 'RECEIVED',
                received_at = now()
            WHERE id = $1
        )SQL",
        returnId
    );

    LifecycleService::recordEvent(
        txn,
        permanentProductId,
        ProductEventType::RETURN_RECEIVED,
        "return",
        returnId,
        "{}",
        actorUserId
    );

    // AI only provides risk information.
    // It does not make the inspection decision.
    AIClientService::assessReturnRisk(
        txn,
        permanentProductId,
        returnId,
        reason,
        ""
    );
}


void ReturnService::inspect(
    pqxx::work &txn,
    const ReturnInspectionInput &input) {

    if (input.returnId <= 0) {
        throw std::runtime_error("Invalid return id");
    }

    if (input.inspectorId <= 0) {
        throw std::runtime_error("Invalid inspector id");
    }

    if (input.decision != "RESTOCK" &&
        input.decision != "DAMAGED_WRITE_OFF" &&
        input.decision != "FLAG_FOR_REVIEW") {

        throw std::runtime_error(
            "Invalid inspection decision");
    }

    auto returnRows = txn.exec_params(
        R"SQL(
            SELECT
                permanent_product_id,
                order_item_id,
                status
            FROM returns
            WHERE id = $1
            FOR UPDATE
        )SQL",
        input.returnId
    );

    if (returnRows.empty()) {
        throw std::runtime_error(
            "Return not found: " +
            std::to_string(input.returnId));
    }

    const std::string permanentProductId =
        returnRows[0]["permanent_product_id"].as<std::string>();

    const int orderItemId =
        returnRows[0]["order_item_id"].as<int>();

    const std::string returnStatus =
        returnRows[0]["status"].as<std::string>();

    if (returnStatus != "RECEIVED") {
        throw std::runtime_error(
            "Return can only be inspected when status is RECEIVED");
    }

    auto orderItemRows = txn.exec_params(
        R"SQL(
            SELECT
                product_id,
                quantity
            FROM order_items
            WHERE id = $1
        )SQL",
        orderItemId
    );

    if (orderItemRows.empty()) {
        throw std::runtime_error("Order item not found");
    }

    const int productId =
        orderItemRows[0]["product_id"].as<int>();

    const int quantity =
        orderItemRows[0]["quantity"].as<int>();


    // Get the latest AI return-risk result.
    auto aiRows = txn.exec_params(
        R"SQL(
            SELECT
                id,
                confidence
            FROM ai_results
            WHERE permanent_product_id = $1
              AND ai_type = 'RETURN_RISK'
            ORDER BY created_at DESC
            LIMIT 1
        )SQL",
        permanentProductId
    );

    long long aiResultId =
        aiRows.empty()
            ? 0
            : aiRows[0]["id"].as<long long>();

    double aiRiskScore =
        aiRows.empty()
            ? 0.0
            : aiRows[0]["confidence"].as<double>();


    txn.exec_params(
        R"SQL(
            INSERT INTO return_inspections
                (
                    return_id,
                    inspector_id,
                    condition_notes,
                    images_ref,
                    ai_risk_score,
                    ai_result_id,
                    decision
                )
            VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    NULLIF($5, 0),
                    NULLIF($6, 0),
                    $7
                )
        )SQL",
        input.returnId,
        input.inspectorId,
        input.conditionNotes,
        input.imagesRef,
        aiRiskScore,
        aiResultId,
        input.decision
    );


    txn.exec_params(
        R"SQL(
            UPDATE returns
            SET status = 'INSPECTED'
            WHERE id = $1
        )SQL",
        input.returnId
    );


    LifecycleService::recordEvent(
        txn,
        permanentProductId,
        ProductEventType::RETURN_INSPECTED,
        "return",
        input.returnId,
        "{}",
        input.inspectorId
    );


    // Only an explicit human RESTOCK decision changes inventory.
    if (input.decision == "RESTOCK") {

        InventoryService::addStock(
            txn,
            productId,
            quantity,
            MovementType::RESTOCK,
            "return",
            input.returnId,
            input.inspectorId
        );

        LifecycleService::recordEvent(
            txn,
            permanentProductId,
            ProductEventType::RESTOCKED,
            "return",
            input.returnId,
            "{}",
            input.inspectorId
        );
    }
}

} // namespace merchantra