"""
MERCHANTRA - Business Forecasting / Dashboard Analytics (Phase 14)

Status: IMPLEMENTED. This module feeds the C++ backend's POST
/ai/business-forecast endpoint, which in turn feeds the React Dashboard
(Total products, Inventory, Orders, Revenue, Returns, Verification
failures, Low stock, Advertising ROI + trend charts + top products +
stockout risk, per the project's Dashboard spec).

This is intentionally a lighter-weight AGGREGATION layer, not a new ML
model:
  - Trends (sales/revenue/inventory/returns) are read directly from the
    generated data (SIMULATED — this is the whole portfolio's history).
  - The 30-day portfolio-level forecast uses simple linear trend
    extrapolation (numpy polyfit) over total daily sales/revenue — this
    is a fast, explainable, GLOBAL number for a dashboard tile. It is NOT
    the same as the per-product ML forecast in demand_forecasting/
    forecast.py, which is more accurate but too slow to run for every
    product just to render a dashboard summary. Both are labeled clearly
    below and should never be presented as the same number.
  - Marketplace/advertising performance and top products/stockout risk
    reuse the same field definitions as roi.py / restock.py so the
    dashboard and the per-product detail pages agree with each other.

Usage:
    python ../datasets/generate_dataset.py --num-products 500 --days 730
    python ../datasets/feature_engineering.py
    python business_forecast.py

Dependencies:
    pip install pandas numpy
"""

import argparse
import json
import os

import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")

LOW_STOCK_THRESHOLD = 30           # units
MIN_AD_SPEND_FOR_ROI = 100.0        # same floor as roi.py, kept in sync
TREND_WINDOW_DAYS = 90              # how much history feeds the trend chart + forecast
FORECAST_HORIZON_DAYS = 30          # simple linear extrapolation horizon


def load_all():
    sales = pd.read_csv(os.path.join(DATA_DIR, "sales_daily.csv"), parse_dates=["date"])
    products = pd.read_csv(os.path.join(DATA_DIR, "products_master.csv"))
    verification = pd.read_csv(os.path.join(DATA_DIR, "verification_events.csv"), parse_dates=["timestamp"])
    product_features = pd.read_csv(os.path.join(DATA_DIR, "product_features.csv"))
    return sales, products, verification, product_features


def _linear_trend_forecast(daily_totals: pd.Series, horizon_days: int) -> dict:
    """Simple, explainable trend line — NOT the per-product ML model.
    Fits y = a*x + b over the trailing window and extrapolates forward."""
    y = daily_totals.values
    x = np.arange(len(y))
    if len(y) < 5:
        return {"slope_per_day": 0.0, "forecast_total": float(y.sum() if len(y) else 0)}

    slope, intercept = np.polyfit(x, y, 1)
    future_x = np.arange(len(y), len(y) + horizon_days)
    future_y = np.clip(slope * future_x + intercept, 0, None)

    return {
        "slope_per_day": round(float(slope), 3),
        "trend_direction": "up" if slope > 0.5 else ("down" if slope < -0.5 else "flat"),
        "forecast_total": round(float(future_y.sum()), 1),
    }


def build_kpis(sales: pd.DataFrame, products: pd.DataFrame, verification: pd.DataFrame,
               product_features: pd.DataFrame) -> dict:
    latest_stock = sales.sort_values("date").groupby("product_id")["stock"].last()

    total_ad_spend = float(sales["advertising_spend"].sum())
    total_revenue = float(sales["revenue"].sum())

    eligible = product_features[product_features["total_ad_spend"] >= MIN_AD_SPEND_FOR_ROI].copy()
    eligible["actual_roi"] = (
        (eligible["total_revenue"] * eligible["margin_pct"] - eligible["total_ad_spend"])
        / eligible["total_ad_spend"]
    )
    avg_advertising_roi = float(eligible["actual_roi"].mean()) if not eligible.empty else None

    return {
        "total_products": int(products["product_id"].nunique()),
        "total_orders": int(sales["orders"].sum()),
        "total_revenue": round(total_revenue, 2),
        "total_returns": int(sales["returns"].sum()),
        "overall_return_rate": round(float(sales["returns"].sum() / max(sales["sales"].sum(), 1)), 4),
        "verification_fail_count": int((verification["decision"] == "FAIL").sum()),
        "verification_review_count": int((verification["decision"] == "REVIEW").sum()),
        "low_stock_product_count": int((latest_stock < LOW_STOCK_THRESHOLD).sum()),
        "total_advertising_spend": round(total_ad_spend, 2),
        "avg_actual_advertising_roi": round(avg_advertising_roi, 3) if avg_advertising_roi is not None else None,
    }


