
// Stand-in for a real marketplace API. Used for "Manual" listings and
// as the default when a real marketplace adapter (Amazon/Flipkart/
// Meesho/Myntra) hasn't been implemented or configured yet.
//
// Returns deterministic fake listings so the sync pipeline, dashboard,
// and tests all have something real to work against without needing
// live credentials.
 
#pragma once
 
#include "../MarketplaceAdapter.h"
 
namespace merchantra {
 
class MockMarketplaceAdapter : public MarketplaceAdapter {
public:
    std::string marketplaceName() const override { return "Manual"; }
 
    SyncResult fetchListings(std::vector<MarketplaceListing> &outListings) override;
};
 
}  // namespace merchantra
 
