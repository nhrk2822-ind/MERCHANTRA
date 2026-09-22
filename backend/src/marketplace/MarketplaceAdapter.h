
// Common interface every marketplace integration implements.
//
// MarketplaceController/MarketplaceService talk ONLY to this interface
// — never to AmazonAdapter, FlipkartAdapter, etc. directly. This is
// what lets the backend swap a real adapter in later without touching
// any calling code, and what makes MockMarketplaceAdapter a drop-in
// replacement when a real API key isn't available.
 
#pragma once
 
#include <string>
#include <vector>
 
namespace merchantra {
 
struct MarketplaceListing {
    std::string externalListingId;
    std::string title;
    std::string listingUrl;
    double price;
};
 
struct SyncResult {
    bool success;
    int listingsFound;
    std::string message;
};
 
class MarketplaceAdapter {
public:
    virtual ~MarketplaceAdapter() = default;
 
    // Human-readable name, matches marketplaces.name in the DB.
    virtual std::string marketplaceName() const = 0;
 
    // Fetches current listings for this seller account from the
    // marketplace. Implementations should not throw on API failure —
    // return SyncResult{false, 0, "<reason>"} so callers can handle it
    // uniformly (log + mark marketplace_products.sync_status = FAILED).
    virtual SyncResult fetchListings(std::vector<MarketplaceListing> &outListings) = 0;
};
 
}  // namespace merchantra
 
