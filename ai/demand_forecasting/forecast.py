"""
MERCHANTRA - Demand Forecasting (Phase 9)

Status: IMPLEMENTED (classical ML prototype). statsmodels/Prophet were not
available in this environment, so forecasting uses a scikit-learn
regressor over lag/rolling/calendar features with recursive multi-step
prediction — a standard, practical approach for short/medium-horizon
retail demand forecasting.

Approach:
  1. Train ONE global RandomForestRegressor to predict "next day's sales"
     for any product, using day-of-week, month, festival flag, lag-1,
     lag-7, rolling means/std, category, marketplace, price, discount,
     and advertising spend.
  2. To forecast N days ahead for a specific product, recursively predict
     one day at a time, feeding each prediction back in as the next day's
     lag feature (standard recursive forecasting).
  3. Sum daily predictions into 7/30/90-day forecasts, and derive
     stockout_risk and recommended_restock from current stock vs.
     forecasted cumulative demand.

Usage:
    python ../datasets/generate_dataset.py --num-products 500 --days 365
    python ../datasets/feature_engineering.py
    python forecast.py --train
    python forecast.py --predict MCH-P-000001

Dependencies:
    pip install scikit-learn pandas numpy joblib
"""

import argparse
import os
from datetime import timedelta

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "demand_forecast_model.joblib")

NUMERIC_FEATURES = [
    "day_of_week", "is_weekend", "is_festival", "month",
    "sales_lag_1", "sales_lag_7", "sales_rolling_mean_7",
    "sales_rolling_mean_30", "sales_rolling_std_7",
    "discount", "advertising_spend",
]
# "festival" (name, or "none") is included alongside the generic is_festival
# flag so the model can learn DIFFERENT uplift per festival (Diwali vs.
# Christmas vs. Holi, etc.) instead of one flat "festival happening" bump.
CATEGORICAL_FEATURES = ["category", "marketplace", "festival"]
TARGET_COLUMN = "sales"

# Same festival calendar as generate_dataset.py, kept in sync so recursive
# forecasting knows which future dates are festival windows.
FESTIVAL_CALENDAR = {
    (1, 1): ("New Year", 1.3),
    (2, 14): ("Valentine's Day", 1.4),
    (3, 8): ("Holi", 1.5),
    (4, 10): ("Eid", 1.3),
    (8, 19): ("Raksha Bandhan", 1.35),
    (10, 20): ("Diwali", 1.9),
    (11, 24): ("Wedding Season Peak", 1.4),
    (12, 25): ("Christmas", 1.6),
}
FESTIVAL_WINDOW_DAYS = 5

LEAD_TIME_DAYS = 14   # assumed restock lead time
SAFETY_STOCK_DAYS = 5  # extra buffer days of demand to hold


def is_festival_date(d) -> int:
    return 1 if festival_name_for_date(d) != "none" else 0


def festival_name_for_date(d) -> str:
    for (m, day), (name, _) in FESTIVAL_CALENDAR.items():
        try:
            festival_date = d.replace(month=m, day=day)
        except ValueError:
            continue
        if abs((d - festival_date).days) <= FESTIVAL_WINDOW_DAYS:
            return name
    return "none"


def load_sales_features():
    path = os.path.join(DATA_DIR, "sales_features.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"{path} not found. Run generate_dataset.py then feature_engineering.py first."
        )
    return pd.read_csv(path, parse_dates=["date"])


def load_products():
    path = os.path.join(DATA_DIR, "products_master.csv")
    return pd.read_csv(path)


def build_design_matrix(df: pd.DataFrame, encoder: OneHotEncoder = None, fit: bool = False):
    numeric = df[NUMERIC_FEATURES].fillna(0.0)
    df = df.copy()
    if "festival" in df.columns:
        df["festival"] = df["festival"].fillna("none")
    categorical_raw = df[CATEGORICAL_FEATURES].fillna("unknown").astype(str)

    if fit:
        encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        categorical_encoded = encoder.fit_transform(categorical_raw)
    else:
        categorical_encoded = encoder.transform(categorical_raw)

    cat_columns = encoder.get_feature_names_out(CATEGORICAL_FEATURES)
    categorical_df = pd.DataFrame(categorical_encoded, columns=cat_columns, index=df.index)

    X = pd.concat([numeric.reset_index(drop=True), categorical_df.reset_index(drop=True)], axis=1)
    return X, encoder


def train(save: bool = True):
    sales = load_sales_features()
    products = load_products()
    df = sales.merge(products[["product_id", "category", "marketplace"]], on="product_id")
    df["festival"] = df["festival"].fillna("none")

    X, encoder = build_design_matrix(df, fit=True)
    y = df[TARGET_COLUMN].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=300, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"[SIMULATED] Trained RandomForestRegressor on {len(X_train)} product-day rows")
    print(f"[SIMULATED] Test MAE: {mae:.3f} units/day | Test R^2: {r2:.3f}")

    if save:
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump({"model": model, "encoder": encoder}, MODEL_PATH)
        print(f"[SIMULATED] Model saved -> {MODEL_PATH}")

    return model, encoder


