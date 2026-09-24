-- Migration 002: products + product_identifiers
-- Phase 3 foundation: every product gets a Permanent Product ID
-- (MCH-P-000125 format) that every later table (inventory, orders,
-- product_events, ai_results, ...) references.

BEGIN;

CREATE TABLE products (
    id                    SERIAL PRIMARY KEY,
    permanent_product_id  VARCHAR(20) NOT NULL UNIQUE,  -- e.g. MCH-P-000125
    name                  VARCHAR(255) NOT NULL,
    description           TEXT,
    category              VARCHAR(100),
    sku                   VARCHAR(100),
    primary_image_url     TEXT,
    status                VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_by            INTEGER REFERENCES users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_permanent_id ON products(permanent_product_id);
CREATE INDEX idx_products_sku ON products(sku);

-- Any other identifier a product carries — barcode, marketplace ASIN,
-- EAN, etc. — without needing a new column every time a new identifier
-- type shows up.
CREATE TABLE product_identifiers (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    identifier_type   VARCHAR(30) NOT NULL,  -- SKU, BARCODE, MARKETPLACE_ID, EAN, ASIN...
    identifier_value  VARCHAR(255) NOT NULL,
    marketplace_id    INTEGER,  -- FK added once marketplaces table exists (migration 003)
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (identifier_type, identifier_value)
);

CREATE INDEX idx_product_identifiers_product_id ON product_identifiers(product_id);

COMMIT;