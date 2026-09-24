#include "MeeshoAdapter.h"

#include <stdexcept>

namespace merchantra {

SyncResult MeeshoAdapter::fetchListings(std::vector<MarketplaceListing> & /*outListings*/) {
    // PLANNED: wire up Meesho's real seller API here (auth, rate
    // limits, pagination). Until then, this is intentionally not
    // faked — see MockMarketplaceAdapter for working test data.
    throw std::runtime_error("MeeshoAdapter::fetchListings not implemented — "
                              "real Meesho API integration is PLANNED, not built");
}

}  // namespace merchantra