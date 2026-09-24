
007 create ai results · SQL
-- Migration 007: ai_results
-- Generic store for every AI service call/response. Keeps the C++
-- backend decoupled from AI internals — it doesn't need a dedicated
-- table per AI feature, just this one, keyed by ai_type.
--
-- Written to ONLY through AIClientService — never insert here directly.
 
BEGIN;
 
CREATE TYPE ai_result_type AS ENUM (
    'VERIFY_PRODUCT',
    'DAMAGE',
    'RETURN_RISK',
    'ANOMALY',
    'FORECAST',
    'RESTOCK',
    'ADVERTISING',
    'ROI'
);
 
CREATE TABLE ai_results (
    id                    BIGSERIAL PRIMARY KEY,
    permanent_product_id  VARCHAR(20) NOT NULL REFERENCES products(permanent_product_id),
    ai_type               ai_result_type NOT NULL,
    request_json          JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_json         JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence            NUMERIC(4, 3),
    decision              VARCHAR(20),  -- e.g. PASS/FAIL/REVIEW; null for non-decision AI types
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_ai_results_permanent_id ON ai_results(permanent_product_id);
CREATE INDEX idx_ai_results_type ON ai_results(ai_type);
CREATE INDEX idx_ai_results_created_at ON ai_results(created_at);
 
COMMIT;
 
 