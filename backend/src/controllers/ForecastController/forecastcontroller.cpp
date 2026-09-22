#include "ForecastController.h"

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

void ForecastController::getForecast(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string permanentId) {
    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec_params(
            "SELECT f.forecast_type, f.horizon_days, f.predicted_value, "
            "       f.stockout_risk, f.recommended_restock, f.created_at "
            "FROM forecasts f "
            "JOIN products p ON p.id = f.product_id "
            "WHERE p.permanent_product_id = $1 "
            "ORDER BY f.created_at DESC LIMIT 20",
            permanentId);
        txn.commit();

        Json::Value json(Json::arrayValue);
        for (const auto &row : rows) {
            Json::Value item;
            item["forecast_type"] = row["forecast_type"].as<std::string>();
            item["horizon_days"] = row["horizon_days"].as<int>();
            item["predicted_value"] = row["predicted_value"].as<double>();
            item["stockout_risk"] = row["stockout_risk"].is_null() ? 0.0 : row["stockout_risk"].as<double>();
            item["recommended_restock"] = row["recommended_restock"].is_null() ? 0 : row["recommended_restock"].as<int>();
            json.append(item);
        }

        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k500InternalServerError, e.what()));
    }
}

}  // namespace merchantra