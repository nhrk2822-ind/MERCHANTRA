#include "AuditController.h"

#include "../../auth/RbacUtils.h"
#include "../../database/Database.h"

#include <pqxx/pqxx>

namespace merchantra {

void AuditController::listAuditLogs(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    if (!RbacUtils::requireRole(req, callback, {"ADMIN", "ANALYST"}))
        return;

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec(
            "SELECT a.id, u.name, a.action, a.resource_type, "
            "a.resource_id, a.created_at "
            "FROM audit_logs a "
            "LEFT JOIN users u ON u.id = a.user_id "
            "ORDER BY a.created_at DESC LIMIT 200");

        txn.commit();

        Json::Value json(Json::arrayValue);

        for (const auto &row : rows) {
            Json::Value item;

            item["id"] = row["id"].as<int>();

            item["user"] =
                row["name"].is_null()
                    ? "system"
                    : row["name"].as<std::string>();

            item["action"] =
                row["action"].as<std::string>();

            item["resource_type"] =
                row["resource_type"].is_null()
                    ? ""
                    : row["resource_type"].as<std::string>();

            item["created_at"] =
                row["created_at"].as<std::string>();

            json.append(item);
        }

        callback(
            drogon::HttpResponse::newHttpJsonResponse(json));

    } catch (const std::exception &e) {

        Json::Value json;
        json["message"] = e.what();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(json);

        resp->setStatusCode(
            drogon::k500InternalServerError);

        callback(resp);
    }
}

}  // namespace merchantra