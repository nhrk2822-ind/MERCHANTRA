// Owns all reads/writes to inventory + inventory_movements.
//
// inventory.quantity_on_hand/quantity_reserved must NEVER be updated
// directly by a controller â€” every change goes through here so the
// movements ledger and the current-state row stay in sync in one
// transaction.

#pragma once

#include <pqxx/pqxx>
#include <string>

namespace merchantra {

enum class MovementType {
    INBOUND,
    OUTBOUND,
    RESERVED,
    RELEASED,
    RESTOCK,
    ADJUSTMENT,
};

struct InventoryService {
    // Adds stock (e.g. new inbound shipment or a restock). Increases
    // quantity_on_hand and logs an INBOUND or RESTOCK movement.
    static void addStock(pqxx::work &txn,
                          int productId,
                          int quantity,
                          MovementType movementType,
                          const std::string &referenceType,
                          int referenceId,
                          int actorUserId);

    // Reserves stock for an order (moves it from available to reserved,
    // does not change quantity_on_hand). Throws if not enough available.
    static void reserveStock(pqxx::work &txn,
                              int productId,
                              int quantity,
                              const std::string &referenceType,
                              int referenceId,
                              int actorUserId);

    // Releases a previous reservation without shipping (e.g. order
    // cancelled) â€” reserved quantity goes back down, on_hand unchanged.
    static void releaseReservedStock(pqxx::work &txn,
                                      int productId,
                                      int quantity,
                                      const std::string &referenceType,
                                      int referenceId,
                                      int actorUserId);

    // Ships reserved stock out (order fulfilled): reduces both
    // quantity_on_hand and quantity_reserved by the same amount.
    static void shipReservedStock(pqxx::work &txn,
                                   int productId,
                                   int quantity,
                                   const std::string &referenceType,
                                   int referenceId,
                                   int actorUserId);

    // Manual correction (e.g. stock count mismatch found on audit).
    // delta can be negative.
    static void adjustStock(pqxx::work &txn,
                             int productId,
                             int delta,
                             const std::string &reason,
                             int actorUserId);

    static std::string movementTypeToString(MovementType type);
};

}  // namespace merchantra
