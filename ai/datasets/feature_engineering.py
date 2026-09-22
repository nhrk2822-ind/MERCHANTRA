"""
MERCHANTRA - Feature Engineering (Phase 5)

Status: SIMULATED — builds model-ready feature tables from the raw
synthetic datasets. Output feeds return_fraud/, demand_forecasting/,
festival_forecasting/, and anomaly_detection/ modules.

Usage:
    python generate_dataset.py --num-products 500 --days 365
    python feature_engineering.py

Dependencies:
    pip install pandas numpy
"""

import argparse
import os

import numpy as np
import pandas as pd


def load_raw(data_dir: str):
    products = pd.read_csv(os.path.join(data_dir, "products_master.csv"))
    sales = pd.read_csv(os.path.join(data_dir, "sales_daily.csv"), parse_dates=["date"])
    verification = pd.read_csv(os.path.join(data_dir, "verification_events.csv"), parse_dates=["timestamp"])
    return products, sales, verification


# ------------------------------------------------------------------
# PRODUCT-LEVEL FEATURES
# One row per product_id. Used by: return_fraud/, advertising/, roi/
# ------------------------------------------------------------------
def build_product_features(products: pd.DataFrame, sales: pd.DataFrame,
                            verification: pd.DataFrame) -> pd.DataFrame:
    agg = sales.groupby("product_id").agg(
        total_orders=("orders", "sum"),
        total_sales=("sales", "sum"),
        total_returns=("returns", "sum"),
        total_revenue=("revenue", "sum"),
        total_ad_spend=("advertising_spend", "sum"),
        avg_daily_sales=("sales", "mean"),
        sales_std=("sales", "std"),
        avg_discount=("discount", "mean"),
        days_with_data=("date", "count"),
    ).reset_index()

    agg["return_rate"] = np.where(agg["total_sales"] > 0, agg["total_returns"] / agg["total_sales"], 0.0)
    agg["ad_spend_per_sale"] = np.where(agg["total_sales"] > 0, agg["total_ad_spend"] / agg["total_sales"], 0.0)
    agg["sales_volatility"] = np.where(agg["avg_daily_sales"] > 0,
                                        agg["sales_std"].fillna(0) / agg["avg_daily_sales"], 0.0)

    # most common return reason per product
    reason_counts = (
        sales[sales["return_reason"].notna()]
        .groupby(["product_id", "return_reason"])
        .size()
        .reset_index(name="count")
    )
    top_reason = (
        reason_counts.sort_values("count", ascending=False)
        .drop_duplicates("product_id")[["product_id", "return_reason"]]
        .rename(columns={"return_reason": "top_return_reason"})
    )

    # verification history per product
    verif_agg = verification.groupby("product_id").agg(
        verification_events=("event_id", "count"),
        fail_count=("decision", lambda s: (s == "FAIL").sum()),
        review_count=("decision", lambda s: (s == "REVIEW").sum()),
        avg_damage_probability=("damage_probability", "mean"),
        avg_anomaly_score=("anomaly_score", "mean"),
    ).reset_index()
    verif_agg["verification_fail_rate"] = np.where(
        verif_agg["verification_events"] > 0,
        (verif_agg["fail_count"] + verif_agg["review_count"]) / verif_agg["verification_events"],
        0.0,
    )

    features = products.merge(agg, on="product_id", how="left")
    features = features.merge(top_reason, on="product_id", how="left")
    features = features.merge(
        verif_agg[["product_id", "verification_fail_rate", "avg_damage_probability", "avg_anomaly_score"]],
        on="product_id", how="left",
    )

    features["launch_date"] = pd.to_datetime(features["launch_date"])
    features["days_since_launch"] = (pd.Timestamp.today() - features["launch_date"]).dt.days
    features["margin_pct"] = np.where(features["price"] > 0,
                                       (features["price"] - features["cost"]) / features["price"], 0.0)

    price_bins = [0, 500, 2000, 10000, np.inf]
    price_labels = ["budget", "mid", "premium", "luxury"]
    features["price_tier"] = pd.cut(features["price"], bins=price_bins, labels=price_labels)

    numeric_fill_cols = [
        "total_orders", "total_sales", "total_returns", "total_revenue", "total_ad_spend",
        "avg_daily_sales", "sales_std", "avg_discount", "days_with_data", "return_rate",
        "ad_spend_per_sale", "sales_volatility", "verification_fail_rate",
        "avg_damage_probability", "avg_anomaly_score",
    ]
    features[numeric_fill_cols] = features[numeric_fill_cols].fillna(0.0)
    features["top_return_reason"] = features["top_return_reason"].fillna("none")

    return features


# ------------------------------------------------------------------
# TIME-SERIES FEATURES (per product per day)
# Used by: demand_forecasting/, festival_forecasting/, anomaly_detection/
# ------------------------------------------------------------------
def build_timeseries_features(sales: pd.DataFrame) -> pd.DataFrame:
    df = sales.sort_values(["product_id", "date"]).copy()

    df["day_of_week"] = df["date"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["is_festival"] = df["festival"].notna().astype(int)
    df["month"] = df["date"].dt.month

    grp = df.groupby("product_id")["sales"]
    df["sales_lag_1"] = grp.shift(1)
    df["sales_lag_7"] = grp.shift(7)
    df["sales_rolling_mean_7"] = grp.transform(lambda s: s.shift(1).rolling(7, min_periods=1).mean())
    df["sales_rolling_mean_30"] = grp.transform(lambda s: s.shift(1).rolling(30, min_periods=1).mean())
    df["sales_rolling_std_7"] = grp.transform(lambda s: s.shift(1).rolling(7, min_periods=1).std())

    returns_grp = df.groupby("product_id")["returns"]
    df["returns_rolling_sum_7"] = returns_grp.transform(lambda s: s.shift(1).rolling(7, min_periods=1).sum())

    fill_cols = [
        "sales_lag_1", "sales_lag_7", "sales_rolling_mean_7",
        "sales_rolling_mean_30", "sales_rolling_std_7", "returns_rolling_sum_7",
    ]
    df[fill_cols] = df[fill_cols].fillna(0.0)

    # simple anomaly flag: today's sales far from the trailing 7-day mean (z-score style)
    df["sales_deviation"] = np.where(
        df["sales_rolling_std_7"] > 0,
        (df["sales"] - df["sales_rolling_mean_7"]) / df["sales_rolling_std_7"],
        0.0,
    )

    return df


def main():
    parser = argparse.ArgumentParser(description="Build feature tables for MERCHANTRA models.")
    parser.add_argument("--data-dir", type=str, default=os.path.dirname(os.path.abspath(__file__)))
    args = parser.parse_args()

    products, sales, verification = load_raw(args.data_dir)

    print("[SIMULATED] Building product-level features...")
    product_features = build_product_features(products, sales, verification)
    product_out = os.path.join(args.data_dir, "product_features.csv")
    product_features.to_csv(product_out, index=False)
    print(f"[SIMULATED] Wrote {len(product_features)} rows x {len(product_features.columns)} cols -> {product_out}")

    print("[SIMULATED] Building time-series features...")
    ts_features = build_timeseries_features(sales)
    ts_out = os.path.join(args.data_dir, "sales_features.csv")
    ts_features.to_csv(ts_out, index=False)
    print(f"[SIMULATED] Wrote {len(ts_features)} rows x {len(ts_features.columns)} cols -> {ts_out}")

    print("\nSample product_features columns:")
    print(list(product_features.columns))
    print("\nSample sales_features columns:")
    print(list(ts_features.columns))


if __name__ == "__main__":
    main()