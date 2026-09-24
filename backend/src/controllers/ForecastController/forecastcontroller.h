// HTTP handler for /forecasts/:permanentId. Read-only for now — reads
// whatever's already in the forecasts table. Nothing here calls the
// Python AI service yet; that's a future AIClientService::forecastDemand
// method, added when there's a concrete trigger point (e.g. a nightly
// job or a "run forecast" button) that should produce new rows here.

#pragma once

#include <drogon/HttpController.h>

namespace merchantra {

class ForecastController : public drogon::HttpController<ForecastController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ForecastController::getForecast, "/forecasts/{permanentId}", drogon::Get,
              "merchantra::AuthFilter");
    METHOD_LIST_END

    void getForecast(const drogon::HttpRequestPtr &req,
                      std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                      std::string permanentId);
};

}  // namespace merchantra