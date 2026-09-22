"""
MERCHANTRA - Smart Restocking (Phase 11)

Status: IMPLEMENTED (classical ML + statistics prototype). Reuses the
demand forecasting model trained in Phase 9 (ai/demand_forecasting/
forecast.py) — no separate model here, so restock recommendations stay
consistent with the main demand forecast.

Approach:
  1. Get a day-by-day recursive demand forecast for the lead-time window
     (reuses ai/demand_forecasting/forecast.py's _recursive_forecast).
  2. Model lead-time demand as Normal(mean, std) using the forecasted
     mean and the product's recent daily-sales volatility, scaled for a
     multi-day window (std scales with sqrt(days) under an independence
     assumption — a standard simplification for this kind of prototype).
  3. stockout_probability = P(lead-time demand > current stock), i.e.
     1 - CDF(current_stock) under that Normal model.
  4. recommended_order_quantity targets a configurable service level
     (default 95%) using the same distribution: order enough to cover
     mean demand plus a z-score safety buffer, minus current stock.
  5. If a festival window (from festival_forecasting) falls inside the
     lead-time horizon, it's called out explicitly in `reason` — the
     forecast itself already reflects the uplift since Phase 9 now
     encodes festival identity as a feature.

Usage:
    python ../demand_forecasting/forecast.py --train   # train once
    python restock.py --predict MCH-P-000001
    python restock.py --predict MCH-P-000001 --lead-time 21 --service-level 0.99

Dependencies:
    pip install scikit-learn scipy pandas numpy joblib
"""

import argparse
import os
import sys
from datetime import date, timedelta

import joblib
import numpy as np
import pandas as pd
from scipy.stats import norm

# Reuse Phase 9's trained model + recursive forecaster instead of duplicating it.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "demand_forecasting"))
import forecast as demand_forecast  # noqa: E402

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")

DEFAULT_LEAD_TIME_DAYS = 14
DEFAULT_SERVICE_LEVEL = 0.95  # target probability of NOT stocking out during lead time

# Same festival calendar, used only to flag "a festival falls in your lead
# time" in the explanation — the forecast numbers themselves already bake
# in the uplift via the trained model.
FESTIVAL_WINDOWS = demand_forecast.FESTIVAL_CALENDAR


def _upcoming_festivals_within(days_ahead: int, today: date) -> list:
    hits = []
    for (month, day), (name, _mult) in FESTIVAL_WINDOWS.items():
        candidate = date(today.year, month, day)
        if candidate < today:
            candidate = date(today.year + 1, month, day)
        days_until = (candidate - today).days
        if 0 <= days_until <= days_ahead:
            hits.append((name, candidate, days_until))
    return sorted(hits, key=lambda x: x[2])


def recommend_restock(product_id: str, lead_time_days: int = DEFAULT_LEAD_TIME_DAYS,
                       service_level: float = DEFAULT_SERVICE_LEVEL) -> dict:
    """
    Public entrypoint matching the AI API contract for POST /ai/restock.

    Returns:
        {
            "recommended_order_quantity": int,
            "recommended_order_date": "YYYY-MM-DD",
            "stockout_probability": float,
            "confidence": float,
            "reason": str
        }
    """
    if not os.path.exists(demand_forecast.MODEL_PATH):
        raise FileNotFoundError(
            "No trained demand model found. Run `python ../demand_forecasting/forecast.py --train` first."
        )

    bundle = joblib.load(demand_forecast.MODEL_PATH)
    model, encoder = bundle["model"], bundle["encoder"]

    sales_df = demand_forecast.load_sales_features()
    products_df = demand_forecast.load_products()

    history = sales_df[sales_df["product_id"] == product_id].sort_values("date")
    if history.empty:
        raise ValueError(f"product_id {product_id} not found in sales_features.csv")

    current_stock = float(history["stock"].iloc[-1])
    recent_daily_std = float(history["sales"].tail(30).std() or 0.0)

    daily_predictions = demand_forecast._recursive_forecast(
        product_id, lead_time_days, model, encoder, sales_df, products_df
    )
    daily_means = [p["predicted_sales"] for p in daily_predictions]
    lead_time_demand_mean = float(sum(daily_means))

    # Aggregate variance over the window: assumes day-to-day demand shocks
    # are roughly independent — a standard simplification for a prototype.
    lead_time_demand_std = max(1e-6, recent_daily_std * np.sqrt(lead_time_days))

    stockout_probability = float(np.clip(
        1 - norm.cdf(current_stock, loc=lead_time_demand_mean, scale=lead_time_demand_std),
        0, 1,
    ))

    z = norm.ppf(service_level)
    target_stock_level = lead_time_demand_mean + z * lead_time_demand_std
    recommended_order_quantity = int(max(0, round(target_stock_level - current_stock)))

    avg_daily_demand = lead_time_demand_mean / lead_time_days if lead_time_days > 0 else 0.0
    days_until_stockout = current_stock / avg_daily_demand if avg_daily_demand > 0 else float("inf")
    days_until_order = max(0, round(days_until_stockout - lead_time_days))
    days_until_order = min(days_until_order, 365)  # cap for sanity in output
    recommended_order_date = (date.today() + timedelta(days=int(days_until_order))).isoformat()

    festivals_in_window = _upcoming_festivals_within(lead_time_days, date.today())

    reason_parts = [
        f"Forecasted {lead_time_demand_mean:.0f} units demand over the {lead_time_days}-day lead time "
        f"vs {current_stock:.0f} units currently in stock"
    ]
    if festivals_in_window:
        names = ", ".join(f"{n} ({d.isoformat()})" for n, d, _ in festivals_in_window)
        reason_parts.append(f"Lead-time window includes upcoming festival(s): {names} — forecast already reflects uplift")
    if stockout_probability > 0.5:
        reason_parts.append("High stockout risk without reorder")
    if recent_daily_std / (history["sales"].tail(30).mean() + 1e-6) > 0.6:
        reason_parts.append("Demand is volatile; safety buffer increased accordingly")

    days_of_history = len(history)
    confidence = float(np.clip(0.5 + min(days_of_history, 180) / 180 * 0.35, 0, 0.85))

    return {
        "product_id": product_id,
        "lead_time_days": lead_time_days,
        "service_level": service_level,
        "current_stock": int(current_stock),
        "forecasted_lead_time_demand": round(lead_time_demand_mean, 1),
        "recommended_order_quantity": recommended_order_quantity,
        "recommended_order_date": recommended_order_date,
        "stockout_probability": round(stockout_probability, 3),
        "confidence": round(confidence, 3),
        "reason": "; ".join(reason_parts),
    }


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA smart restocking.")
    parser.add_argument("--predict", type=str, metavar="PRODUCT_ID", required=True)
    parser.add_argument("--lead-time", type=int, default=DEFAULT_LEAD_TIME_DAYS)
    parser.add_argument("--service-level", type=float, default=DEFAULT_SERVICE_LEVEL)
    args = parser.parse_args()

    result = recommend_restock(args.predict, args.lead_time, args.service_level)
    print(result)


if __name__ == "__main__":
    main()