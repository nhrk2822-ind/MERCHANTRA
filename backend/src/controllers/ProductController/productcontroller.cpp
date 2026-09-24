#include "ProductController.h"

#include "../../auth/RbacUtils.h"
#include "../../database/Database.h"
#include "../../services/ProductIdService/Productidservice.h"

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

// Works with pqxx::row, row_ref and result iterator references.
template <typename Row>
Json::Value rowToProductJson(const Row &row) {
    Json::Value json;

    json["id"] =
        row["id"].as<int>();

    json["permanent_product_id"] =
        row["permanent_product_id"].as<std::string>();

    json["name"] =
        row["name"].as<std::string>();

    json["description"] =
        row["description"].is_null()
            ? ""
            : row["description"].as<std::string>();

    json["category"] =
        row["category"].is_null()
            ? ""
            : row["category"].as<std::string>();

    json["sku"] =
        row["sku"].is_null()
            ? ""
            : row["sku"].as<std::string>();

    json["status"] =
        row["status"].as<std::string>();

    return json;
}

}  // namespace

void ProductController::listProducts(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec(
            "SELECT id, permanent_product_id, name, description, "
            "category, sku, status "
            "FROM products "
            "ORDER BY created_at DESC "
            "LIMIT 200");

        txn.commit();

        Json::Value json(Json::arrayValue);

        for (const auto &row : rows) {
            json.append(rowToProductJson(row));
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

void ProductController::createProduct(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    if (!RbacUtils::requireRole(
            req,
            callback,
            {"ADMIN", "SELLER"})) {
        return;
    }

    auto body = req->getJsonObject();

    if (!body || !(*body).isMember("name")) {
        callback(
            jsonError(
                drogon::k400BadRequest,
                "name is required"));
        return;
    }

    const std::string name =
        (*body)["name"].asString();

    const std::string description =
        (*body).get("description", "").asString();

    const std::string category =
        (*body).get("category", "").asString();

    const std::string sku =
        (*body).get("sku", "").asString();

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        // Generated inside THIS transaction so the row lock
        // covers the insert below.
        std::string permanentId =
            ProductIdService::generateNextId(txn);

        auto inserted = txn.exec_params(
            "INSERT INTO products "
            "(permanent_product_id, name, description, category, sku, status) "
            "VALUES ($1, $2, $3, $4, $5, 'ACTIVE') "
            "RETURNING id, permanent_product_id, name, description, "
            "category, sku, status",
            permanentId,
            name,
            description,
            category,
            sku);

        txn.commit();

        // NOTE: once LifecycleService exists, this is where we call
        // LifecycleService::recordEvent(permanentId, "PRODUCT_CREATED", ...)

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(
                rowToProductJson(inserted[0]));

        resp->setStatusCode(
            drogon::k201Created);

        callback(resp);

    } catch (const std::exception &e) {
        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

void ProductController::getProduct(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string permanentId) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec_params(
            "SELECT id, permanent_product_id, name, description, "
            "category, sku, status "
            "FROM products "
            "WHERE permanent_product_id = $1",
            permanentId);

        txn.commit();

        if (rows.empty()) {
            callback(
                jsonError(
                    drogon::k404NotFound,
                    "Product not found"));
            return;
        }

        callback(
            drogon::HttpResponse::newHttpJsonResponse(
                rowToProductJson(rows[0])));

    } catch (const std::exception &e) {
        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

void ProductController::updateProduct(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string permanentId) {

    auto body = req->getJsonObject();

    if (!body) {
        callback(
            jsonError(
                drogon::k400BadRequest,
                "Request body required"));
        return;
    }

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        // Partial update: only fields present in the body are changed.
        auto rows = txn.exec_params(
            "UPDATE products SET "
            "name = COALESCE($2, name), "
            "description = COALESCE($3, description), "
            "category = COALESCE($4, category), "
            "sku = COALESCE($5, sku), "
            "status = COALESCE($6, status), "
            "updated_at = now() "
            "WHERE permanent_product_id = $1 "
            "RETURNING id, permanent_product_id, name, description, "
            "category, sku, status",

            permanentId,

            (*body).isMember("name")
                ? (*body)["name"].asString()
                : pqxx::zview(),

            (*body).isMember("description")
                ? (*body)["description"].asString()
                : pqxx::zview(),

            (*body).isMember("category")
                ? (*body)["category"].asString()
                : pqxx::zview(),

            (*body).isMember("sku")
                ? (*body)["sku"].asString()
                : pqxx::zview(),

            (*body).isMember("status")
                ? (*body)["status"].asString()
                : pqxx::zview());

        txn.commit();

        if (rows.empty()) {
            callback(
                jsonError(
                    drogon::k404NotFound,
                    "Product not found"));
            return;
        }

        callback(
            drogon::HttpResponse::newHttpJsonResponse(
                rowToProductJson(rows[0])));

    } catch (const std::exception &e) {
        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

void ProductController::getTimeline(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string permanentId) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec_params(
            "SELECT event_type, reference_type, reference_id, "
            "metadata_json, created_at "
            "FROM product_events "
            "WHERE permanent_product_id = $1 "
            "ORDER BY created_at ASC",
            permanentId);

        txn.commit();

        Json::Value json(Json::arrayValue);

        for (const auto &row : rows) {
            Json::Value event;

            event["event_type"] =
                row["event_type"].as<std::string>();

            event["reference_type"] =
                row["reference_type"].is_null()
                    ? ""
                    : row["reference_type"].as<std::string>();

            event["created_at"] =
                row["created_at"].as<std::string>();

            json.append(event);
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

}  // namespace merchantra