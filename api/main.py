"""
MERCHANTRA - AI Service (Phase 15)

Status: IMPLEMENTED. This is the single FastAPI app the C++ backend talks
to. It is a thin routing layer only — all real logic lives in the
per-phase modules (computer_vision/, return_fraud/, anomaly_detection/,
demand_forecasting/, festival_forecasting/, restocking/, advertising/,
roi/). This file must not contain model logic itself, so each module can
keep being developed/tested independently via its own CLI.

IMPORTANT: models must already be trained and datasets already generated
before starting this service — it does NOT train on request:

    cd ../datasets
    python generate_dataset.py --num-products 500 --days 730
    python feature_engineering.py
    cd ../demand_forecasting && python forecast.py --train
    cd ../return_fraud && python return_risk.py --train
    cd ../anomaly_detection && python anomaly.py --train
    cd ../advertising && python advertising.py --train

Run this service:
    pip install fastapi uvicorn pandas numpy scikit-learn scipy joblib \
                opencv-python-headless scikit-image pillow
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Endpoints (see ai/README.md for the full contract):
    GET  /health
    POST /ai/verify-product
    POST /ai/detect-damage
    POST /ai/return-risk
    POST /ai/anomaly
    POST /ai/forecast-demand
    POST /ai/festival-forecast
    POST /ai/restock
    POST /ai/advertising
    POST /ai/roi
    GET  /ai/business-forecast
"""

import os
import sys
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ------------------------------------------------------------------
# Wire up sibling modules. Each phase folder is its own standalone
# script/CLI (by design, per the project's "don't build one giant file"
# rule) — this API layer just imports them.
# ------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
for _sibling in ["computer_vision", "return_fraud", "anomaly_detection",
                  "demand_forecasting", "festival_forecasting", "restocking",
                  "advertising", "roi"]:
    sys.path.insert(0, os.path.join(_THIS_DIR, "..", _sibling))

import verify                    # ai/computer_vision/verify.py
import return_risk                # ai/return_fraud/return_risk.py
import anomaly                    # ai/anomaly_detection/anomaly.py
import forecast as demand_forecast  # ai/demand_forecasting/forecast.py
import business_forecast          # ai/demand_forecasting/business_forecast.py
import festival                   # ai/festival_forecasting/festival.py
import restock                    # ai/restocking/restock.py
import advertising                # ai/advertising/advertising.py
import roi                        # ai/roi/roi.py

app = FastAPI(
    title="MERCHANTRA AI Service",
    version="0.1.0",
    description="Person 2's AI/ML layer. Never writes to PostgreSQL directly — "
                 "the C++ backend is the source of truth. See ai/README.md.",
)

# CORS left open for local dev; tighten before any real deployment.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _wrap(fn, *args, **kwargs):
    """Common error handling so every endpoint fails the same explainable way."""
    try:
        return fn(*args, **kwargs)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Model/data not ready: {e}")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:  # noqa: BLE001 - deliberately broad at the API boundary
        raise HTTPException(status_code=500, detail=f"Internal AI service error: {e}")


# ------------------------------------------------------------------
# Request schemas
# ------------------------------------------------------------------
class VerifyProductRequest(BaseModel):
    product_id: str
    image_path: str                       # shared-volume path, NOT a public URL (see README)
    reference_image_path: Optional[str] = None
    expected_category: Optional[str] = None  # accepted for contract compatibility; not yet used


class ProductIdRequest(BaseModel):
    product_id: str


class AnomalyRequest(BaseModel):
    product_id: Optional[str] = None
    recent_days: int = 30
    scan_top: Optional[int] = None  # if set (and product_id omitted), scans whole dataset


class FestivalForecastRequest(BaseModel):
    product_id: str
    festival: Optional[str] = None  # omit to get all festivals


