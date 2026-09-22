#pragma once

#include <drogon/HttpController.h>

namespace merchantra {

class RestockController
    : public drogon::HttpController<RestockController, false> {

public:
    METHOD_LIST_BEGIN

    ADD_METHOD_TO(
        RestockController::listRecommendations,
        "/restock-recommendations",
        drogon::Get,
        "merchantra::AuthFilter");

    METHOD_LIST_END

    void listRecommendations(
        const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};

} // namespace merchantra