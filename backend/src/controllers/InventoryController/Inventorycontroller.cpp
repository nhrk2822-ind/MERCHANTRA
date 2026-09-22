#include "InventoryController.h"

#include "../../auth/RbacUtils.h"
#include "../../database/Database.h"
#include "../../services/AuditService/AuditService.h"
#include "../../services/InventoryService/InventoryService.h"

namespace merchantra {

namespace {

drogon::HttpResponsePtr jsonError(
    drogon::HttpStatusCode status,
    const std::string &message) {

    Json::Value json;
    json["message"] = message;

    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(status);

    return resp;
}

template <typename Row>
Json::Value rowToInventoryJson(const Row &row) {
    Json::Value json;

    json["product_id"] =
        row["product_id"].as<int>();

    json["permanent_product_id"] =
        row["permanent_product_id"].as<std::string>();

    json["warehouse_location"] =
        row["warehouse_location"].as<std::string>();

    json["quantity_on_hand"] =
        row["quantity_on_hand"].as<int>();

    json["quantity_reserved"] =
        row["quantity_reserved"].as<int>();

    json["quantity_available"] =
        row["quantity_available"].as<int>();

    json["low_stock_threshold"] =
        row["low_stock_threshold"].as<int>();

    return json;
}

}  // namespace

void InventoryController::listInventory(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec(
            "SELECT i.product_id, p.permanent_product_id, "
            "i.warehouse_location, "
            "i.quantity_on_hand, i.quantity_reserved, "
            "i.quantity_available, i.low_stock_threshold "
            "FROM inventory i "
            "JOIN products p ON p.id = i.product_id "
            "ORDER BY p.permanent_product_id");

        txn.commit();

        Json::Value json(Json::arrayValue);

        for (const auto &row : rows) {
            json.append(rowToInventoryJson(row));
        }

        callback(
            drogon::HttpResponse::newHttpJsonResponse(json));

    } catch (const std::exception &e) {
        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

void InventoryController::lowStock(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec(
            "SELECT i.product_id, p.permanent_product_id, "
            "i.warehouse_location, "
            "i.quantity_on_hand, i.quantity_reserved, "
            "i.quantity_available, i.low_stock_threshold "
            "FROM inventory i "
            "JOIN products p ON p.id = i.product_id "
            "WHERE i.quantity_available <= i.low_stock_threshold "
            "ORDER BY i.quantity_available ASC");

        txn.commit();

        Json::Value json(Json::arrayValue);

        for (const auto &row : rows) {
            json.append(rowToInventoryJson(row));
        }

        callback(
            drogon::HttpResponse::newHttpJsonResponse(json));

    } catch (const std::exception &e) {
        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

void InventoryController::adjust(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    if (!RbacUtils::requireRole(
            req,
            callback,
            {"ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_MANAGER"})) {
        return;
    }

    auto body = req->getJsonObject();

    if (!body ||
        !(*body).isMember("product_id") ||
        !(*body).isMember("delta")) {

        callback(
            jsonError(
                drogon::k400BadRequest,
                "product_id and delta are required"));

        return;
    }

    int productId =
        (*body)["product_id"].asInt();

    int delta =
        (*body)["delta"].asInt();

    std::string reason =
        (*body).get("reason", "").asString();

    int actorUserId =
        req->getAttributes()->get<int>("user_id");

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        InventoryService::adjustStock(
            txn,
            productId,
            delta,
            reason,
            actorUserId);

        AuditService::log(
            txn,
            actorUserId,
            "INVENTORY_ADJUSTED",
            "product",
            productId,
            "{\"delta\":" +
                std::to_string(delta) +
                "}");

        txn.commit();

        Json::Value json;

        json["message"] =
            "Stock adjusted";

        json["product_id"] =
            productId;

        json["delta"] =
            delta;

        callback(
            drogon::HttpResponse::newHttpJsonResponse(json));

    } catch (const std::exception &e) {
        callback(
            jsonError(
                drogon::k400BadRequest,
                e.what()));
    }
}

}  // namespace merchantra