class RestockRequest(BaseModel):
    product_id: str
    lead_time_days: int = restock.DEFAULT_LEAD_TIME_DAYS
    service_level: float = restock.DEFAULT_SERVICE_LEVEL


# ------------------------------------------------------------------
# Health
# ------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "service": "merchantra-ai", "version": app.version}


# ------------------------------------------------------------------
# Computer vision (Phase 6)
# ------------------------------------------------------------------
@app.post("/ai/verify-product")
def verify_product(req: VerifyProductRequest):
    def run():
        verifier = verify.ClassicalVerifier()
        result = verifier.verify(req.image_path, reference_image_path=req.reference_image_path)
        return {"product_id": req.product_id, **result.to_dict()}
    return _wrap(run)


@app.post("/ai/detect-damage")
def detect_damage(req: VerifyProductRequest):
    """Same underlying verifier as /ai/verify-product; kept as a separate
    contract endpoint per the original spec, returning just the
    damage-relevant subset."""
    def run():
        verifier = verify.ClassicalVerifier()
        result = verifier.verify(req.image_path, reference_image_path=req.reference_image_path)
        return {
            "product_id": req.product_id,
            "damage_probability": result.damage_probability,
            "confidence": result.confidence,
            "decision": result.decision,
            "reason": result.reason,
        }
    return _wrap(run)


# ------------------------------------------------------------------
# Return risk (Phase 7)
# ------------------------------------------------------------------
@app.post("/ai/return-risk")
def return_risk_endpoint(req: ProductIdRequest):
    return _wrap(return_risk.predict_return_risk, req.product_id)


# ------------------------------------------------------------------
# Anomaly detection (Phase 8)
# ------------------------------------------------------------------
@app.post("/ai/anomaly")
def anomaly_endpoint(req: AnomalyRequest):
    def run():
        if req.product_id:
            return {"product_id": req.product_id,
                     "anomalies": anomaly.detect_for_product(req.product_id, req.recent_days)}
        top_n = req.scan_top or 20
        df = anomaly.scan_top_anomalies(top_n)
        return {"scan_top": top_n, "anomalies": df.to_dict(orient="records")}
    return _wrap(run)


# ------------------------------------------------------------------
# Demand forecasting (Phase 9)
# ------------------------------------------------------------------
@app.post("/ai/forecast-demand")
def forecast_demand_endpoint(req: ProductIdRequest):
    return _wrap(demand_forecast.forecast_demand, req.product_id)


# ------------------------------------------------------------------
# Festival forecasting (Phase 10)
# ------------------------------------------------------------------
@app.post("/ai/festival-forecast")
def festival_forecast_endpoint(req: FestivalForecastRequest):
    def run():
        if req.festival:
            return festival.forecast_festival(req.product_id, req.festival)
        return {"product_id": req.product_id, "festivals": festival.forecast_all_festivals(req.product_id)}
    return _wrap(run)


# ------------------------------------------------------------------
# Restocking (Phase 11)
# ------------------------------------------------------------------
@app.post("/ai/restock")
def restock_endpoint(req: RestockRequest):
    return _wrap(restock.recommend_restock, req.product_id, req.lead_time_days, req.service_level)


# ------------------------------------------------------------------
# Advertising intelligence (Phase 12)
# ------------------------------------------------------------------
@app.post("/ai/advertising")
def advertising_endpoint(req: ProductIdRequest):
    return _wrap(advertising.recommend_advertising, req.product_id)


# ------------------------------------------------------------------
# ROI (Phase 13) — actual and predicted, always returned separately
# ------------------------------------------------------------------
@app.post("/ai/roi")
def roi_endpoint(req: ProductIdRequest):
    return _wrap(roi.roi_report, req.product_id)


# ------------------------------------------------------------------
# Business forecasting / dashboard (Phase 14)
# ------------------------------------------------------------------
@app.get("/ai/business-forecast")
def business_forecast_endpoint():
    return _wrap(business_forecast.build_dashboard_summary)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)