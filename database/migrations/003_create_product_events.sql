-- Migration 003: product_events
-- The lifecycle timeline table. Every meaningful thing that happens to
-- a product gets one row here, keyed by permanent_product_id so the
-- full history can be read regardless of which other tables changed.
--
-- Written to ONLY through LifecycleService::recordEvent — never insert
-- into this table directly from a controller.

BEGIN;

CREATE TYPE product_event_type AS ENUM (
    'PRODUCT_CREATED',
    'MARKETPLACE_LISTED',
    'INVENTORY_ADDED',
    'ORDER_CREATED',
    'PACKING_STARTED',
    'BARCODE_SCANNED',
    'VISUAL_VERIFICATION',
    'PACKING_COMPLETED',
    'SHIPPED',
    'DELIVERED',
    'RETURN_REQUESTED',
    'RETURN_RECEIVED',
    'RETURN_INSPECTED',
    'RESTOCKED'
);

CREATE TABLE product_events (
    id                    BIGSERIAL PRIMARY KEY,
    permanent_product_id  VARCHAR(20) NOT NULL REFERENCES products(permanent_product_id),
    event_type            product_event_type NOT NULL,
    reference_type        VARCHAR(50),   -- e.g. 'order', 'return', 'packing_session'
    reference_id          INTEGER,       -- id in whichever table reference_type points to
    metadata_json         JSONB NOT NULL DEFAULT '{}'::jsonb,
    actor_user_id         INTEGER REFERENCES users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_events_permanent_id ON product_events(permanent_product_id);
CREATE INDEX idx_product_events_created_at ON product_events(created_at);

COMMIT;
