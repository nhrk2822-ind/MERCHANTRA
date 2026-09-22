
009 create marketplaces · SQL
-- Migration 009: marketplaces + marketplace_products
-- Also backfills the FKs that product_identifiers (002) and orders (005)
-- deliberately left off until this table existed.
 
BEGIN;
 
CREATE TABLE marketplaces (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,  -- Amazon, Flipkart, Meesho, Myntra, Manual
    adapter_type VARCHAR(50) NOT NULL,          -- maps to a MarketplaceAdapter implementation
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    config_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
INSERT INTO marketplaces (name, adapter_type) VALUES
    ('Manual', 'MockMarketplaceAdapter'),
    ('Amazon', 'AmazonAdapter'),
    ('Flipkart', 'FlipkartAdapter'),
    ('Meesho', 'MeeshoAdapter'),
    ('Myntra', 'MyntraAdapter');
 
CREATE TABLE marketplace_products (
    id                 SERIAL PRIMARY KEY,
    product_id         INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    marketplace_id     INTEGER NOT NULL REFERENCES marketplaces(id),
    external_listing_id VARCHAR(255) NOT NULL,
    listing_url        TEXT,
    price              NUMERIC(12, 2),
    sync_status        VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
        sync_status IN ('PENDING', 'SYNCED', 'FAILED')
    ),
    last_synced_at     TIMESTAMPTZ,
 
    UNIQUE (marketplace_id, external_listing_id)
);
 
CREATE INDEX idx_marketplace_products_product_id ON marketplace_products(product_id);
 
-- Backfill the FKs left open in earlier migrations now that
-- marketplaces exists.
ALTER TABLE product_identifiers
    ADD CONSTRAINT fk_product_identifiers_marketplace
    FOREIGN KEY (marketplace_id) REFERENCES marketplaces(id);
 
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_marketplace
    FOREIGN KEY (marketplace_id) REFERENCES marketplaces(id);
 
COMMIT;
 
