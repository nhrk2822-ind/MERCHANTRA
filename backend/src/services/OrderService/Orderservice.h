
// Orchestrates order creation and status transitions.
//
// This is the ONLY place that creates orders/order_items — it ties
// together InventoryService (reserve stock) and LifecycleService
// (record ORDER_CREATED on every item's product timeline) in one
// transaction, so an order is never created without its stock being
// reserved, or vice versa.
 
#pragma once
 
#include <pqxx/pqxx>
#include <string>
#include <vector>
 
namespace merchantra {
 
struct OrderItemInput {
    int productId;
    int quantity;
    double unitPrice;
};
 
struct OrderService {
    // Creates an order + its items, reserves stock for each item, and
    // records an ORDER_CREATED lifecycle event per product. Throws (and
    // the caller should roll back) if any item's stock can't be
    // reserved — a partially-stocked order is never created.
    //
    // Returns the new order's id.
    static int createOrder(pqxx::work &txn,
                            const std::string &orderNumber,
                            int marketplaceId,  // 0 = manual/offline order
                            const std::string &customerRef,
                            const std::vector<OrderItemInput> &items,
                            int actorUserId);
 
    // Valid transitions: CREATED -> PACKING -> PACKED -> SHIPPED -> DELIVERED,
    // or CREATED/PACKING/PACKED -> CANCELLED, or DELIVERED -> RETURNED.
    // Throws if the transition isn't valid from the order's current status.
    static void updateStatus(pqxx::work &txn,
                              int orderId,
                              const std::string &newStatus,
                              int actorUserId);
};
 
}  // namespace merchantra
 
