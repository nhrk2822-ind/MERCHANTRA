// Single writer to product_events.
//
// Every service that causes a lifecycle-meaningful event (product
// created, order placed, packing started, shipped, returned, ...)
// calls this instead of writing to product_events itself. Keeps the
// event_type vocabulary and the table's shape in exactly one place.

#pragma once

#include <pqxx/pqxx>
#include <string>

namespace merchantra {

enum class ProductEventType {
    PRODUCT_CREATED,
    MARKETPLACE_LISTED,
    INVENTORY_ADDED,
    ORDER_CREATED,
    PACKING_STARTED,
    BARCODE_SCANNED,
    VISUAL_VERIFICATION,
    PACKING_COMPLETED,
    SHIPPED,
    DELIVERED,
    RETURN_REQUESTED,
    RETURN_RECEIVED,
    RETURN_INSPECTED,
    RESTOCKED,
};

struct LifecycleService {
    // Records one event on a product's timeline. Takes the CALLER's
    // transaction (same reasoning as ProductIdService::generateNextId) â€”
    // the event write must succeed or fail atomically with whatever
    // business action triggered it, not as a separate commit.
    static void recordEvent(pqxx::work &txn,
                             const std::string &permanentProductId,
                             ProductEventType eventType,
                             const std::string &referenceType = "",
                             int referenceId = 0,
                             const std::string &metadataJson = "{}",
                             int actorUserId = 0);

    // Converts an enum value to its stored string form, e.g.
    // ProductEventType::PRODUCT_CREATED -> "PRODUCT_CREATED".
    static std::string eventTypeToString(ProductEventType eventType);
};

}  // namespace merchantra