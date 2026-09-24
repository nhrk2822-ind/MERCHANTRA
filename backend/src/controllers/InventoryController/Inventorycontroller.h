
// HTTP handlers for /inventory.
//
// Thin wrapper over InventoryService — this controller never touches
// the inventory/inventory_movements tables directly.
 
#pragma once
 
#include <drogon/HttpController.h>
 
namespace merchantra {
 
class InventoryController : public drogon::HttpController<InventoryController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(InventoryController::listInventory, "/inventory", drogon::Get, "merchantra::AuthFilter");
    ADD_METHOD_TO(InventoryController::lowStock, "/inventory/low-stock", drogon::Get, "merchantra::AuthFilter");
    ADD_METHOD_TO(InventoryController::adjust, "/inventory/adjust", drogon::Post, "merchantra::AuthFilter");
    METHOD_LIST_END
 
    void listInventory(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    void lowStock(const drogon::HttpRequestPtr &req,
                  std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    // Body: { "product_id": 12, "delta": -3, "reason": "damaged on shelf" }
    // Positive delta = stock found; negative = stock lost/damaged.
    void adjust(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};
 
}  // namespace merchantra
 
