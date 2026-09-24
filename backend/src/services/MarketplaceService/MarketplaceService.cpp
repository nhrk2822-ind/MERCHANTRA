#include "MarketplaceService.h"

namespace merchantra {

SyncOutcome MarketplaceService::syncListings(pqxx::work &txn,
                                              int marketplaceId,
                                              const std::vector<MarketplaceListing> &listings) {
    SyncOutcome outcome{0, 0, {}};

    for (const auto &listing : listings) {
        // Mapping rule: SKU == external_listing_id. This is a
        // deliberately simple starting rule — real marketplaces won't
        // actually key listings by SKU this cleanly, so expect to
        // replace this with a proper product_identifiers lookup
        // (identifier_type = 'MARKETPLACE_ID') once real adapters exist.
        auto productRows = txn.exec_params(
            "SELECT id FROM products WHERE sku = $1", listing.externalListingId);

        if (productRows.empty()) {
            outcome.unmatchedListingIds.push_back(listing.externalListingId);
            continue;
        }

        int productId = productRows[0][0].as<int>();
        outcome.matched++;

        auto existing = txn.exec_params(
            "SELECT id FROM marketplace_products "
            "WHERE marketplace_id = $1 AND external_listing_id = $2",
            marketplaceId, listing.externalListingId);

        if (existing.empty()) {
            txn.exec_params(
                "INSERT INTO marketplace_products "
                "(product_id, marketplace_id, external_listing_id, listing_url, price, sync_status, last_synced_at) "
                "VALUES ($1, $2, $3, $4, $5, 'SYNCED', now())",
                productId, marketplaceId, listing.externalListingId, listing.listingUrl, listing.price);
        } else {
            txn.exec_params(
                "UPDATE marketplace_products SET "
                "listing_url = $3, price = $4, sync_status = 'SYNCED', last_synced_at = now() "
                "WHERE marketplace_id = $1 AND external_listing_id = $2",
                marketplaceId, listing.externalListingId, listing.listingUrl, listing.price);
        }
        
    }

    return outcome;
}

}  // namespace merchantra