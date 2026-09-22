
005 create orders · SQL
-- Migration 005: orders + order_items
-- Phase 5. marketplace_id is nullable for manual/offline orders.
 
BEGIN;
 
CREATE TABLE orders (
    id             SERIAL PRIMARY KEY,
    order_number   VARCHAR(50) NOT NULL UNIQUE,
    marketplace_id INTEGER,  -- FK added once marketplaces table exists (migration 006)
    customer_ref   VARCHAR(150),
    status         VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (
        status IN ('CREATED', 'PACKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED')
    ),
    total_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_orders_status ON orders(status);
 
CREATE TABLE order_items (
    id                    SERIAL PRIMARY KEY,
    order_id              INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id            INTEGER NOT NULL REFERENCES products(id),
    permanent_product_id  VARCHAR(20) NOT NULL REFERENCES products(permanent_product_id),
    quantity              INTEGER NOT NULL CHECK (quantity > 0),
    unit_price            NUMERIC(12, 2) NOT NULL
);
 
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
 
COMMIT;
 