def _recursive_forecast(product_id: str, horizon_days: int, model, encoder,
                         sales_df: pd.DataFrame, products_df: pd.DataFrame) -> list:
    """Predict `horizon_days` of future daily sales for one product,
    feeding each day's prediction back in as the next day's lag feature."""
    history = sales_df[sales_df["product_id"] == product_id].sort_values("date")
    if history.empty:
        raise ValueError(f"product_id {product_id} not found in sales_features.csv")

    product_row = products_df[products_df["product_id"] == product_id].iloc[0]
    category, marketplace = product_row["category"], product_row["marketplace"]

    last_date = history["date"].max()
    recent_sales = history["sales"].tail(7).tolist()
    recent_30 = history["sales"].tail(30).tolist()
    last_discount = float(history["discount"].iloc[-1])
    last_ad_spend = float(history["advertising_spend"].tail(7).mean())

    predictions = []
    for step in range(1, horizon_days + 1):
        future_date = last_date + timedelta(days=step)

        row = pd.DataFrame([{
            "day_of_week": future_date.dayofweek,
            "is_weekend": int(future_date.dayofweek >= 5),
            "is_festival": is_festival_date(future_date),
            "festival": festival_name_for_date(future_date),
            "month": future_date.month,
            "sales_lag_1": recent_sales[-1] if recent_sales else 0.0,
            "sales_lag_7": recent_sales[-7] if len(recent_sales) >= 7 else (recent_sales[0] if recent_sales else 0.0),
            "sales_rolling_mean_7": float(np.mean(recent_sales[-7:])) if recent_sales else 0.0,
            "sales_rolling_mean_30": float(np.mean(recent_30[-30:])) if recent_30 else 0.0,
            "sales_rolling_std_7": float(np.std(recent_sales[-7:])) if len(recent_sales) > 1 else 0.0,
            "discount": last_discount,
            "advertising_spend": last_ad_spend,
            "category": category,
            "marketplace": marketplace,
        }])

        X, _ = build_design_matrix(row, encoder=encoder, fit=False)
        predicted_sales = max(0.0, float(model.predict(X)[0]))

        predictions.append({"date": future_date.date().isoformat(), "predicted_sales": round(predicted_sales, 2)})

        recent_sales.append(predicted_sales)
        recent_30.append(predicted_sales)
        if len(recent_sales) > 30:
            recent_sales = recent_sales[-30:]
        if len(recent_30) > 60:
            recent_30 = recent_30[-60:]

    return predictions


def forecast_demand(product_id: str) -> dict:
    """
    Public entrypoint matching the AI API contract for POST /ai/forecast-demand.

    Returns:
        {
            "forecast_7_days": float,
            "forecast_30_days": float,
            "forecast_90_days": float,
            "stockout_risk": float,
            "recommended_restock": int,
            "confidence": float,
            "reason": str
        }
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("No trained model found. Run `python forecast.py --train` first.")

    bundle = joblib.load(MODEL_PATH)
    model, encoder = bundle["model"], bundle["encoder"]

    sales_df = load_sales_features()
    products_df = load_products()

    daily_predictions = _recursive_forecast(product_id, 90, model, encoder, sales_df, products_df)
    daily_values = [p["predicted_sales"] for p in daily_predictions]

    forecast_7 = round(sum(daily_values[:7]), 1)
    forecast_30 = round(sum(daily_values[:30]), 1)
    forecast_90 = round(sum(daily_values[:90]), 1)

    current_stock = float(
        sales_df[sales_df["product_id"] == product_id].sort_values("date")["stock"].iloc[-1]
    )

    lead_time_demand = sum(daily_values[:LEAD_TIME_DAYS])
    stockout_risk = float(np.clip(lead_time_demand / (current_stock + 1e-6), 0, 1)) if current_stock >= 0 else 1.0

    safety_stock = np.mean(daily_values[:LEAD_TIME_DAYS]) * SAFETY_STOCK_DAYS if daily_values else 0
    recommended_restock = int(max(0, round(lead_time_demand + safety_stock - current_stock)))

    days_of_history = len(sales_df[sales_df["product_id"] == product_id])
    confidence = float(np.clip(0.5 + min(days_of_history, 180) / 180 * 0.4, 0, 0.9))

    reason = (
        f"Recursive forecast from {days_of_history} days of history; "
        f"lead-time demand ({LEAD_TIME_DAYS}d) = {lead_time_demand:.1f} units vs "
        f"current stock = {current_stock:.0f} units"
    )

    return {
        "product_id": product_id,
        "forecast_7_days": forecast_7,
        "forecast_30_days": forecast_30,
        "forecast_90_days": forecast_90,
        "stockout_risk": round(stockout_risk, 3),
        "recommended_restock": recommended_restock,
        "confidence": round(confidence, 3),
        "reason": reason,
    }


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA demand forecasting.")
    parser.add_argument("--train", action="store_true", help="Train and save the model.")
    parser.add_argument("--predict", type=str, metavar="PRODUCT_ID", help="Forecast demand for a product.")
    args = parser.parse_args()

    if args.train:
        train()
    elif args.predict:
        result = forecast_demand(args.predict)
        print(result)
    else:
        print("Nothing to do. Use --train or --predict PRODUCT_ID.")


if __name__ == "__main__":
    main()