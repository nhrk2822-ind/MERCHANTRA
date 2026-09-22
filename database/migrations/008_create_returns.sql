
008 create returns · SQL
-- Migration 008: returns + return_inspections
-- Continues the lifecycle after DELIVERED. return_inspections links to
-- ai_results so the return-risk score is traceable back to the exact
-- AI call that produced it.
 
BEGIN;
 
CREATE TABLE returns (
    id             SERIAL PRIMARY KEY,
    order_item_id  INTEGER NOT NULL REFERENCES order_items(id),
    permanent_product_id VARCHAR(20) NOT NULL REFERENCES products(permanent_product_id),
    reason         TEXT,
    status         VARCHAR(20) NOT NULL DEFAULT 'REQUESTED' CHECK (
        status IN ('REQUESTED', 'RECEIVED', 'INSPECTED', 'CLOSED')
    ),
    requested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_at    TIMESTAMPTZ
);
 
CREATE INDEX idx_returns_permanent_id ON returns(permanent_product_id);
CREATE INDEX idx_returns_order_item_id ON returns(order_item_id);
 
CREATE TABLE return_inspections (
    id               SERIAL PRIMARY KEY,
    return_id        INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    inspector_id     INTEGER REFERENCES users(id),
    condition_notes  TEXT,
    images_ref       TEXT,  -- comma-separated image URLs, or move to `images` table join later
    ai_risk_score    NUMERIC(4, 3),
    ai_result_id     BIGINT REFERENCES ai_results(id),
    decision         VARCHAR(30) NOT NULL CHECK (
        decision IN ('RESTOCK', 'DAMAGED_WRITE_OFF', 'FLAG_FOR_REVIEW')
    ),
    inspected_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_return_inspections_return_id ON return_inspections(return_id);
 
COMMIT;
 
