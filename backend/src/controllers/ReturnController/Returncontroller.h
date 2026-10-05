#pragma once

#include <drogon/HttpController.h>

namespace merchantra {

class ReturnController
    : public drogon::HttpController<ReturnController, false> {

public:

    METHOD_LIST_BEGIN

    ADD_METHOD_TO(
        ReturnController::createReturn,
        "/returns",
        drogon::Post,
        "merchantra::AuthFilter"
    );

    ADD_METHOD_TO(
        ReturnController::receiveReturn,
        "/returns/{id}/receive",
        drogon::Post,
        "merchantra::AuthFilter"
    );

    ADD_METHOD_TO(
        ReturnController::inspectReturn,
        "/returns/{id}/inspect",
        drogon::Post,
        "merchantra::AuthFilter"
    );

    METHOD_LIST_END


    void createReturn(
        const drogon::HttpRequestPtr &req,
        std::function<void(
            const drogon::HttpResponsePtr &)> &&callback
    );


    void receiveReturn(
        const drogon::HttpRequestPtr &req,
        std::function<void(
            const drogon::HttpResponsePtr &)> &&callback,
        int id
    );


    void inspectReturn(
        const drogon::HttpRequestPtr &req,
        std::function<void(
            const drogon::HttpResponsePtr &)> &&callback,
        int id
    );
};

} // namespace merchantra