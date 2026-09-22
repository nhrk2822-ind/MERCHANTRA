// Role check helper, used at the top of a controller method AFTER
// AuthFilter has already run (so req->getAttributes() has "role" set).
//
// Drogon's filter chain doesn't take per-route arguments, so per-route
// role lists live in each controller method as an explicit check
// rather than a second parameterized filter — one line per protected
// method, easy to read, easy to audit.
//
// Usage:
//   if (!RbacUtils::requireRole(req, callback, {"ADMIN", "INVENTORY_MANAGER"})) return;
 
#pragma once
 
#include <drogon/HttpResponse.h>
#include <functional>
#include <initializer_list>
#include <string>
 
namespace merchantra {
 
struct RbacUtils {
    static bool requireRole(const drogon::HttpRequestPtr &req,
                             const std::function<void(const drogon::HttpResponsePtr &)> &callback,
                             std::initializer_list<std::string> allowedRoles) {
        std::string role = req->getAttributes()->get<std::string>("role");
 
        for (const auto &allowed : allowedRoles) {
            if (role == allowed) return true;
        }
 
        Json::Value json;
        json["message"] = "Role '" + role + "' is not permitted to perform this action";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
        resp->setStatusCode(drogon::k403Forbidden);
        callback(resp);
        return false;
    }
};
 
}  // namespace merchantra
 
