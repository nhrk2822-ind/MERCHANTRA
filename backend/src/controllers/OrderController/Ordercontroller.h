
// HTTP handlers for /orders. Thin wrapper over OrderService — no
// business logic (reservation, state machine) belongs here.
 
#pragma once
 
#include <drogon/HttpController.h>
 
namespace merchantra {
 
class OrderController : public drogon::HttpController<OrderController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(OrderController::listOrders, "/orders", drogon::Get, "merchantra::AuthFilter");
    ADD_METHOD_TO(OrderController::createOrder, "/orders", drogon::Post, "merchantra::AuthFilter");
    ADD_METHOD_TO(OrderController::getOrder, "/orders/{id}", drogon::Get, "merchantra::AuthFilter");
    ADD_METHOD_TO(OrderController::updateStatus, "/orders/{id}/status", drogon::Patch, "merchantra::AuthFilter");
    METHOD_LIST_END
 
    void listOrders(const drogon::HttpRequestPtr &req,
                     std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    // Body: { "order_number": "ORD-1001", "marketplace_id": 0,
    //         "customer_ref": "cust-42",
    //         "items": [ { "product_id": 5, "quantity": 2, "unit_price": 499.0 } ] }
    void createOrder(const drogon::HttpRequestPtr &req,
                      std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    void getOrder(const drogon::HttpRequestPtr &req,
                  std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                  int id);
 
    // Body: { "status": "PACKING" }
    void updateStatus(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                       int id);
};
 
}  // namespace merchantra
 
