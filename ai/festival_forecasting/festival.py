"""
MERCHANTRA - Festival / Seasonal Forecasting (Phase 10)

Status: IMPLEMENTED (classical ML prototype). Reuses the demand
forecasting model trained in Phase 9 (ai/demand_forecasting/forecast.py) —
no separate model is trained here, so festival predictions stay
consistent with the main demand forecast.

Approach:
  For a given product and festival, hold the product's current
  lag/rolling/price/discount/ad-spend context fixed, and vary ONLY the
  calendar inputs (day-of-week, month, is_festival flag) across the
  festival's date window. This isolates the marginal demand effect the
  model has learned to associate with that calendar window:

    baseline_demand  = sum of daily predictions with is_festival forced to 0
    predicted_demand = sum of daily predictions with is_festival = 1
    festival_uplift  = predicted_demand / baseline_demand - 1

Usage:
    python ../demand_forecasting/forecast.py --train   # train once
    python festival.py --predict MCH-P-000001
    python festival.py --predict MCH-P-000001 --festival Diwali

Dependencies:
    pip install scikit-learn pandas numpy joblib
"""

import argparse
import os
from datetime import date, timedelta

import joblib
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "demand_forecast_model.joblib")

NUMERIC_FEATURES = [
    "day_of_week", "is_weekend", "is_festival", "month",
    "sales_lag_1", "sales_lag_7", "sales_rolling_mean_7",
    "sales_rolling_mean_30", "sales_rolling_std_7",
    "discount", "advertising_spend",
]
CATEGORICAL_FEATURES = ["category", "marketplace", "festival"]

# Same calendar as generate_dataset.py / forecast.py, kept in sync.
FESTIVAL_CALENDAR = {
    "New Year": (1, 1, 1.3),
    "Valentine's Day": (2, 14, 1.4),
    "Holi": (3, 8, 1.5),
    "Eid": (4, 10, 1.3),
    "Raksha Bandhan": (8, 19, 1.35),
    "Diwali": (10, 20, 1.9),
    "Wedding Season Peak": (11, 24, 1.4),
    "Christmas": (12, 25, 1.6),
}
FESTIVAL_WINDOW_DAYS = 5


