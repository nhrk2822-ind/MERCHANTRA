"""
MERCHANTRA - Anomaly Detection (Phase 8)

Status: IMPLEMENTED (classical ML prototype). Flags unusual operational
patterns for human review — sudden return spikes, abnormal stock movement,
inventory mismatches, and unusual sales patterns.

Model: IsolationForest (scikit-learn) trained on per-product-day
operational features from sales_features.csv. Unsupervised — no labeled
"this was anomalous" data is needed or assumed to exist.

Usage:
    python ../datasets/generate_dataset.py --num-products 500 --days 365
    python ../datasets/feature_engineering.py
    python anomaly.py --train
    python anomaly.py --scan --top 20
    python anomaly.py --detect MCH-P-000001

Dependencies:
    pip install scikit-learn pandas numpy joblib
"""

import argparse
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "anomaly_model.joblib")

# Operational signals used to spot unusual days. All numeric, all already
# present in sales_features.csv (Phase 5 output) — no extra joins needed.
FEATURE_COLUMNS = [
    "sales",
    "orders",
    "returns",
    "stock",
    "advertising_spend",
    "discount",
    "sales_deviation",          # from feature_engineering: z-score vs 7-day trend
    "returns_rolling_sum_7",
    "sales_rolling_mean_7",
]

SEVERITY_THRESHOLDS = {"low": 0.15, "medium": 0.35}  # normalized anomaly_score cutoffs


def load_sales_features():
    path = os.path.join(DATA_DIR, "sales_features.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"{path} not found. Run generate_dataset.py then feature_engineering.py first."
        )
    return pd.read_csv(path, parse_dates=["date"])


def train(contamination: float = 0.05, save: bool = True):
    df = load_sales_features()
    X = df[FEATURE_COLUMNS].fillna(0.0)

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    raw_scores = model.decision_function(X)  # higher = more normal
    # Normalize to 0-1 anomaly_score where higher = more anomalous
    anomaly_scores = 1 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min())

    flagged_pct = float((model.predict(X) == -1).mean() * 100)
    print(f"[SIMULATED] Trained IsolationForest on {len(X)} product-day rows")
    print(f"[SIMULATED] {flagged_pct:.1f}% of rows flagged as anomalous "
          f"(contamination={contamination})")

    if save:
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump({
            "model": model,
            "feature_columns": FEATURE_COLUMNS,
            "score_min": float(raw_scores.min()),
            "score_max": float(raw_scores.max()),
            "feature_means": X.mean(),
            "feature_stds": X.std().replace(0, 1),
        }, MODEL_PATH)
        print(f"[SIMULATED] Model saved -> {MODEL_PATH}")

    return model


def _severity_for(score: float) -> str:
    if score < SEVERITY_THRESHOLDS["low"]:
        return "LOW"
    if score < SEVERITY_THRESHOLDS["medium"]:
        return "MEDIUM"
    return "HIGH"


def _explain_row(row: pd.Series, feature_means: pd.Series, feature_stds: pd.Series) -> list:
    """Explain an anomaly by naming the features furthest (in std-devs)
    from their dataset-wide average for this row."""
    z_scores = {}
    for col in FEATURE_COLUMNS:
        z_scores[col] = abs((row[col] - feature_means[col]) / feature_stds[col])

    top_features = sorted(z_scores.items(), key=lambda kv: kv[1], reverse=True)[:2]

    labels = {
        "sales": "unit sales far from normal",
        "orders": "order volume far from normal",
        "returns": "return volume far from normal",
        "stock": "stock level far from normal",
        "advertising_spend": "advertising spend far from normal",
        "discount": "discount level far from normal",
        "sales_deviation": "sales sharply deviating from recent 7-day trend",
        "returns_rolling_sum_7": "elevated returns over the trailing 7 days",
        "sales_rolling_mean_7": "unusual recent sales trend",
    }

    reasons = [labels.get(col, col) for col, z in top_features if z > 1.5]
    if not reasons:
        reasons = ["Multiple minor deviations combined; no single dominant factor"]
    return reasons


def _score_dataframe(df: pd.DataFrame, bundle: dict) -> pd.DataFrame:
    model = bundle["model"]
    X = df[FEATURE_COLUMNS].fillna(0.0)

    raw_scores = model.decision_function(X)
    score_min, score_max = bundle["score_min"], bundle["score_max"]
    denom = (score_max - score_min) if score_max != score_min else 1.0
    anomaly_scores = np.clip(1 - (raw_scores - score_min) / denom, 0, 1)

    result = df.copy()
    result["anomaly_score"] = anomaly_scores.round(3)
    result["severity"] = [_severity_for(s) for s in anomaly_scores]
    result["reason"] = [
        _explain_row(row, bundle["feature_means"], bundle["feature_stds"])
        for _, row in df.iterrows()
    ]
    return result


def detect_for_product(product_id: str, recent_days: int = 30) -> list:
    """
    Public entrypoint matching the AI API contract for POST /ai/anomaly.

    Returns a list of:
        {
            "date": "...",
            "anomaly_score": float,
            "severity": "LOW" | "MEDIUM" | "HIGH",
            "reason": [str, ...]
        }
    for the most recent `recent_days` of data for this product.
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("No trained model found. Run `python anomaly.py --train` first.")

    bundle = joblib.load(MODEL_PATH)
    df = load_sales_features()
    product_df = df[df["product_id"] == product_id].sort_values("date").tail(recent_days)

    if product_df.empty:
        raise ValueError(f"product_id {product_id} not found in sales_features.csv")

    scored = _score_dataframe(product_df, bundle)
    return [
        {
            "date": row["date"].date().isoformat(),
            "anomaly_score": row["anomaly_score"],
            "severity": row["severity"],
            "reason": row["reason"],
        }
        for _, row in scored.iterrows()
    ]


def scan_top_anomalies(top: int = 20) -> pd.DataFrame:
    """Scan the whole dataset and return the top-N most anomalous
    product-days, for an ops dashboard / daily review queue."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("No trained model found. Run `python anomaly.py --train` first.")

    bundle = joblib.load(MODEL_PATH)
    df = load_sales_features()
    scored = _score_dataframe(df, bundle)
    top_rows = scored.sort_values("anomaly_score", ascending=False).head(top)
    return top_rows[["product_id", "date", "sales", "returns", "stock", "anomaly_score", "severity", "reason"]]


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA anomaly detection.")
    parser.add_argument("--train", action="store_true", help="Train and save the model.")
    parser.add_argument("--detect", type=str, metavar="PRODUCT_ID", help="Detect anomalies for a product.")
    parser.add_argument("--scan", action="store_true", help="Scan whole dataset for top anomalies.")
    parser.add_argument("--top", type=int, default=20, help="Number of top anomalies to show with --scan.")
    args = parser.parse_args()

    if args.train:
        train()
    elif args.detect:
        for entry in detect_for_product(args.detect):
            print(entry)
    elif args.scan:
        print(scan_top_anomalies(args.top).to_string(index=False))
    else:
        print("Nothing to do. Use --train, --detect PRODUCT_ID, or --scan.")


if __name__ == "__main__":
    main()

    