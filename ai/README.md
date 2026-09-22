# MERCHANTRA — AI/ML Service (Person 2)

This is the first file for the `ai/` folder. It documents the architecture,
folder structure, dataset design, module contracts, and development phases
**before any implementation begins**, per project rules.

---

## 1. Architecture

```
C++ Backend (Person 1)
       |
       v
Python FastAPI AI Service (this folder)
       |
       v
AI Model
       |
       v
Prediction (JSON)
       |
       v
C++ Backend
       |
       v
PostgreSQL
```

- This service is **stateless** relative to the main database.
- It does **not** connect to or write PostgreSQL directly.
- It receives data from the C++ backend via REST, and returns structured JSON.
- The C++ backend is the single source of truth.

Status labeling convention used throughout this folder:
- `IMPLEMENTED` — real, working code
- `SIMULATED` — mock/prototype standing in for something unavailable
- `PLANNED` — not yet built

---

## 2. Folder Structure

```
ai/
    computer_vision/       # product match, damage, tampering detection
    return_fraud/          # return-risk scoring
    anomaly_detection/     # inventory/sales/verification anomalies
    demand_forecasting/    # 7/30/90-day demand forecasts
    festival_forecasting/  # festival/seasonal uplift models
    advertising/           # ad recommendation + budget/ROI estimates
    roi/                   # actual vs predicted ROI
    restocking/            # restock qty/date recommendations
    datasets/              # synthetic + cleaned datasets, clearly labeled
    models/                # trained model artifacts
    api/                   # FastAPI app, routes, schemas
    README.md              # this file
```

---

## 3. Dataset Design (Phase 1 target)

Planned synthetic dataset fields:

```
product_id, sku, category, marketplace, price, cost, stock, sales,
returns, return_reason, rating, advertising_spend, revenue, date,
festival, season, discount, orders
```

All datasets under `datasets/` will be clearly labeled `SIMULATED` /
synthetic — never presented as real marketplace data.

---

## 4. AI Modules (mapped to folders)

| Module | Folder | Core output |
|---|---|---|
| Product visual verification | computer_vision/ | match/damage/anomaly scores, decision |
| Return risk | return_fraud/ | risk_score, risk_level, reasons |
| Anomaly detection | anomaly_detection/ | anomaly_score, severity, reason |
| Demand forecasting | demand_forecasting/ | forecast, stockout_risk, restock qty |
| Festival forecasting | festival_forecasting/ | baseline/predicted demand, uplift |
| Restocking | restocking/ | order qty, order date, reason |
| Advertising | advertising/ | advertise flag, budget, expected ROI |
| ROI | roi/ | actual_roi, predicted_roi (kept separate) |

Every prediction endpoint returns `confidence` + `reason` fields
(explainability is mandatory, not optional).

---

## 5. API Contracts (draft — see Section 6 for stability rules)

Endpoints to be served from `api/` (FastAPI):

```
POST /ai/verify-product
POST /ai/detect-damage
POST /ai/return-risk
POST /ai/anomaly
POST /ai/forecast-demand
POST /ai/festival-forecast
POST /ai/restock
POST /ai/advertising
POST /ai/roi
POST /ai/business-forecast
GET  /health
```

Example (`/ai/verify-product`):

Request:
```json
{
  "product_id": "MCH-P-000125",
  "image_url": "...",
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

---

## 6. Integration Points with Person 1

- Person 1's C++ backend calls this service over REST/JSON only.
- This service never touches PostgreSQL.
- Once Person 1 begins integration, **response field names/shapes are frozen**
  — any change must be documented in this file under a "Changelog" section
  before Person 1 adapts to it.
- Branch: `person2-ai`. Only files under `ai/` are owned here.

---

## 7. Development Phases

1. AI architecture (this file) ✅
2. Dataset structure
3. Synthetic dataset generation
4. EDA
5. Feature engineering
6. Computer vision prototype
7. Return-risk model
8. Anomaly detection
9. Demand forecasting
10. Festival forecasting
11. Restocking
12. Advertising intelligence
13. ROI
14. Business forecasting
15. FastAPI service assembly
16. API testing
17. Integration with C++ backend

Implementation has not started. This file only defines shape and contracts.