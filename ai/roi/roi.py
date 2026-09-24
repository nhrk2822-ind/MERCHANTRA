"""
MERCHANTRA - ROI (Phase 13)

Status: IMPLEMENTED (classical, formula-based + model-based prototype).

VERY IMPORTANT (per project rules): actual ROI and predicted ROI are
computed by DIFFERENT methods, for DIFFERENT purposes, and are NEVER
merged into a single number. The frontend must label them separately.

  actual_roi    -> backward-looking, from historical totals in
                   product_features.csv (Phase 5). Answers: "given all the
                   ad spend and sales this product has actually had, was
                   it worth it?" This is a BLENDED estimate — it credits
                   ad spend against total profit, not just the sales that
                   were provably caused by ads (true incrementality would
                   need holdout/geo experiments this prototype doesn't
                   have). Clearly labeled as such below.

  predicted_roi -> forward-looking, reuses the marginal-ROI estimate from
                   ai/advertising/advertising.py, which DOES attempt to
                   isolate the ad-driven effect (the model controls for
                   organic 7-day sales baseline). Answers: "if we spend
                   more on ads starting now, what return should we expect
                   on the NEXT rupee spent?"

Usage:
    python ../advertising/advertising.py --train   # needed for predicted_roi
    python roi.py --predict MCH-P-000001
    python roi.py --scan --top 10

Dependencies:
    pip install pandas numpy
"""

import argparse
import os
import sys

import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")

# Reuse Phase 12's model instead of duplicating it.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "advertising"))
import advertising  # noqa: E402

MIN_AD_SPEND_FOR_ACTUAL_ROI = 100.0  # below this, historical ROI is too noisy to report


def load_product_features():
    path = os.path.join(DATA_DIR, "product_features.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"{path} not found. Run generate_dataset.py + feature_engineering.py first.")
    return pd.read_csv(path)


def compute_actual_roi(product_id: str) -> dict:
    """
    Backward-looking, formula-based. NOT a model prediction.

        actual_profit = total_revenue * margin_pct - total_ad_spend
        actual_roi    = actual_profit / total_ad_spend
    """
    df = load_product_features()
    row = df[df["product_id"] == product_id]
    if row.empty:
        raise ValueError(f"product_id {product_id} not found in product_features.csv")
    row = row.iloc[0]

    total_revenue = float(row["total_revenue"])
    total_ad_spend = float(row["total_ad_spend"])
    margin_pct = float(row["margin_pct"])

    if total_ad_spend < MIN_AD_SPEND_FOR_ACTUAL_ROI:
        return {
            "type": "actual",
            "basis": "historical_totals",
            "actual_roi": None,
            "total_revenue": round(total_revenue, 2),
            "total_ad_spend": round(total_ad_spend, 2),
            "note": f"Ad spend history (INR {total_ad_spend:.0f}) too low to report a stable actual ROI "
                    f"(minimum INR {MIN_AD_SPEND_FOR_ACTUAL_ROI:.0f})",
        }

    actual_profit = total_revenue * margin_pct - total_ad_spend
    actual_roi = actual_profit / total_ad_spend

    return {
        "type": "actual",
        "basis": "historical_totals (blended — not a true incrementality measurement)",
        "actual_roi": round(actual_roi, 3),
        "total_revenue": round(total_revenue, 2),
        "total_ad_spend": round(total_ad_spend, 2),
        "margin_pct": round(margin_pct, 3),
    }


def compute_predicted_roi(product_id: str) -> dict:
    """
    Forward-looking, model-based. Reuses ai/advertising/advertising.py's
    marginal-ROI estimate, which controls for organic sales baseline.
    """
    try:
        ad_result = advertising.recommend_advertising(product_id)
    except FileNotFoundError as e:
        return {
            "type": "predicted",
            "basis": "advertising_model",
            "predicted_roi": None,
            "note": str(e),
        }

    return {
        "type": "predicted",
        "basis": "advertising_model (marginal ROI, controls for organic baseline)",
        "predicted_roi": ad_result["expected_roi"] if ad_result["advertise"] else 0.0,
        "recommended_budget": ad_result["recommended_budget"],
        "advertise_recommended": ad_result["advertise"],
        "reason": ad_result["reason"],
    }


def roi_report(product_id: str) -> dict:
    """
    Public entrypoint matching the AI API contract for POST /ai/roi.
    Returns actual and predicted ROI as SEPARATE, clearly labeled objects —
    never merged or averaged together.
    """
    return {
        "product_id": product_id,
        "actual_roi": compute_actual_roi(product_id),
        "predicted_roi": compute_predicted_roi(product_id),
    }


def scan_portfolio(top: int = 10) -> pd.DataFrame:
    """Rank products by ACTUAL historical ROI only (predicted_roi requires
    a per-product model call and is too slow to run for a full scan)."""
    df = load_product_features()
    df = df[df["total_ad_spend"] >= MIN_AD_SPEND_FOR_ACTUAL_ROI].copy()
    df["actual_profit"] = df["total_revenue"] * df["margin_pct"] - df["total_ad_spend"]
    df["actual_roi"] = df["actual_profit"] / df["total_ad_spend"]

    ranked = df.sort_values("actual_roi", ascending=False)
    cols = ["product_id", "category", "marketplace", "total_revenue", "total_ad_spend", "actual_roi"]
    return pd.concat([ranked[cols].head(top), ranked[cols].tail(top)])


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA ROI (actual vs predicted, kept separate).")
    parser.add_argument("--predict", type=str, metavar="PRODUCT_ID")
    parser.add_argument("--scan", action="store_true", help="Rank portfolio by actual historical ROI.")
    parser.add_argument("--top", type=int, default=10)
    args = parser.parse_args()

    if args.predict:
        result = roi_report(args.predict)
        print("ACTUAL ROI  :", result["actual_roi"])
        print("PREDICTED ROI:", result["predicted_roi"])
    elif args.scan:
        print(scan_portfolio(args.top).to_string(index=False))
    else:
        print("Nothing to do. Use --predict PRODUCT_ID or --scan.")


if __name__ == "__main__":
    main()