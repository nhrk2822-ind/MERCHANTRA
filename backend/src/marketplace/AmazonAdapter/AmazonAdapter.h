
// PLANNED — not implemented yet. Amazon's real seller API is not
// available in this environment. Do NOT fake real-looking data here;
// fetchListings() throws until real credentials + API integration
// exist, so it's obvious at the call site that this isn't live.
// Use MockMarketplaceAdapter for anything that needs working data now.
 
#pragma once
 
#include "../MarketplaceAdapter.h"
 
namespace merchantra {
 
class AmazonAdapter : public MarketplaceAdapter {
public:
    std::string marketplaceName() const override { return "Amazon"; }
 
    SyncResult fetchListings(std::vector<MarketplaceListing> &outListings) override;
};
 
}  // namespace merchantra
 
