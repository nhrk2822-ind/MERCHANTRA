# MERCHANTRA API Contracts

This documents what's actually implemented in `backend/`, not the
original sketch — treat this as the source of truth for both
developers. Update it whenever a contract changes.

## Auth

All endpoints below (except `/auth/register`, `/auth/login`) require
`Authorization: Bearer <token>`. WebSocket connections that can't set
headers use `?token=<token>` as a query param instead.

| Method | Path | Roles |
|---|---|---|
| POST | `/auth/register` | none (public) |
| POST | `/auth/login` | none (public) |
| GET | `/auth/me` | any logged-in user |

## Products

| Method | Path | Roles |
|---|---|---|
| GET | `/products` | any |
| POST | `/products` | ADMIN, SELLER |
| GET | `/products/:permanentId` | any |
| PATCH | `/products/:permanentId` | any (tighten if needed) |
| GET | `/products/:permanentId/timeline` | any |

## Inventory

| Method | Path | Roles |
|---|---|---|
| GET | `/inventory` | any |
| GET | `/inventory/low-stock` | any |
| POST | `/inventory/adjust` | ADMIN, INVENTORY_MANAGER, WAREHOUSE_MANAGER |

## Orders

| Method | Path | Roles |
|---|---|---|
| GET | `/orders` | any |
| POST | `/orders` | any |
| GET | `/orders/:id` | any |
| PATCH | `/orders/:id/status` | ADMIN, WAREHOUSE_MANAGER, PACKING_OPERATOR |

## Smart Station

| Method | Path | Roles |
|---|---|---|
| POST | `/station/scan` | any |
| POST | `/station/verify` | any |
| GET | `/station/status` | any |
| GET | `/station/sessions/:id` | any |
| WS | `/ws/station` | any — live push after every `/station/verify` |

`scanned_barcode`/`image_url` are NOT accepted from the client in
`/station/verify` — they come from `StationHardwareController`
(real or `Mock*` hardware, wired in `main.cpp`).

## Returns

| Method | Path | Roles |
|---|---|---|
| POST | `/returns` | any |
| POST | `/returns/:id/receive` | any |
| POST | `/returns/:id/inspect` | ADMIN, WAREHOUSE_MANAGER |

## Marketplaces

| Method | Path | Roles |
|---|---|---|
| GET | `/marketplaces` | any |
| POST | `/marketplaces/:id/sync` | any |

Returns `501 Not Implemented` for Amazon/Flipkart/Meesho/Myntra until
their real adapters are built — only `Manual` (`MockMarketplaceAdapter`)
returns real data today.

`sync` now persists into `marketplace_products` via `MarketplaceService`
(not just a report). Matching is currently SKU == external_listing_id —
a deliberately simple rule that won't hold for real marketplace data;
unmatched listings come back in the response's `unmatched_listing_ids`
rather than being silently dropped or auto-creating products.

## Forecasting / Advertising / ROI / Restock (read-only)

| Method | Path |
|---|---|
| GET | `/forecasts/:permanentId` |
| GET | `/advertising/:permanentId` |
| GET | `/roi/:permanentId` |
| GET | `/restock-recommendations` |

**None of these have a write/generate path yet** — they read whatever's
already in their tables. No code calls a Python `/ai/forecast-demand`
or `/ai/advertising` endpoint today.

## Audit Logs

| Method | Path | Roles |
|---|---|---|
| GET | `/audit-logs` | ADMIN, ANALYST |

**`audit_logs` is now written to** by `AuditService`, called from
`POST /auth/login`, `POST /inventory/adjust`, and `POST /returns/:id/inspect`.
Not every action is audited yet — only these three sensitive ones.

---

# C++ backend → Python AI service contract

This is what `AIClientService` actually calls. Person 2's service must
match these shapes exactly, or `AIClientService` will silently degrade
(see failure behavior below).

## POST /ai/verify-product

Request:
```json
{
  "product_id": "MCH-P-000125",
  "image_url": "https://...",
  "expected_category": "electronics"
}
```

Response:
```json
{
  "product_match_score": 0.97,
  "damage_probability": 0.03,
  "anomaly_score": 0.05,
  "confidence": 0.96,
  "decision": "PASS"
}
```
`decision` must be exactly `"PASS"`, `"FAIL"`, or `"REVIEW"`.

## POST /ai/return-risk

Request:
```json
{
  "product_id": "MCH-P-000125",
  "return_id": 42,
  "reason": "wrong size",
  "condition_notes": ""
}
```

Response:
```json
{
  "risk_score": 0.31,
  "confidence": 0.88,
  "reason": "Low prior return rate for this SKU"
}
```

## Failure behavior (both endpoints)

If the AI service is unreachable or times out (6s), `AIClientService`
does NOT throw or crash the request:
- `verifyProduct` returns `decision: "REVIEW"`, `confidence: 0` — the
  packing station falls back to manual review.
- `assessReturnRisk` returns `reason: "AI service unavailable"`,
  `riskScore: 0` — never treated as "safe to auto-restock".

Every call (success or failure) is persisted to `ai_results` with the
raw request/response JSON, so failures are visible in the DB, not just
in logs.

## Not yet implemented on the C++ side

These were in the original sketch but have no C++ caller yet — Person
2 doesn't need to support them until a corresponding backend feature
calls them:
- `/ai/detect-damage` (folded into `/ai/verify-product`'s
  `damage_probability` for now)
- `/ai/anomaly` (same — `anomaly_score` in verify-product)
- `/ai/forecast-demand`, `/ai/festival-forecast`, `/ai/restock`,
  `/ai/advertising`, `/ai/roi`