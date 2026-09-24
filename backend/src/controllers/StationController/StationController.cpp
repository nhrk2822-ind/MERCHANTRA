#include "StationController.h"

#include "../../database/Database.h"
#include "../../services/StationService/StationService.h"
#include "../../ws/StationStatusHub.h"

namespace merchantra {

std::unique_ptr<StationHardwareController> StationController::hardware_ = nullptr;

void StationController::initHardware(std::unique_ptr<StationHardwareController> hardware) {
    hardware_ = std::move(hardware);
}

namespace {
drogon::HttpResponsePtr jsonError(drogon::HttpStatusCode status, const std::string &message) {
    Json::Value json;
    json["message"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(status);
    return resp;
}
}  // namespace

void StationController::scan(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto body = req->getJsonObject();
    if (!body || !(*body).isMember("barcode")) {
        callback(jsonError(drogon::k400BadRequest, "barcode is required"));
        return;
    }
    std::string barcode = (*body)["barcode"].asString();

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec_params(
            "SELECT p.permanent_product_id, p.name "
            "FROM product_identifiers pi "
            "JOIN products p ON p.id = pi.product_id "
            "WHERE pi.identifier_type = 'BARCODE' AND pi.identifier_value = $1",
            barcode);
        txn.commit();

        Json::Value json;
        json["barcode"] = barcode;
        if (rows.empty()) {
            json["matched"] = false;
        } else {
            json["matched"] = true;
            json["permanent_product_id"] = rows[0][0].as<std::string>();
            json["product_name"] = rows[0][1].as<std::string>();
        }

        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k500InternalServerError, e.what()));
    }
}

void StationController::verify(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto body = req->getJsonObject();
    if (!body || !(*body).isMember("order_item_id") ||
        !(*body).isMember("permanent_product_id")) {
        callback(jsonError(drogon::k400BadRequest,
                            "order_item_id and permanent_product_id are required"));
        return;
    }

    if (!hardware_) {
        callback(jsonError(drogon::k500InternalServerError,
                            "Station hardware not initialized — call StationController::initHardware at startup"));
        return;
    }

    std::string permanentProductId = (*body)["permanent_product_id"].asString();

    // Pull the actual scan + image from hardware (real or simulated),
    // rather than trusting scanned_barcode/image_url from the client —
    // those values must come from what the station itself read.
    auto readout = hardware_->captureReadout(permanentProductId);

    StationCheckInput input;
    input.orderItemId = (*body)["order_item_id"].asInt();
    input.permanentProductId = permanentProductId;
    input.stationId = (*body).get("station_id", "STATION-1").asString();
    input.operatorId = (*body).get("operator_id", 0).asInt();
    input.scannedBarcode = readout.scannedBarcode;
    input.expectedBarcode = (*body).get("expected_barcode", "").asString();
    input.scannedQuantity = (*body).get("scanned_quantity", 0).asInt();
    input.expectedQuantity = (*body).get("expected_quantity", 0).asInt();
    input.imageUrl = readout.capturedImageUrl;
    input.expectedCategory = (*body).get("expected_category", "").asString();

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto outcome = StationService::runFullVerification(txn, input);
        txn.commit();

        StationStatusHub::broadcastVerificationResult(
            permanentProductId, outcome.finalStatus, outcome.packingSessionId);

        Json::Value json;
        json["packing_session_id"] = outcome.packingSessionId;
        json["status"] = outcome.finalStatus;
        json["barcode_match"] = outcome.barcodeMatch;
        json["quantity_match"] = outcome.quantityMatch;
        json["ai_confidence"] = outcome.aiConfidence;
        json["ai_damage_probability"] = outcome.aiDamageProbability;
        json["scanned_barcode"] = readout.scannedBarcode;
        json["captured_image_url"] = readout.capturedImageUrl;

        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k500InternalServerError, e.what()));
    }
}

void StationController::status(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    Json::Value json;

    if (!hardware_) {
        json["mode"] = "UNINITIALIZED";
        callback(drogon::HttpResponse::newHttpJsonResponse(json));
        return;
    }

    // A zero-length permanentProductId probe just to read connectivity
    // flags — captureReadout() still triggers a real scan/capture
    // attempt, so this is a lightweight status check, not a free one.
    auto readout = hardware_->captureReadout("");
    json["mode"] = "CONNECTED";
    json["scanner"] = readout.scannerConnected ? "ok" : "unreachable";
    json["camera"] = readout.cameraConnected ? "ok" : "unreachable";
    json["printer"] = readout.printerConnected ? "ok" : "unreachable";

    callback(drogon::HttpResponse::newHttpJsonResponse(json));
}

void StationController::getSession(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int id) {
    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto sessionRows = txn.exec_params(
            "SELECT id, order_item_id, permanent_product_id, station_id, status, "
            "       started_at, completed_at "
            "FROM packing_sessions WHERE id = $1", id);
        if (sessionRows.empty()) {
            callback(jsonError(drogon::k404NotFound, "Packing session not found"));
            return;
        }

        auto checkRows = txn.exec_params(
            "SELECT check_type, result, ai_confidence, created_at "
            "FROM verification_results WHERE packing_session_id = $1 ORDER BY created_at",
            id);
        txn.commit();

        const auto &s = sessionRows[0];
        Json::Value json;
        json["id"] = s["id"].as<int>();
        json["permanent_product_id"] = s["permanent_product_id"].as<std::string>();
        json["status"] = s["status"].as<std::string>();
        json["station_id"] = s["station_id"].as<std::string>();

        Json::Value checks(Json::arrayValue);
        for (const auto &row : checkRows) {
            Json::Value check;
            check["check_type"] = row["check_type"].as<std::string>();
            check["result"] = row["result"].as<std::string>();
            check["ai_confidence"] = row["ai_confidence"].is_null() ? 0.0 : row["ai_confidence"].as<double>();
            checks.append(check);
        }
        json["checks"] = checks;

        callback(drogon::HttpResponse::newHttpJsonResponse(json));
    } catch (const std::exception &e) {
        callback(jsonError(drogon::k500InternalServerError, e.what()));
    }
}

}  // namespace merchantra