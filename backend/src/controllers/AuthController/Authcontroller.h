
// HTTP handlers for /auth/register, /auth/login, /auth/me.
//
// Thin by design: parses the request, calls Database + AuthUtils,
// returns JSON. No business rules beyond "does this email already
// exist" belong here — anything more complex moves into a service.
 
#pragma once
 
#include <drogon/HttpController.h>
#include "../../auth/AuthFilter.h"
 
namespace merchantra {
 
class AuthController : public drogon::HttpController<AuthController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AuthController::registerUser, "/auth/register", drogon::Post);
    ADD_METHOD_TO(AuthController::login, "/auth/login", drogon::Post);
    ADD_METHOD_TO(AuthController::me, "/auth/me", drogon::Get, "merchantra::AuthFilter");
    METHOD_LIST_END
 
    void registerUser(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    void login(const drogon::HttpRequestPtr &req,
               std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    // Reads the Bearer token from the Authorization header and returns
    // the current user's profile. Relies on the auth middleware (added
    // once RBAC middleware exists) having already validated the token.
    void me(const drogon::HttpRequestPtr &req,
            std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};
 
}  // namespace merchantra
 
