// HTTP handlers for /advertising/:permanentId and /roi/:permanentId.
// Read-only, same caveat as ForecastController: no AI-generation call
// wired in yet, just reads what's already in the tables.

#pragma once

#include <drogon/HttpController.h>

namespace merchantra {

class AdvertisingController : public drogon::HttpController<AdvertisingController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AdvertisingController::getAdvertising, "/advertising/{permanentId}", drogon::Get,
                  "merchantra::AuthFilter");
    ADD_METHOD_TO(AdvertisingController::getRoi, "/roi/{permanentId}", drogon::Get,
                  "merchantra::AuthFilter");
    METHOD_LIST_END

    void getAdvertising(const drogon::HttpRequestPtr &req,
                         std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                         std::string permanentId);

    void getRoi(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                std::string permanentId);
};

}  // namespace merchantra