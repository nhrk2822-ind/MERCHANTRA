
#include "MockMarketplaceAdapter.h"
 
namespace merchantra {
 
SyncResult MockMarketplaceAdapter::fetchListings(std::vector<MarketplaceListing> &outListings) {
    outListings.clear();
    outListings.push_back({"MOCK-LISTING-001", "Sample Product A", "https://example.com/a", 499.0});
    outListings.push_back({"MOCK-LISTING-002", "Sample Product B", "https://example.com/b", 899.0});
 
    return SyncResult{true, static_cast<int>(outListings.size()),
                       "Mock sync — SIMULATED data, not a real marketplace call"};
}
 
}  // namespace merchantra
 
