#include "RestockController.h"

namespace merchantra {

void RestockController::listRecommendations(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    Json::Value json(Json::arrayValue);

    callback(
        drogon::HttpResponse::newHttpJsonResponse(json)
    );
}

} // namespace merchantra