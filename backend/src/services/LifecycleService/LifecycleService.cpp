#include "LifecycleService.h"

namespace merchantra {

std::string LifecycleService::eventTypeToString(ProductEventType eventType) {
    switch (eventType) {
        case ProductEventType::PRODUCT_CREATED:      return "PRODUCT_CREATED";
        case ProductEventType::MARKETPLACE_LISTED:   return "MARKETPLACE_LISTED";
        case ProductEventType::INVENTORY_ADDED:      return "INVENTORY_ADDED";
        case ProductEventType::ORDER_CREATED:        return "ORDER_CREATED";
        case ProductEventType::PACKING_STARTED:      return "PACKING_STARTED";
        case ProductEventType::BARCODE_SCANNED:      return "BARCODE_SCANNED";
        case ProductEventType::VISUAL_VERIFICATION:  return "VISUAL_VERIFICATION";
        case ProductEventType::PACKING_COMPLETED:    return "PACKING_COMPLETED";
        case ProductEventType::SHIPPED:               return "SHIPPED";
        case ProductEventType::DELIVERED:             return "DELIVERED";
        case ProductEventType::RETURN_REQUESTED:      return "RETURN_REQUESTED";
        case ProductEventType::RETURN_RECEIVED:       return "RETURN_RECEIVED";
        case ProductEventType::RETURN_INSPECTED:      return "RETURN_INSPECTED";
        case ProductEventType::RESTOCKED:             return "RESTOCKED";
    }
    return "UNKNOWN";
}

void LifecycleService::recordEvent(pqxx::work &txn,
                                    const std::string &permanentProductId,
                                    ProductEventType eventType,
                                    const std::string &referenceType,
                                    int referenceId,
                                    const std::string &metadataJson,
                                    int actorUserId) {
    txn.exec_params(
        "INSERT INTO product_events "
        "(permanent_product_id, event_type, reference_type, reference_id, "
        " metadata_json, actor_user_id) "
        "VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, 0), $5::jsonb, NULLIF($6, 0))",
        permanentProductId,
        eventTypeToString(eventType),
        referenceType,
        referenceId,
        metadataJson,
        actorUserId);
}

}  // namespace merchantra