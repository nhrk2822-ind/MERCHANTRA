// Maps external marketplace listings to internal products and persists
// them into marketplace_products — the piece MarketplaceController
// deliberately left out (see its NOTE comment).
//
// Mapping strategy: match by SKU. A listing whose external_listing_id
// can't be matched to any product by SKU is skipped and reported back,
// not silently dropped — the caller decides what to do with unmatched
// listings (e.g. show them to the seller to manually link).

#pragma once

#include <pqxx/pqxx>
#include <string>
#include <vector>

#include "../../marketplace/MarketplaceAdapter.h"

namespace merchantra {

struct SyncOutcome {
    int matched;
    int unmatched;
    std::vector<std::string> unmatchedListingIds;
};

struct MarketplaceService {
    // Takes the listings already fetched by a MarketplaceAdapter and
    // upserts matching ones into marketplace_products. Unmatched
    // listings (no product with that SKU) are reported, not inserted.
    static SyncOutcome syncListings(pqxx::work &txn,
                                     int marketplaceId,
                                     const std::vector<MarketplaceListing> &listings);
};

}  // namespace merchantra