-- Migration 011: audit_logs
-- Not yet written to by anything (no AuditService exists) — this just
-- creates the table so AuditController has something to read. A
-- write-path (probably a lightweight hook in AuthFilter or per
-- sensitive action) is still to be built.

BEGIN;

CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     INTEGER,
    ip_address      VARCHAR(45),
    metadata_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

COMMIT;
