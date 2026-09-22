
006 create packing verification · SQL
-- Migration 006: packing_sessions + verification_results
-- Phase 7 (Smart Station). A packing_session is opened per order_item
-- when packing starts; verification_results holds each of the three
-- checks (barcode match, quantity, visual AI) run within that session.
 
BEGIN;
 
CREATE TABLE packing_sessions (
    id                    SERIAL PRIMARY KEY,
    order_item_id         INTEGER NOT NULL REFERENCES order_items(id),
    permanent_product_id  VARCHAR(20) NOT NULL REFERENCES products(permanent_product_id),
    station_id            VARCHAR(50) NOT NULL DEFAULT 'STATION-1',
    operator_id           INTEGER REFERENCES users(id),
    status                VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (
        status IN ('IN_PROGRESS', 'PASS', 'FAIL', 'REVIEW')
    ),
    started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at          TIMESTAMPTZ
);
 
CREATE INDEX idx_packing_sessions_permanent_id ON packing_sessions(permanent_product_id);
CREATE INDEX idx_packing_sessions_order_item_id ON packing_sessions(order_item_id);
 
CREATE TABLE verification_results (
    id                  SERIAL PRIMARY KEY,
    packing_session_id  INTEGER NOT NULL REFERENCES packing_sessions(id) ON DELETE CASCADE,
    check_type          VARCHAR(20) NOT NULL CHECK (
        check_type IN ('BARCODE_MATCH', 'QUANTITY', 'VISUAL_AI')
    ),
    result              VARCHAR(10) NOT NULL CHECK (result IN ('PASS', 'FAIL', 'REVIEW')),
    ai_confidence       NUMERIC(4, 3),  -- e.g. 0.960, only set for VISUAL_AI
    details_json        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_verification_results_session_id ON verification_results(packing_session_id);
 
COMMIT;
 
