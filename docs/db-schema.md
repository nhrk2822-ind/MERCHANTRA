# MERCHANTRA Database Schema

Summary of all 11 migrations, in run order. Full DDL lives in
`database/migrations/*.sql` — this is the map, not a copy.

| # | File | Tables |
|---|---|---|
| 001 | `001_create_users_and_roles.sql` | `roles`, `users` |
| 002 | `002_create_products.sql` | `products`, `product_identifiers` |
| 003 | `003_create_product_events.sql` | `product_events` (lifecycle timeline) |
| 004 | `004_create_inventory.sql` | `inventory`, `inventory_movements` |
| 005 | `005_create_orders.sql` | `orders`, `order_items` |
| 006 | `006_create_packing_verification.sql` | `packing_sessions`, `verification_results` |
| 007 | `007_create_ai_results.sql` | `ai_results` |
| 008 | `008_create_returns.sql` | `returns`, `return_inspections` |
| 009 | `009_create_marketplaces.sql` | `marketplaces`, `marketplace_products` (+ backfills FKs on `product_identifiers`, `orders`) |
| 010 | `010_create_intelligence_tables.sql` | `festival_calendar`, `forecasts`, `advertising_campaigns`, `advertising_metrics`, `roi_records`, `restock_recommendations` |
| 011 | `011_create_audit_logs.sql` | `audit_logs` |

## Core relationships

```
products (permanent_product_id = MCH-P-000125, the anchor for everything)
  ├─ product_identifiers (barcode, marketplace IDs, ...)
  ├─ inventory ── inventory_movements (append-only ledger)
  ├─ order_items ── orders
  ├─ product_events (every lifecycle event, keyed by permanent_product_id)
  ├─ packing_sessions ── verification_results
  ├─ returns ── return_inspections
  ├─ ai_results (every AI call's raw request/response)
  ├─ forecasts / advertising_campaigns / roi_records / restock_recommendations
  └─ marketplace_products
```

## Tables where the code doesn't write yet

Exist in the schema, but nothing currently inserts into them — reads
(via their controllers) will just return empty results until a writer
is built:
- `audit_logs` — no `AuditService` exists yet
- `forecasts`, `advertising_campaigns`, `advertising_metrics`,
  `roi_records`, `restock_recommendations` — no AI-generation call path
  exists yet (see `docs/api-contracts.md` for what's actually wired)
- `festival_calendar` — no seed data or admin UI to populate it

## Design notes worth knowing before touching the schema

- **`permanent_product_id` (not the internal `products.id`) is the key
  most other tables reference for cross-table lookups** — it's what's
  human-visible and what AI calls, timeline events, and the frontend
  all key off. `products.id` is still the real FK target for
  relational integrity, but `permanent_product_id` is duplicated onto
  `order_items`, `product_events`, `packing_sessions`, `returns`, and
  `ai_results` specifically to avoid needing a join back to `products`
  on every read of those.
- **`inventory.quantity_available` is a generated column**
  (`on_hand - reserved`) — never write to it directly, Postgres
  computes it.
- **`inventory_movements` and `ai_results` are append-only audit
  trails** — always INSERT, never UPDATE/DELETE existing rows.
- Two FKs (`product_identifiers.marketplace_id`, `orders.marketplace_id`)
  are added via `ALTER TABLE` in migration 009, not in their original
  migrations (002, 005) — `marketplaces` didn't exist yet at that point.