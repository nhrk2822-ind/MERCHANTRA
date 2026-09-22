#include "AuthFilter.h"

#include "../config/Config.h"
#include "../database/Database.h"
#include "AuthUtils.h"

namespace merchantra {

void AuthFilter::doFilter(const drogon::HttpRequestPtr &req,
                           drogon::FilterCallback &&fcb,
                           drogon::FilterChainCallback &&fccb) {
    std::string token;

    auto authHeader = req->getHeader("Authorization");
    const std::string prefix = "Bearer ";
    if (authHeader.rfind(prefix, 0) == 0) {
        token = authHeader.substr(prefix.size());
    } else {
        // Fallback for WebSocket connections: browsers' WebSocket API
        // can't set custom headers, so the frontend sends the token as
        // ?token=... instead (see SmartStation.jsx). Only used when no
        // Authorization header was present — normal HTTP requests still
        // go through the header path above.
        token = req->getParameter("token");
    }

    if (token.empty()) {
        Json::Value json;
        json["message"] = "Missing bearer token";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
        resp->setStatusCode(drogon::k401Unauthorized);
        fcb(resp);
        return;
    }

    // Reads the already-loaded app config instead of re-parsing
    // environment variables on every request.
    const auto &config = Config::instance();
    int userId = AuthUtils::verifyTokenAndGetUserId(token, config.jwtSecret);

    if (userId < 0) {
        Json::Value json;
        json["message"] = "Invalid or expired token";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
        resp->setStatusCode(drogon::k401Unauthorized);
        fcb(resp);
        return;
    }

    // Role is looked up fresh from the DB rather than trusted from the
    // JWT's own "role" claim, so a role change (promote/demote) takes
    // effect immediately instead of only after the token expires.
    std::string role;
    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);
        auto rows = txn.exec_params(
            "SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id "
            "WHERE u.id = $1 AND u.is_active = TRUE",
            userId);
        txn.commit();

        if (rows.empty()) {
            Json::Value json;
            json["message"] = "User not found or inactive";
            auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
            resp->setStatusCode(drogon::k401Unauthorized);
            fcb(resp);
            return;
        }
        role = rows[0][0].as<std::string>();
    } catch (const std::exception &e) {
        Json::Value json;
        json["message"] = std::string("Auth lookup failed: ") + e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
        resp->setStatusCode(drogon::k500InternalServerError);
        fcb(resp);
        return;
    }

    // Stashed here so every controller reads the same way:
    //   int userId = req->getAttributes()->get<int>("user_id");
    //   std::string role = req->getAttributes()->get<std::string>("role");
    req->getAttributes()->insert("user_id", userId);
    req->getAttributes()->insert("role", role);

    fccb();
}

}  // namespace merchantra