// HTTP handlers for /station/*.
//
// /station/scan is a thin passthrough for whatever the scanner (real or
// simulated, see backend/src/iot/) read — it doesn't decide PASS/FAIL,
// it just looks up what the barcode SHOULD be for context.
// /station/verify runs the full StationService pipeline and returns
// the final PASS/FAIL/REVIEW decision.

#pragma once

#include <drogon/HttpController.h>
#include <memory>

#include "stationhardwarecontroller.h"

namespace merchantra {

class StationController : public drogon::HttpController<StationController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(StationController::scan, "/station/scan", drogon::Post, "merchantra::AuthFilter");
    ADD_METHOD_TO(StationController::verify, "/station/verify", drogon::Post, "merchantra::AuthFilter");
    ADD_METHOD_TO(StationController::status, "/station/status", drogon::Get, "merchantra::AuthFilter");
    ADD_METHOD_TO(StationController::getSession, "/station/sessions/{id}", drogon::Get, "merchantra::AuthFilter");
    METHOD_LIST_END

    // Called ONCE from main.cpp at startup with either a real hardware
    // stack or MockScanner/MockCamera/MockPrinter, depending on whether
    // physical hardware is available. Every request handler below reads
    // from this shared instance instead of constructing its own.
    static void initHardware(std::unique_ptr<StationHardwareController> hardware);

    // Body: { "barcode": "8901234567890" }
    // Looks up which product (if any) that barcode belongs to — used by
    // the station UI to show "you scanned: <product name>" before
    // running the full verify.
    void scan(const drogon::HttpRequestPtr &req,
              std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    // Body: { "order_item_id": 12, "permanent_product_id": "MCH-P-000125",
    //         "station_id": "STATION-1", "operator_id": 3,
    //         "expected_barcode": "...", "scanned_quantity": 2,
    //         "expected_quantity": 2, "expected_category": "electronics" }
    // scanned_barcode and image_url are no longer taken from the body —
    // they come from StationHardwareController::captureReadout() now.
    void verify(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    // Reports real scanner/camera/printer connectivity via
    // StationHardwareController — no longer hardcoded.
    void status(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void getSession(const drogon::HttpRequestPtr &req,
                     std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                     int id);

private:
    static std::unique_ptr<StationHardwareController> hardware_;
};

}  // namespace merchantra