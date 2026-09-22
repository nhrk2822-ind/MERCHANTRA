#include "InventoryService.h"

#include <stdexcept>
#include <string>

namespace merchantra {

namespace {

// ------------------------------------------------------------
// Record an inventory movement
// ------------------------------------------------------------
void logMovement(
    pqxx::work &txn,
    int productId,
    int quantity,
    MovementType type,
    const std::string &referenceType,
    int referenceId,
    int actorUserId,
    const std::string &notes = "") {

    txn.exec_params(
        "INSERT INTO inventory_movements "
        "(product_id, movement_type, quantity, reference_type, "
        "reference_id, created_by, notes) "
        "VALUES ($1, $2, $3, NULLIF($4, ''), "
        "NULLIF($5, 0), NULLIF($6, 0), NULLIF($7, ''))",
        productId,
        InventoryService::movementTypeToString(type),
        quantity,
        referenceType,
        referenceId,
        actorUserId,
        notes
    );
}

// ------------------------------------------------------------
// Only keep the inventory values we actually need.
// Do not return pqxx::row_ref because the result may go out
// of scope after this function returns.
// ------------------------------------------------------------
struct LockedInventory {
    int quantityOnHand;
    int quantityReserved;
};

LockedInventory lockInventoryRow(
    pqxx::work &txn,
    int productId) {

    auto rows = txn.exec_params(
        "SELECT quantity_on_hand, quantity_reserved "
        "FROM inventory "
        "WHERE product_id = $1 "
        "FOR UPDATE",
        productId
    );

    if (rows.empty()) {
        throw std::runtime_error(
            "No inventory row for product_id " +
            std::to_string(productId)
        );
    }

    const auto &row = rows[0];

    return LockedInventory{
        row["quantity_on_hand"].as<int>(),
        row["quantity_reserved"].as<int>()
    };
}

} // namespace


// ------------------------------------------------------------
// Convert movement type to database string
// ------------------------------------------------------------
std::string InventoryService::movementTypeToString(
    MovementType type) {

    switch (type) {

        case MovementType::INBOUND:
            return "INBOUND";

        case MovementType::OUTBOUND:
            return "OUTBOUND";

        case MovementType::RESERVED:
            return "RESERVED";

        case MovementType::RELEASED:
            return "RELEASED";

        case MovementType::RESTOCK:
            return "RESTOCK";

        case MovementType::ADJUSTMENT:
            return "ADJUSTMENT";
    }

    return "UNKNOWN";
}


// ------------------------------------------------------------
// Add stock
// ------------------------------------------------------------
void InventoryService::addStock(
    pqxx::work &txn,
    int productId,
    int quantity,
    MovementType movementType,
    const std::string &referenceType,
    int referenceId,
    int actorUserId) {

    if (quantity <= 0) {
        throw std::invalid_argument(
            "quantity must be positive");
    }

    txn.exec_params(
        "UPDATE inventory SET "
        "quantity_on_hand = quantity_on_hand + $2, "
        "updated_at = now() "
        "WHERE product_id = $1",
        productId,
        quantity
    );

    logMovement(
        txn,
        productId,
        quantity,
        movementType,
        referenceType,
        referenceId,
        actorUserId
    );
}


// ------------------------------------------------------------
// Reserve stock
// ------------------------------------------------------------
void InventoryService::reserveStock(
    pqxx::work &txn,
    int productId,
    int quantity,
    const std::string &referenceType,
    int referenceId,
    int actorUserId) {

    if (quantity <= 0) {
        throw std::invalid_argument(
            "quantity must be positive");
    }

    const auto inventory =
        lockInventoryRow(txn, productId);

    const int available =
        inventory.quantityOnHand -
        inventory.quantityReserved;

    if (available < quantity) {
        throw std::runtime_error(
            "Insufficient available stock for product_id " +
            std::to_string(productId)
        );
    }

    txn.exec_params(
        "UPDATE inventory SET "
        "quantity_reserved = quantity_reserved + $2, "
        "updated_at = now() "
        "WHERE product_id = $1",
        productId,
        quantity
    );

    logMovement(
        txn,
        productId,
        quantity,
        MovementType::RESERVED,
        referenceType,
        referenceId,
        actorUserId
    );
}


// ------------------------------------------------------------
// Release reserved stock
// ------------------------------------------------------------
void InventoryService::releaseReservedStock(
    pqxx::work &txn,
    int productId,
    int quantity,
    const std::string &referenceType,
    int referenceId,
    int actorUserId) {

    if (quantity <= 0) {
        throw std::invalid_argument(
            "quantity must be positive");
    }

    txn.exec_params(
        "UPDATE inventory SET "
        "quantity_reserved = GREATEST(quantity_reserved - $2, 0), "
        "updated_at = now() "
        "WHERE product_id = $1",
        productId,
        quantity
    );

    logMovement(
        txn,
        productId,
        quantity,
        MovementType::RELEASED,
        referenceType,
        referenceId,
        actorUserId
    );
}


// ------------------------------------------------------------
// Ship reserved stock
// ------------------------------------------------------------
void InventoryService::shipReservedStock(
    pqxx::work &txn,
    int productId,
    int quantity,
    const std::string &referenceType,
    int referenceId,
    int actorUserId) {

    if (quantity <= 0) {
        throw std::invalid_argument(
            "quantity must be positive");
    }

    const auto inventory =
        lockInventoryRow(txn, productId);

    if (inventory.quantityReserved < quantity) {
        throw std::runtime_error(
            "Cannot ship more than reserved for product_id " +
            std::to_string(productId)
        );
    }

    txn.exec_params(
        "UPDATE inventory SET "
        "quantity_on_hand = quantity_on_hand - $2, "
        "quantity_reserved = quantity_reserved - $2, "
        "updated_at = now() "
        "WHERE product_id = $1",
        productId,
        quantity
    );

    logMovement(
        txn,
        productId,
        quantity,
        MovementType::OUTBOUND,
        referenceType,
        referenceId,
        actorUserId
    );
}


// ------------------------------------------------------------
// Adjust stock
// ------------------------------------------------------------
void InventoryService::adjustStock(
    pqxx::work &txn,
    int productId,
    int delta,
    const std::string &reason,
    int actorUserId) {

    if (delta == 0) {
        return;
    }

    txn.exec_params(
        "UPDATE inventory SET "
        "quantity_on_hand = quantity_on_hand + $2, "
        "updated_at = now() "
        "WHERE product_id = $1",
        productId,
        delta
    );

    logMovement(
        txn,
        productId,
        delta,
        MovementType::ADJUSTMENT,
        "manual_adjustment",
        0,
        actorUserId,
        reason
    );
}

} // namespace merchantra