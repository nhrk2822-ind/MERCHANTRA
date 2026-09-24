#include "ReturnController.h"

#include "../../auth/RbacUtils.h"
#include "../../database/Database.h"
#include "../../services/AuditService/AuditService.h"
#include "../../services/ReturnService/ReturnService.h"

namespace merchantra {

namespace {
drogon::HttpResponsePtr jsonError(drogon::HttpStatusCode status, const std::string &message) {
    Json::Value json;
    json["message"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(status);
    return resp;
}
}  // namespace

void ReturnController::createReturn(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto body = req->getJsonObject();
    if (!body || !(*body).isMember("order_item_id") ||
        !(*body).isMember("permanent_product_id")) {
        callback(jsonError(drogon::k400BadRequest,
                            "order_item_id and permanent_product_id are required"));
        return;
    }

    int orderItemId = (*body)["order_item_id"].asInt();
    std::string permanentProductId = (*body)["permanent_product_id"].asString();
    std::string reason = (*body).get("reason", "").asString();

    int actorUserId = req->getAttributes()->get<int>("user_id");

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        int returnId = ReturnService::requestReturn(txn, orderItemId, permanentProductId,
                                                       reason, actorUserId);
        txn.commit();

        Json::Value json;
        json["id"] = returnId;
        json["status"] = "REQUESTED";

        auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
        resp->setStatusCode(drogon::k201Created);
        callback(resp);
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k400BadRequest, e.what()));
    }
}

void ReturnController::receiveReturn(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int id) {
    int actorUserId = req->getAttributes()->get<int>("user_id");

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        ReturnService::markReceived(txn, id, actorUserId);
        txn.commit();

        Json::Value json;
        json["id"] = id;
        json["status"] = "RECEIVED";
        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k400BadRequest, e.what()));
    }
}

void ReturnController::inspectReturn(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int id) {
    if (!RbacUtils::requireRole(req, callback, {"ADMIN", "WAREHOUSE_MANAGER"})) return;

    auto body = req->getJsonObject();
    if (!body || !(*body).isMember("decision")) {
        callback(jsonError(drogon::k400BadRequest, "decision is required"));
        return;
    }

    ReturnInspectionInput input;
    input.returnId = id;
    input.inspectorId = (*body).get("inspector_id", 0).asInt();
    input.conditionNotes = (*body).get("condition_notes", "").asString();
    input.imagesRef = (*body).get("images_ref", "").asString();
    input.decision = (*body)["decision"].asString();

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        ReturnService::inspect(txn, input);
        AuditService::log(txn, input.inspectorId, "RETURN_INSPECTED", "return", id,
                            "{\"decision\":\"" + input.decision + "\"}");
        txn.commit();

        Json::Value json;
        json["id"] = id;
        json["status"] = "INSPECTED";
        json["decision"] = input.decision;
        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k400BadRequest, e.what()));
    }
}

}  // namespace merchantra