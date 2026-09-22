#include "OrderService.h"

#include <map>
#include <stdexcept>
#include <string>
#include <vector>

#include "../InventoryService/InventoryService.h"
#include "../LifecycleService/LifecycleService.h"

namespace merchantra {

namespace {

bool isValidTransition(
    const std::string &from,
    const std::string &to) {

    static const std::map<std::string, std::vector<std::string>> allowed = {
        {"CREATED",  {"PACKING", "CANCELLED"}},
        {"PACKING",  {"PACKED", "CANCELLED"}},
        {"PACKED",   {"SHIPPED", "CANCELLED"}},
        {"SHIPPED",  {"DELIVERED"}},
        {"DELIVERED", {"RETURNED"}}
    };

    auto it = allowed.find(from);

    if (it == allowed.end()) {
        return false;
    }

    for (const auto &next : it->second) {
        if (next == to) {
            return true;
        }
    }

    return false;
}

} // namespace


int OrderService::createOrder(
    pqxx::work &txn,
    const std::string &orderNumber,
    int marketplaceId,
    const std::string &customerRef,
    const std::vector<OrderItemInput> &items,
    int actorUserId) {

    if (orderNumber.empty()) {
        throw std::runtime_error(
            "Order number cannot be empty");
    }

    if (items.empty()) {
        throw std::runtime_error(
            "Order must contain at least one item");
    }

    double totalAmount = 0.0;

    for (const auto &item : items) {

        if (item.productId <= 0) {
            throw std::runtime_error(
                "Invalid product id");
        }

        if (item.quantity <= 0) {
            throw std::runtime_error(
                "Quantity must be greater than zero");
        }

        if (item.unitPrice < 0.0) {
            throw std::runtime_error(
                "Unit price cannot be negative");
        }

        totalAmount +=
            static_cast<double>(item.quantity) *
            item.unitPrice;
    }

    /*
     * Create the order.
     *
     * total_amount is calculated here from the order items so that
     * the value returned by OrderController::listOrders() is available.
     */
    auto orderRows = txn.exec_params(
        R"SQL(
            INSERT INTO orders
                (
                    order_number,
                    marketplace_id,
                    customer_ref,
                    status,
                    total_amount
                )
            VALUES
                ($1, NULLIF($2, 0), $3, 'CREATED', $4)
            RETURNING id
        )SQL",
        orderNumber,
        marketplaceId,
        customerRef,
        totalAmount
    );

    if (orderRows.empty()) {
        throw std::runtime_error(
            "Failed to create order");
    }

    const int orderId =
        orderRows[0]["id"].as<int>();


    for (const auto &item : items) {

        /*
         * Get the permanent product identity before creating the
         * order-item record. The controller already expects this
         * value from order_items.
         */
        auto productRows = txn.exec_params(
            R"SQL(
                SELECT permanent_product_id
                FROM inventory
                WHERE product_id = $1
            )SQL",
            item.productId
        );

        if (productRows.empty()) {
            throw std::runtime_error(
                "Inventory record not found for product " +
                std::to_string(item.productId));
        }

        const std::string permanentProductId =
            productRows[0]["permanent_product_id"]
                .as<std::string>();


        /*
         * Reserve stock first.
         *
         * If reservation fails, an exception is thrown and the
         * caller's transaction is not committed.
         */
        InventoryService::reserveStock(
            txn,
            item.productId,
            item.quantity,
            "ORDER",
            orderId,
            actorUserId
        );


        /*
         * Store the order item.
         */
        txn.exec_params(
            R"SQL(
                INSERT INTO order_items
                    (
                        order_id,
                        product_id,
                        permanent_product_id,
                        quantity,
                        unit_price
                    )
                VALUES
                    ($1, $2, $3, $4, $5)
            )SQL",
            orderId,
            item.productId,
            permanentProductId,
            item.quantity,
            item.unitPrice
        );


        /*
         * Record the product lifecycle event in the same transaction.
         */
        LifecycleService::recordEvent(
            txn,
            permanentProductId,
            ProductEventType::ORDER_CREATED,
            "ORDER",
            orderId,
            "{}",
            actorUserId
        );
    }

    return orderId;
}


void OrderService::updateStatus(
    pqxx::work &txn,
    int orderId,
    const std::string &newStatus,
    int actorUserId) {

    if (orderId <= 0) {
        throw std::runtime_error(
            "Invalid order id");
    }

    if (newStatus.empty()) {
        throw std::runtime_error(
            "Order status cannot be empty");
    }


    /*
     * Lock the order while checking/updating its status.
     */
    auto orderRows = txn.exec_params(
        R"SQL(
            SELECT status
            FROM orders
            WHERE id = $1
            FOR UPDATE
        )SQL",
        orderId
    );

    if (orderRows.empty()) {
        throw std::runtime_error(
            "Order not found");
    }

    const std::string currentStatus =
        orderRows[0]["status"].as<std::string>();


    if (!isValidTransition(
            currentStatus,
            newStatus)) {

        throw std::runtime_error(
            "Invalid order status transition: " +
            currentStatus +
            " -> " +
            newStatus);
    }


    /*
     * Get all products belonging to this order.
     */
    auto itemRows = txn.exec_params(
        R"SQL(
            SELECT
                product_id,
                permanent_product_id,
                quantity
            FROM order_items
            WHERE order_id = $1
        )SQL",
        orderId
    );

    if (itemRows.empty()) {
        throw std::runtime_error(
            "Order has no items");
    }


    /*
     * Cancellation releases the reserved quantity.
     */
    if (newStatus == "CANCELLED") {

        for (const auto &row : itemRows) {

            InventoryService::releaseReservedStock(
                txn,
                row["product_id"].as<int>(),
                row["quantity"].as<int>(),
                "ORDER",
                orderId,
                actorUserId
            );
        }
    }


    /*
     * Shipping consumes the reserved quantity.
     */
    if (newStatus == "SHIPPED") {

        for (const auto &row : itemRows) {

            InventoryService::shipReservedStock(
                txn,
                row["product_id"].as<int>(),
                row["quantity"].as<int>(),
                "ORDER",
                orderId,
                actorUserId
            );
        }
    }


    /*
     * Update order status.
     */
    txn.exec_params(
        R"SQL(
            UPDATE orders
            SET status = $1
            WHERE id = $2
        )SQL",
        newStatus,
        orderId
    );


    /*
     * Record lifecycle events for states that have a matching
     * ProductEventType.
     */
    ProductEventType eventType;
    bool hasLifecycleEvent = true;

    if (newStatus == "PACKING") {

        eventType =
            ProductEventType::PACKING_STARTED;

    } else if (newStatus == "SHIPPED") {

        eventType =
            ProductEventType::SHIPPED;

    } else if (newStatus == "DELIVERED") {

        eventType =
            ProductEventType::DELIVERED;

    } else {

        /*
         * PACKED and CANCELLED currently do not have their own
         * ProductEventType in LifecycleService.
         */
        hasLifecycleEvent = false;
    }


    if (hasLifecycleEvent) {

        for (const auto &row : itemRows) {

            LifecycleService::recordEvent(
                txn,
                row["permanent_product_id"]
                    .as<std::string>(),
                eventType,
                "ORDER",
                orderId,
                "{}",
                actorUserId
            );
        }
    }
}

} // namespace merchantra