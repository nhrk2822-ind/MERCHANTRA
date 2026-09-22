-- Migration 010: forecasts, advertising_campaigns, advertising_metrics,
-- roi_records, restock_recommendations, festival_calendar
--
-- All written to via AIClientService (or its future forecast/advertising/
-- roi counterparts) the same way ai_results is — these are the
-- structured, queryable views the dashboard reads, while ai_results
-- keeps the raw request/response audit trail.

BEGIN;

CREATE TABLE festival_calendar (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(100) NOT NULL,  -- Diwali, Holi, Eid, ...
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    expected_uplift_category VARCHAR(20),  -- LOW / MEDIUM / HIGH, kept simple deliberately
    notes                   TEXT
);

CREATE TABLE forecasts (
    id                    BIGSERIAL PRIMARY KEY,
    product_id            INTEGER NOT NULL REFERENCES products(id),
    forecast_type         VARCHAR(20) NOT NULL CHECK (forecast_type IN ('DEMAND', 'FESTIVAL', 'SEASONAL')),
    horizon_days          INTEGER NOT NULL,
    predicted_value       NUMERIC(12, 2) NOT NULL,
    stockout_risk         NUMERIC(4, 3),
    recommended_restock   INTEGER,
    festival_ref          INTEGER REFERENCES festival_calendar(id),
    ai_result_id          BIGINT REFERENCES ai_results(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forecasts_product_id ON forecasts(product_id);

CREATE TABLE advertising_campaigns (
    id             SERIAL PRIMARY KEY,
    product_id     INTEGER NOT NULL REFERENCES products(id),
    marketplace_id INTEGER REFERENCES marketplaces(id),
    status         VARCHAR(20) NOT NULL DEFAULT 'PROPOSED' CHECK (
        status IN ('PROPOSED', 'ACTIVE', 'PAUSED', 'ENDED')
    ),
    budget         NUMERIC(12, 2),
    start_date     DATE,
    end_date       DATE,
    ai_result_id   BIGINT REFERENCES ai_results(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_advertising_campaigns_product_id ON advertising_campaigns(product_id);

CREATE TABLE advertising_metrics (
    id           BIGSERIAL PRIMARY KEY,
    campaign_id  INTEGER NOT NULL REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    impressions  INTEGER NOT NULL DEFAULT 0,
    clicks       INTEGER NOT NULL DEFAULT 0,
    spend        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    revenue      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    roi          NUMERIC(6, 3)
);

CREATE INDEX idx_advertising_metrics_campaign_id ON advertising_metrics(campaign_id);

CREATE TABLE roi_records (
    id            BIGSERIAL PRIMARY KEY,
    product_id    INTEGER NOT NULL REFERENCES products(id),
    period        VARCHAR(30) NOT NULL,  -- e.g. '2026-09', 'Diwali-2026'
    cost          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    revenue       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    roi           NUMERIC(6, 3),
    ai_result_id  BIGINT REFERENCES ai_results(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roi_records_product_id ON roi_records(product_id);

CREATE TABLE restock_recommendations (
    id                    SERIAL PRIMARY KEY,
    product_id            INTEGER NOT NULL REFERENCES products(id),
    recommended_quantity  INTEGER NOT NULL,
    reason                TEXT,
    ai_result_id          BIGINT REFERENCES ai_results(id),
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'ACCEPTED', 'REJECTED')
    ),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restock_recommendations_product_id ON restock_recommendations(product_id);

COMMIT;