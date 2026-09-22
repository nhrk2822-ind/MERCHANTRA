import os
import tempfile

from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

from ai.anomaly_detection.anomaly import detect_for_product
from ai.advertising.advertising import recommend_advertising
from ai.demand_forecasting.forecast import forecast_demand
from ai.festival_forecasting.festival import (
    forecast_festival,
    forecast_all_festivals,
)
from ai.restocking.restock import recommend_restock
from ai.return_fraud.return_risk import predict_return_risk
from ai.computer_vision.verify import ClassicalVerifier


app = FastAPI(
    title="MERCHANTRA AI Service",
    description="AI/ML service for the MERCHANTRA platform",
    version="1.0.0",
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class ProductRequest(BaseModel):
    product_id: str


class FestivalRequest(BaseModel):
    product_id: str
    festival_name: str | None = None


class RestockRequest(BaseModel):
    product_id: str
    lead_time_days: int = 14
    service_level: float = 0.95


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def home():
    return {
        "message": "MERCHANTRA AI Service is running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "MERCHANTRA AI Service",
    }


# ============================================================
# COMPUTER VISION
# POST /ai/verify-product
# ============================================================

@app.post("/ai/verify-product")
async def verify_product(
    image: UploadFile = File(...),
    reference_image: UploadFile | None = File(default=None),
):
    image_suffix = os.path.splitext(image.filename or ".jpg")[1] or ".jpg"

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=image_suffix,
    ) as temp_image:
        temp_image.write(await image.read())
        image_path = temp_image.name

    reference_path = None

    try:
        if reference_image is not None:
            reference_suffix = (
                os.path.splitext(reference_image.filename or ".jpg")[1]
                or ".jpg"
            )

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=reference_suffix,
            ) as temp_reference:
                temp_reference.write(await reference_image.read())
                reference_path = temp_reference.name

        verifier = ClassicalVerifier()

        result = verifier.verify(
            image_path=image_path,
            reference_image_path=reference_path,
        )

        return result.to_dict()

    finally:
        if os.path.exists(image_path):
            os.remove(image_path)

        if reference_path and os.path.exists(reference_path):
            os.remove(reference_path)


# ============================================================
# ANOMALY DETECTION
# POST /ai/anomaly
# ============================================================

@app.post("/ai/anomaly")
def anomaly(request: ProductRequest):
    return {
        "product_id": request.product_id,
        "results": detect_for_product(request.product_id),
    }


# ============================================================
# RETURN RISK
# POST /ai/return-risk
# ============================================================

@app.post("/ai/return-risk")
def return_risk(request: ProductRequest):
    return predict_return_risk(request.product_id)


# ============================================================
# DEMAND FORECASTING
# POST /ai/forecast-demand
# ============================================================

@app.post("/ai/forecast-demand")
def forecast_demand_api(request: ProductRequest):
    return forecast_demand(request.product_id)


# ============================================================
# FESTIVAL FORECASTING
# POST /ai/festival-forecast
# ============================================================

@app.post("/ai/festival-forecast")
def festival_forecast(request: FestivalRequest):

    if request.festival_name:
        return forecast_festival(
            request.product_id,
            request.festival_name,
        )

    return forecast_all_festivals(request.product_id)


# ============================================================
# RESTOCKING
# POST /ai/restock
# ============================================================

@app.post("/ai/restock")
def restock(request: RestockRequest):

    return recommend_restock(
        request.product_id,
        lead_time_days=request.lead_time_days,
        service_level=request.service_level,
    )


# ============================================================
# ADVERTISING
# POST /ai/advertising
# ============================================================

@app.post("/ai/advertising")
def advertising(request: ProductRequest):
    return recommend_advertising(request.product_id)