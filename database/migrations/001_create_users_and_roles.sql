-- Migration 001: users and roles
-- This is the first migration because auth (Phase 2) depends on it,
-- and every other table (products, orders, audit_logs, ...) references
-- users/roles for ownership and RBAC.

BEGIN;

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES
    ('ADMIN'),
    ('SELLER'),
    ('WAREHOUSE_MANAGER'),
    ('PACKING_OPERATOR'),
    ('INVENTORY_MANAGER'),
    ('ANALYST');

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role_id         INTEGER NOT NULL REFERENCES roles(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role_id ON users(role_id);

COMMIT;