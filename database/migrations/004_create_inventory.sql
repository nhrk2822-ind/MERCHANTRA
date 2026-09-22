

BEGIN;

CREATE TABLE inventory (
    id                  SERIAL PRIMARY KEY,
    product_id          INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_location  VARCHAR(150) NOT NULL DEFAULT 'MAIN',
    quantity_on_hand    INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved   INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_available  INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (product_id, warehouse_location)
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- Append-only ledger: every stock change is a row here, never an
-- untracked UPDATE to inventory.quantity_on_hand. inventory itself is
-- the current-state cache; this table is the audit trail behind it.
CREATE TABLE inventory_movements (
    id              BIGSERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    movement_type   VARCHAR(20) NOT NULL CHECK (
        movement_type IN ('INBOUND', 'OUTBOUND', 'RESERVED', 'RELEASED', 'RESTOCK', 'ADJUSTMENT')
    ),
    quantity        INTEGER NOT NULL,
    reference_type  VARCHAR(50),
    reference_id    INTEGER,
    created_by      INTEGER REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);

COMMIT;
