-- Migration 013: connect orders to sellers

BEGIN;

ALTER TABLE orders
ADD COLUMN seller_id INTEGER;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_seller
FOREIGN KEY (seller_id)
REFERENCES users(id);

CREATE INDEX idx_orders_seller_id
ON orders(seller_id);

COMMIT;