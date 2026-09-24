// Drogon HTTP filter: verifies the Bearer JWT on every request it's
// attached to, and stashes the user id + role on the request's
// attributes so controllers can read them without re-verifying.
//
// Usage in a controller's METHOD_LIST:
//   ADD_METHOD_TO(SomeController::someMethod, "/path", drogon::Get,
//                 "merchantra::AuthFilter");

#pragma once

#include <drogon/HttpFilter.h>

namespace merchantra {

class AuthFilter : public drogon::HttpFilter<AuthFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr &req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fccb) override;
};

}  // namespace merchantra