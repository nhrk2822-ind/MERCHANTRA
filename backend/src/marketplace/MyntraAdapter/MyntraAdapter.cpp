#include "MyntraAdapter.h"

#include <stdexcept>

namespace merchantra {

SyncResult MyntraAdapter::fetchListings(std::vector<MarketplaceListing> & /*outListings*/) {
    // PLANNED: wire up Myntra's real seller API here (auth, rate
    // limits, pagination). Until then, this is intentionally not
    // faked — see MockMarketplaceAdapter for working test data.
    throw std::runtime_error("MyntraAdapter::fetchListings not implemented — "
                              "real Myntra API integration is PLANNED, not built");
}

}  // namespace merchantranext
