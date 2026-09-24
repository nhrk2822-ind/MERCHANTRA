#include "MarketplaceController.h"

#include <memory>

#include "../../database/Database.h"
#include "../../marketplace/AmazonAdapter/AmazonAdapter.h"
#include "../../marketplace/FlipkartAdapter/FlipkartAdapter.h"
#include "../../marketplace/MarketplaceAdapter.h"
#include "../../marketplace/MeeshoAdapter/MeeshoAdapter.h"
#include "../../marketplace/MockMarketplaceAdapter/MockMarketplaceAdapter.h"
#include "../../marketplace/MyntraAdapter/MyntraAdapter.h"
#include "../../services/MarketplaceService/MarketplaceService.h"

namespace merchantra {

namespace {

drogon::HttpResponsePtr jsonError(
    drogon::HttpStatusCode status,
    const std::string &message) {

    Json::Value json;
    json["message"] = message;

    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(status);

    return resp;
}

// The one place that maps adapter_type (a string in the DB) to an
// actual MarketplaceAdapter instance. Add a new marketplace by adding
// one line here plus its adapter class — nothing else changes.
std::unique_ptr<MarketplaceAdapter> makeAdapter(
    const std::string &adapterType) {

    if (adapterType == "AmazonAdapter") {
        return std::make_unique<AmazonAdapter>();
    }

    if (adapterType == "FlipkartAdapter") {
        return std::make_unique<FlipkartAdapter>();
    }

    if (adapterType == "MeeshoAdapter") {
        return std::make_unique<MeeshoAdapter>();
    }

    if (adapterType == "MyntraAdapter") {
        return std::make_unique<MyntraAdapter>();
    }

    return std::make_unique<MockMarketplaceAdapter>();
}

}  // namespace

void MarketplaceController::listMarketplaces(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec(
            "SELECT id, name, adapter_type, is_active "
            "FROM marketplaces "
            "ORDER BY id");

        txn.commit();

        Json::Value json(Json::arrayValue);

        for (const auto &row : rows) {
            Json::Value item;

            item["id"] =
                row["id"].as<int>();

            item["name"] =
                row["name"].as<std::string>();

            item["adapter_type"] =
                row["adapter_type"].as<std::string>();

            item["is_active"] =
                row["is_active"].as<bool>();

            json.append(item);
        }

        callback(
            drogon::HttpResponse::newHttpJsonResponse(json));

    } catch (const std::exception &e) {
        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

void MarketplaceController::syncMarketplace(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int id) {

    try {
        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        auto rows = txn.exec_params(
            "SELECT name, adapter_type "
            "FROM marketplaces "
            "WHERE id = $1",
            id);

        if (rows.empty()) {
            callback(
                jsonError(
                    drogon::k404NotFound,
                    "Marketplace not found"));

            return;
        }

        std::string adapterType =
            rows[0][1].as<std::string>();

        auto adapter =
            makeAdapter(adapterType);

        std::vector<MarketplaceListing> listings;
        SyncResult syncResult;

        try {
            syncResult =
                adapter->fetchListings(listings);

        } catch (const std::exception &e) {

            callback(
                jsonError(
                    drogon::k501NotImplemented,
                    e.what()));

            return;
        }

        if (!syncResult.success) {
            callback(
                jsonError(
                    drogon::k502BadGateway,
                    syncResult.message));

            return;
        }

        auto syncOutcome =
            MarketplaceService::syncListings(
                txn,
                id,
                listings);

        txn.commit();

        Json::Value json;

        json["marketplace_id"] =
            id;

        json["listings_found"] =
            syncResult.listingsFound;

        json["matched"] =
            syncOutcome.matched;

        json["message"] =
            syncResult.message;

        Json::Value unmatchedJson(
            Json::arrayValue);

        for (const auto &listingId :
             syncOutcome.unmatchedListingIds) {

            unmatchedJson.append(listingId);
        }

        json["unmatched_listing_ids"] =
            unmatchedJson;

        callback(
            drogon::HttpResponse::newHttpJsonResponse(json));

    } catch (const std::exception &e) {

        callback(
            jsonError(
                drogon::k500InternalServerError,
                e.what()));
    }
}

}  // namespace merchantra