def load_sales_features():
    path = os.path.join(DATA_DIR, "sales_features.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"{path} not found. Run generate_dataset.py + feature_engineering.py first.")
    return pd.read_csv(path, parse_dates=["date"])


def load_products():
    return pd.read_csv(os.path.join(DATA_DIR, "products_master.csv"))


def _next_occurrence(month: int, day: int, after: date) -> date:
    candidate = date(after.year, month, day)
    if candidate < after:
        candidate = date(after.year + 1, month, day)
    return candidate


def _build_row(context: dict, target_date: date, is_festival: int, festival_name: str) -> pd.DataFrame:
    return pd.DataFrame([{
        "day_of_week": target_date.weekday(),
        "is_weekend": int(target_date.weekday() >= 5),
        "is_festival": is_festival,
        "festival": festival_name,
        "month": target_date.month,
        "sales_lag_1": context["sales_lag_1"],
        "sales_lag_7": context["sales_lag_7"],
        "sales_rolling_mean_7": context["sales_rolling_mean_7"],
        "sales_rolling_mean_30": context["sales_rolling_mean_30"],
        "sales_rolling_std_7": context["sales_rolling_std_7"],
        "discount": context["discount"],
        "advertising_spend": context["advertising_spend"],
        "category": context["category"],
        "marketplace": context["marketplace"],
    }])


def _build_design_matrix(df: pd.DataFrame, encoder):
    numeric = df[NUMERIC_FEATURES].fillna(0.0)
    categorical_raw = df[CATEGORICAL_FEATURES].fillna("unknown").astype(str)
    categorical_encoded = encoder.transform(categorical_raw)
    cat_columns = encoder.get_feature_names_out(CATEGORICAL_FEATURES)
    categorical_df = pd.DataFrame(categorical_encoded, columns=cat_columns, index=df.index)
    return pd.concat([numeric.reset_index(drop=True), categorical_df.reset_index(drop=True)], axis=1)


def _get_product_context(product_id: str, sales_df: pd.DataFrame, products_df: pd.DataFrame) -> dict:
    history = sales_df[sales_df["product_id"] == product_id].sort_values("date")
    if history.empty:
        raise ValueError(f"product_id {product_id} not found in sales_features.csv")

    product_row = products_df[products_df["product_id"] == product_id].iloc[0]
    recent = history.tail(30)

    return {
        "category": product_row["category"],
        "marketplace": product_row["marketplace"],
        "sales_lag_1": float(history["sales"].iloc[-1]),
        "sales_lag_7": float(history["sales"].tail(7).iloc[0]) if len(history) >= 7 else float(history["sales"].iloc[-1]),
        "sales_rolling_mean_7": float(history["sales"].tail(7).mean()),
        "sales_rolling_mean_30": float(recent["sales"].mean()),
        "sales_rolling_std_7": float(history["sales"].tail(7).std() or 0.0),
        "discount": float(history["discount"].iloc[-1]),
        "advertising_spend": float(recent["advertising_spend"].mean()),
        "days_of_history": len(history),
    }


def forecast_festival(product_id: str, festival_name: str) -> dict:
    """
    Public entrypoint matching the AI API contract for POST /ai/festival-forecast.

    Returns:
        {
            "festival": str,
            "baseline_demand": float,
            "predicted_demand": float,
            "festival_uplift": float,
            "confidence": float
        }
    """
    if festival_name not in FESTIVAL_CALENDAR:
        raise ValueError(f"Unknown festival '{festival_name}'. Known: {list(FESTIVAL_CALENDAR.keys())}")

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("No trained model found. Run `python ../demand_forecasting/forecast.py --train` first.")

    bundle = joblib.load(MODEL_PATH)
    model, encoder = bundle["model"], bundle["encoder"]

    sales_df = load_sales_features()
    products_df = load_products()
    context = _get_product_context(product_id, sales_df, products_df)

    month, day, _ = FESTIVAL_CALENDAR[festival_name]
    festival_date = _next_occurrence(month, day, date.today())
    window_dates = [festival_date + timedelta(days=d) for d in range(-FESTIVAL_WINDOW_DAYS, FESTIVAL_WINDOW_DAYS + 1)]

    baseline_total = 0.0
    festival_total = 0.0
    for d in window_dates:
        baseline_row = _build_row(context, d, is_festival=0, festival_name="none")
        festival_row = _build_row(context, d, is_festival=1, festival_name=festival_name)

        X_baseline = _build_design_matrix(baseline_row, encoder)
        X_festival = _build_design_matrix(festival_row, encoder)

        baseline_total += max(0.0, float(model.predict(X_baseline)[0]))
        festival_total += max(0.0, float(model.predict(X_festival)[0]))

    uplift = (festival_total / baseline_total - 1) if baseline_total > 0 else 0.0
    confidence = float(np.clip(0.5 + min(context["days_of_history"], 180) / 180 * 0.35, 0, 0.85))

    return {
        "product_id": product_id,
        "festival": festival_name,
        "festival_date_this_cycle": festival_date.isoformat(),
        "window_days": FESTIVAL_WINDOW_DAYS * 2 + 1,
        "baseline_demand": round(baseline_total, 1),
        "predicted_demand": round(festival_total, 1),
        "festival_uplift": round(uplift, 3),
        "confidence": round(confidence, 3),
    }


def forecast_all_festivals(product_id: str) -> list:
    return [forecast_festival(product_id, name) for name in FESTIVAL_CALENDAR]


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA festival/seasonal forecasting.")
    parser.add_argument("--predict", type=str, metavar="PRODUCT_ID", required=True)
    parser.add_argument("--festival", type=str, help="Specific festival name. Omit to show all.")
    args = parser.parse_args()

    if args.festival:
        print(forecast_festival(args.predict, args.festival))
    else:
        for result in forecast_all_festivals(args.predict):
            print(result)


if __name__ == "__main__":
    main()