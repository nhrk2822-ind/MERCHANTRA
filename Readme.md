# MERCHANTRA

AI-powered product intelligence, e-commerce traceability, inventory,
smart verification, return-risk, forecasting and advertising
intelligence platform.

Every product gets a **Permanent Product ID** (e.g. `MCH-P-000125`) that
follows it through its full lifecycle: marketplace listing → barcode →
inventory → order → packing → smart-station verification → shipping →
delivery → return → return inspection → AI return risk → inventory
update → demand forecast → restocking → advertising → ROI.

## Architecture

```
React Frontend → C++ Core Backend (source of truth) → PostgreSQL
                          ↓
                  Python AI Service (Person 2)
```

The C++ backend is authoritative. The Python AI service never writes to
the main database directly — it returns JSON to the C++ backend, which
persists the result.

## Repository layout

| Folder | Owner | Contents |
|---|---|---|
| `frontend/` | Person 1 | React + Tailwind + Recharts dashboard |
| `backend/` | Person 1 | C++ (Drogon) core API, DB access, auth, IoT/marketplace integration |
| `database/` | Person 1 | SQL schema and migrations |
| `iot/` | Person 1 | Smart Station hardware/simulator scripts |
| `ai/` | Person 2 | Python (FastAPI) AI services: CV, fraud, forecasting, advertising, ROI |
| `tests/` | Shared | Backend and integration tests |
| `docs/` | Shared | `api-contracts.md`, `db-schema.md` |
| `docker/` | Shared | Container configs |

## Getting started

Backend, frontend, and database setup instructions will be added as each
is implemented (see `docs/`). Nothing here is runnable yet — the repo is
currently a folder skeleton awaiting Phase 1 implementation.

## Status

`PLANNED` — architecture, schema, and API contracts are agreed;
implementation has not started.