def build_trends(sales: pd.DataFrame) -> dict:
    recent = sales[sales["date"] >= sales["date"].max() - pd.Timedelta(days=TREND_WINDOW_DAYS)]

    daily_sales = recent.groupby("date")["sales"].sum()
    daily_revenue = recent.groupby("date")["revenue"].sum()
    daily_returns = recent.groupby("date")["returns"].sum()
    daily_stock = recent.groupby("date")["stock"].sum()

    return {
        "window_days": TREND_WINDOW_DAYS,
        "sales_trend": {
            "series": [{"date": d.date().isoformat(), "value": int(v)} for d, v in daily_sales.items()],
            "forecast_next_30_days": _linear_trend_forecast(daily_sales, FORECAST_HORIZON_DAYS),
        },
        "revenue_trend": {
            "series": [{"date": d.date().isoformat(), "value": round(float(v), 2)} for d, v in daily_revenue.items()],
            "forecast_next_30_days": _linear_trend_forecast(daily_revenue, FORECAST_HORIZON_DAYS),
        },
        "returns_trend": {
            "series": [{"date": d.date().isoformat(), "value": int(v)} for d, v in daily_returns.items()],
        },
        "inventory_trend": {
            "series": [{"date": d.date().isoformat(), "value": int(v)} for d, v in daily_stock.items()],
        },
        "note": "forecast_next_30_days uses simple linear trend extrapolation for a fast dashboard "
                "summary — NOT the same as the per-product ML forecast in demand_forecasting/forecast.py",
    }


def build_marketplace_performance(sales: pd.DataFrame, products: pd.DataFrame) -> list:
    merged = sales.merge(products[["product_id", "marketplace"]], on="product_id")
    grouped = merged.groupby("marketplace").agg(
        total_revenue=("revenue", "sum"),
        total_orders=("orders", "sum"),
        total_sales=("sales", "sum"),
        total_returns=("returns", "sum"),
        total_ad_spend=("advertising_spend", "sum"),
    ).reset_index()

    grouped["return_rate"] = np.where(grouped["total_sales"] > 0,
                                       grouped["total_returns"] / grouped["total_sales"], 0.0)
    grouped["roas"] = np.where(grouped["total_ad_spend"] > 0,
                                grouped["total_revenue"] / grouped["total_ad_spend"], 0.0)

    grouped = grouped.sort_values("total_revenue", ascending=False)
    grouped[["total_revenue", "total_ad_spend"]] = grouped[["total_revenue", "total_ad_spend"]].round(2)
    grouped[["return_rate", "roas"]] = grouped[["return_rate", "roas"]].round(3)
    return grouped.to_dict(orient="records")


def build_top_products(product_features: pd.DataFrame, top: int = 10) -> list:
    cols = ["product_id", "category", "marketplace", "total_revenue", "total_sales", "return_rate"]
    ranked = product_features.sort_values("total_revenue", ascending=False).head(top)
    return ranked[cols].round(3).to_dict(orient="records")


def build_stockout_risk(sales: pd.DataFrame, lead_time_days: int = 14, top: int = 10) -> list:
    """Quick heuristic (NOT the full statistical model in restocking/restock.py):
    flags products whose current stock covers less than `lead_time_days` of
    their own recent average daily sales. Good enough for a dashboard
    warning list; use restock.py for the real per-product recommendation."""
    latest = sales.sort_values("date").groupby("product_id").tail(30)
    summary = latest.groupby("product_id").agg(
        current_stock=("stock", "last"),
        avg_daily_sales=("sales", "mean"),
    ).reset_index()

    summary["days_of_cover"] = np.where(
        summary["avg_daily_sales"] > 0,
        summary["current_stock"] / summary["avg_daily_sales"],
        np.inf,
    )
    at_risk = summary[summary["days_of_cover"] < lead_time_days].sort_values("days_of_cover")
    at_risk["days_of_cover"] = at_risk["days_of_cover"].round(1)
    return at_risk.head(top).to_dict(orient="records")


def build_dashboard_summary() -> dict:
    sales, products, verification, product_features = load_all()

    return {
        "kpis": build_kpis(sales, products, verification, product_features),
        "trends": build_trends(sales),
        "marketplace_performance": build_marketplace_performance(sales, products),
        "top_products": build_top_products(product_features),
        "stockout_risk_watchlist": build_stockout_risk(sales),
    }


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA business forecasting / dashboard analytics.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output.")
    args = parser.parse_args()

    summary = build_dashboard_summary()
    if args.pretty:
        print(json.dumps(summary, indent=2, default=str))
    else:
        print(json.dumps(summary, default=str))


if __name__ == "__main__":
    main()