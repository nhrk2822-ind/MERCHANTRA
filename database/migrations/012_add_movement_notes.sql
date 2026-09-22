-- Migration 012: adds a notes column to inventory_movements so
-- InventoryService::adjustStock's `reason` parameter (accepted since
-- it was first written, but never persisted — see InventoryService.cpp)
-- actually gets stored instead of silently discarded.

BEGIN;

ALTER TABLE inventory_movements ADD COLUMN notes TEXT;

COMMIT;