#include "OrderController.h"

#include "../../auth/RbacUtils.h"
#include "../../database/Database.h"
#include "../../services/OrderService/OrderService.h"

namespace merchantra {

namespace {

drogon::HttpResponsePtr jsonError(
    drogon::HttpStatusCode status,
    const std::string &message) {

    Json::Value json;
    json["message"] = message;

    auto resp =
        drogon::HttpResponse::newHttpJsonResponse(json);

    resp->setStatusCode(status);

    return resp;
}

template <typename Row>
Json::Value rowToOrderJson(const Row &row) {

    Json::Value json;

    json["id"] =
        row["id"].as<int>();

    json["order_number"] =
        row["order_number"].as<std::string>();

    json["status"] =
        row["status"].as<std::string>();

    json["total_amount"] =
        row["total_amount"].as<double>();

    json["created_at"] =
        row["created_at"].as<std::string>();

    return json;
}

}  // namespace

void OrderController::listOrders(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec(
            "SELECT id, order_number, status, total_amount, created_at "
            "FROM orders "
            "ORDER BY created_at DESC "
            "LIMIT 200");

        txn.commit();

        Json::Value json(Json::arrayValue);

        for (const auto &row : rows) {
            json.append(
                rowToOrderJson(row));
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

void OrderController::createOrder(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    auto body =
        req->getJsonObject();

    if (!body ||
        !(*body).isMember("order_number") ||
        !(*body).isMember("items") ||
        !(*body)["items"].isArray() ||
        (*body)["items"].empty()) {

        callback(
            jsonError(
                drogon::k400BadRequest,
                "order_number and a non-empty items array are required"));

        return;
    }

    std::string orderNumber =
        (*body)["order_number"].asString();

    int marketplaceId =
        (*body).get("marketplace_id", 0).asInt();

    std::string customerRef =
        (*body).get("customer_ref", "").asString();

    std::vector<OrderItemInput> items;

    for (const auto &itemJson :
         (*body)["items"]) {

        if (!itemJson.isMember("product_id") ||
            !itemJson.isMember("quantity") ||
            !itemJson.isMember("unit_price")) {

            callback(
                jsonError(
                    drogon::k400BadRequest,
                    "Each item needs product_id, quantity, unit_price"));

            return;
        }

        items.push_back(
            OrderItemInput{
                itemJson["product_id"].asInt(),
                itemJson["quantity"].asInt(),
                itemJson["unit_price"].asDouble()
            });
    }

    int actorUserId =
        req->getAttributes()->get<int>("user_id");

    try {

        auto conn =
            Database::getConnection();

        pqxx::work txn(*conn);

        int orderId =
            OrderService::createOrder(
                txn,
                orderNumber,
                marketplaceId,
                customerRef,
                items,
                actorUserId);

        txn.commit();

        Json::Value json;

        json["id"] =
            orderId;

        json["order_number"] =
            orderNumber;

        json["status"] =
            "CREATED";

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(json);

        resp->setStatusCode(
            drogon::k201Created);

        callback(resp);

    } catch (const std::exception &e) {

        callback(
            jsonError(
                drogon::k400BadRequest,
                e.what()));
    }
}

void OrderController::getOrder(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int id) {

    try {

        auto conn =
            Database::getConnection();

        pqxx::work txn(*conn);

        auto orderRows =
            txn.exec_params(
                "SELECT id, order_number, status, total_amount, created_at "
                "FROM orders "
                "WHERE id = $1",
                id);

        if (orderRows.empty()) {

            callback(
                jsonError(
                    drogon::k404NotFound,
                    "Order not found"));

            return;
        }

        auto itemRows =
            txn.exec_params(
                "SELECT product_id, permanent_product_id, quantity, unit_price "
                "FROM order_items "
                "WHERE order_id = $1",
                id);

        txn.commit();

        Json::Value json =
            rowToOrderJson(orderRows[0]);

        Json::Value itemsJson(
            Json::arrayValue);

        for (const auto &row :
             itemRows) {

            Json::Value item;

            item["product_id"] =
                row["product_id"].as<int>();

            item["permanent_product_id"] =
                row["permanent_product_id"].as<std::string>();

            item["quantity"] =
                row["quantity"].as<int>();

            item["unit_price"] =
                row["unit_price"].as<double>();

            itemsJson.append(item);
        }

        json["items"] =
            itemsJson;

        callback(
            drogon::HttpResponse::newHttpJsonResponse(json));

    } catch (const std::exception &e) {

        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

void OrderController::updateStatus(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int id) {

    if (!RbacUtils::requireRole(
            req,
            callback,
            {"ADMIN",
             "WAREHOUSE_MANAGER",
             "PACKING_OPERATOR"})) {

        return;
    }

    auto body =
        req->getJsonObject();

    if (!body ||
        !(*body).isMember("status")) {

        callback(
            jsonError(
                drogon::k400BadRequest,
                "status is required"));

        return;
    }

    std::string newStatus =
        (*body)["status"].asString();

    int actorUserId =
        req->getAttributes()->get<int>("user_id");

    try {

        auto conn =
            Database::getConnection();

        pqxx::work txn(*conn);

        OrderService::updateStatus(
            txn,
            id,
            newStatus,
            actorUserId);

        txn.commit();

        Json::Value json;

        json["id"] =
            id;

        json["status"] =
            newStatus;

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