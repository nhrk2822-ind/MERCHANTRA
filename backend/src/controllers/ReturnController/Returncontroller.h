
// HTTP handlers for /returns.
//
// Three steps map to ReturnService's three methods. "receive" wasn't
// in the original API sketch but is added here — without it there's
// no HTTP path to markReceived(), which is where the AI risk
// assessment gets triggered.
 
#pragma once
 
#include <drogon/HttpController.h>
 
namespace merchantra {
 
class ReturnController : public drogon::HttpController<ReturnController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ReturnController::createReturn, "/returns", drogon::Post, "merchantra::AuthFilter");
    ADD_METHOD_TO(ReturnController::receiveReturn, "/returns/{id}/receive", drogon::Post, "merchantra::AuthFilter");
    ADD_METHOD_TO(ReturnController::inspectReturn, "/returns/{id}/inspect", drogon::Post, "merchantra::AuthFilter");
    METHOD_LIST_END
 
    // Body: { "order_item_id": 12, "permanent_product_id": "MCH-P-000125",
    //         "reason": "wrong size" }
    void createReturn(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    // No body needed — marks the return RECEIVED and triggers the AI
    // return-risk assessment.
    void receiveReturn(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                        int id);
 
    // Body: { "inspector_id": 4, "condition_notes": "box damp, item fine",
    //         "images_ref": "https://.../1.jpg,https://.../2.jpg",
    //         "decision": "RESTOCK" }
    void inspectReturn(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                        int id);
};
 
}  // namespace merchantra
 
