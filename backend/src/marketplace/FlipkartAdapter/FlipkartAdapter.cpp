#include "FlipkartAdapter.h"

#include <stdexcept>

namespace merchantra {

SyncResult FlipkartAdapter::fetchListings(std::vector<MarketplaceListing> & /*outListings*/) {
    // PLANNED: wire up Flipkart's real seller API here (auth, rate
    // limits, pagination). Until then, this is intentionally not
    // faked â€” see MockMarketplaceAdapter for working test data.
    throw std::runtime_error("FlipkartAdapter::fetchListings not implemented â€” "
                              "real Flipkart API integration is PLANNED, not built");
}

}  // namespace merchantra
