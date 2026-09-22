
// HTTP handlers for /marketplaces.
//
// Picks the right MarketplaceAdapter by adapter_type (stored in the
// marketplaces table) and syncs its listings into marketplace_products.
// Controllers never construct AmazonAdapter/FlipkartAdapter/etc.
// directly outside of this factory-style lookup.
 
#pragma once
 
#include <drogon/HttpController.h>
 
namespace merchantra {
 
class MarketplaceController : public drogon::HttpController<MarketplaceController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(MarketplaceController::listMarketplaces, "/marketplaces", drogon::Get,
                  "merchantra::AuthFilter");
    ADD_METHOD_TO(MarketplaceController::syncMarketplace, "/marketplaces/{id}/sync", drogon::Post,
                  "merchantra::AuthFilter");
    METHOD_LIST_END
 
    void listMarketplaces(const drogon::HttpRequestPtr &req,
                           std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    void syncMarketplace(const drogon::HttpRequestPtr &req,
                          std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                          int id);
};
 
}  // namespace merchantra
 
