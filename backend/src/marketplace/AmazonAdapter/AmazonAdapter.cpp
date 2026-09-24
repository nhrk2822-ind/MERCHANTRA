
#include "AmazonAdapter.h"
 
#include <stdexcept>
 
namespace merchantra {
 
SyncResult AmazonAdapter::fetchListings(std::vector<MarketplaceListing> & /*outListings*/) {
    // PLANNED: wire up Amazon's real seller API here (auth, rate
    // limits, pagination). Until then, this is intentionally not
    // faked — see MockMarketplaceAdapter for working test data.
    throw std::runtime_error("AmazonAdapter::fetchListings not implemented — "
                              "real Amazon API integration is PLANNED, not built");
}
 
}  // namespace merchantra
 
