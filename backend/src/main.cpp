// MERCHANTRA core backend entry point.
//
// Boots config, the database connection, and registers all controllers
// before starting the Drogon HTTP server.

#include <drogon/drogon.h>

#include <filesystem>

#include "config/Config.h"
#include "database/Database.h"

#include "controllers/AdvertisingController/AdvertisingController.h"
#include "controllers/AuditController/Auditcontroller.h"
#include "controllers/AuthController/Authcontroller.h"
#include "controllers/ForecastController/forecastcontroller.h"
#include "controllers/InventoryController/Inventorycontroller.h"
#include "controllers/MarketplaceController/Marketplacecontroller.h"
#include "controllers/OrderController/Ordercontroller.h"
#include "controllers/ProductController/productcontroller.h"
#include "controllers/RestockController/restockcontroller.h"
#include "controllers/ReturnController/Returncontroller.h"
#include "controllers/StationController/StationController.h"
#include "iot/MockCamera/MockCamera.h"
#include "iot/MockPrinter/MockPrinter.h"
#include "iot/MockScanner/MockScanner.h"
#include "services/AIClientService/AIClientService.h"

int main() {
    auto config = merchantra::Config::loadFromEnv();
    merchantra::Config::set(config);

    if (config.jwtSecret.empty()) {
        LOG_ERROR << "JWT_SECRET is not set. Refusing to start - auth "
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
    // wired in.
    merchantra::StationController::initHardware(
        std::make_unique<merchantra::StationHardwareController>(
            std::make_unique<merchantra::MockScanner>(),
            std::make_unique<merchantra::MockCamera>(),
            std::make_unique<merchantra::MockPrinter>()));

    // Health check
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

    // Explicit controller registration (forces the compiler to instantiate
    // them so their routes actually exist in the binary).
    drogon::app().registerController(std::make_shared<merchantra::AuthController>());
    drogon::app().registerController(std::make_shared<merchantra::ProductController>());
    drogon::app().registerController(std::make_shared<merchantra::OrderController>());
    drogon::app().registerController(std::make_shared<merchantra::InventoryController>());
    drogon::app().registerController(std::make_shared<merchantra::ReturnController>());
    drogon::app().registerController(std::make_shared<merchantra::MarketplaceController>());
    drogon::app().registerController(std::make_shared<merchantra::ForecastController>());
    drogon::app().registerController(std::make_shared<merchantra::AdvertisingController>());
    drogon::app().registerController(std::make_shared<merchantra::AuditController>());
    drogon::app().registerController(std::make_shared<merchantra::RestockController>());
    drogon::app().registerController(std::make_shared<merchantra::StationController>());

    // Frontend calls /api/...; controllers register bare paths (/auth/login).
    drogon::app().registerPreRoutingAdvice(
        [](const drogon::HttpRequestPtr &req,
           drogon::AdviceCallback &&,
           drogon::AdviceChainCallback &&accb) {
            const std::string &p = req->path();
            if (p.rfind("/api/", 0) == 0) {
                req->setPath(p.substr(4));
            }
            accb();
        });

    // Print every registered route at startup (for debugging).
    drogon::app().registerBeginningAdvice([]() {
        for (auto &h : drogon::app().getHandlersInfo()) {
            LOG_INFO << "ROUTE " << std::get<0>(h);
        }
    });

    LOG_INFO << "MERCHANTRA backend starting on "
             << config.serverHost << ":" << config.serverPort;

    std::filesystem::create_directories("logs");

    drogon::app()
        .setLogPath("./logs")
        .addListener(config.serverHost, config.serverPort)
        .setThreadNum(4)
        .run();

    return 0;
}