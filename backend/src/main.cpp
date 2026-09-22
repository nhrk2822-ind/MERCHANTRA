// MERCHANTRA core backend entry point.
//
// Boots config, the database connection, and registers all controllers
// before starting the Drogon HTTP server.

#include <drogon/drogon.h>

#include "config/Config.h"
#include "database/Database.h"

// Controllers register their own routes via ADD_METHOD_TO in their
// METHOD_LIST — Drogon discovers them automatically as long as they're
// linked into the binary (see CMakeLists.txt), so no explicit
// "app().registerController(...)" calls are needed for them.
#include "controllers/AuthController/AuthController.h"
#include "controllers/ProductController/ProductController.h"
#include "controllers/StationController/StationController.h"
#include "iot/MockCamera/MockCamera.h"
#include "iot/MockPrinter/MockPrinter.h"
#include "iot/MockScanner/MockScanner.h"
#include "services/AIClientService/AIClientService.h"

int main() {
    auto config = merchantra::Config::loadFromEnv();
    merchantra::Config::set(config);

    if (config.jwtSecret.empty()) {
        LOG_ERROR << "JWT_SECRET is not set. Refusing to start — auth "
                     "would be unsigned/insecure.";
        return 1;
    }

    try {
        merchantra::Database::init(config);
    } catch (const std::exception &e) {
        LOG_ERROR << "Failed to connect to PostgreSQL at startup: " << e.what();
        return 1;
    }

    merchantra::AIClientService::init(config.aiServiceBaseUrl);

    // Simulated hardware until real ESP32/RPi scanner/camera/printer are
    // wired in — swap these three lines for real driver classes when
    // physical hardware is available. Nothing else in the codebase
    // changes, since StationController only depends on the interfaces.
    merchantra::StationController::initHardware(
        std::make_unique<merchantra::StationHardwareController>(
            std::make_unique<merchantra::MockScanner>(),
            std::make_unique<merchantra::MockCamera>(),
            std::make_unique<merchantra::MockPrinter>()));

    // Health check — confirms the server is up before anything else
    // (frontend, monitoring, or the AI service) tries to talk to it.
    drogon::app().registerHandler(
        "/health",
        [](const drogon::HttpRequestPtr &,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            Json::Value json;
            json["status"] = "ok";
            json["service"] = "merchantra-backend";
            callback(drogon::HttpResponse::newHttpJsonResponse(json));
        },
        {drogon::Get});

    LOG_INFO << "MERCHANTRA backend starting on "
             << config.serverHost << ":" << config.serverPort;

    drogon::app()
        .setLogPath("./logs")
        .addListener(config.serverHost, config.serverPort)
        .setThreadNum(4)
        .run();

    return 0;
}