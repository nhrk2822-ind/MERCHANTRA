#include "AdvertisingController.h"

#include "../../database/Database.h"

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

void AdvertisingController::getAdvertising(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string permanentId) {
    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec_params(
            "SELECT c.id, c.status, c.budget, c.start_date, c.end_date "
            "FROM advertising_campaigns c "
            "JOIN products p ON p.id = c.product_id "
            "WHERE p.permanent_product_id = $1 "
            "ORDER BY c.created_at DESC",
            permanentId);
        txn.commit();

        Json::Value json(Json::arrayValue);
        for (const auto &row : rows) {
            Json::Value item;
            item["campaign_id"] = row["id"].as<int>();
            item["status"] = row["status"].as<std::string>();
            item["budget"] = row["budget"].is_null() ? 0.0 : row["budget"].as<double>();
            json.append(item);
        }

        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k500InternalServerError, e.what()));
    }
}

void AdvertisingController::getRoi(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string permanentId) {
    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec_params(
            "SELECT r.period, r.cost, r.revenue, r.roi, r.created_at "
            "FROM roi_records r "
            "JOIN products p ON p.id = r.product_id "
            "WHERE p.permanent_product_id = $1 "
            "ORDER BY r.created_at DESC LIMIT 20",
            permanentId);
        txn.commit();

        Json::Value json(Json::arrayValue);
        for (const auto &row : rows) {
            Json::Value item;
            item["period"] = row["period"].as<std::string>();
            item["cost"] = row["cost"].as<double>();
            item["revenue"] = row["revenue"].as<double>();
            item["roi"] = row["roi"].is_null() ? 0.0 : row["roi"].as<double>();
            json.append(item);
        }

        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k500InternalServerError, e.what()));
    }
}

}  // namespace merchantra