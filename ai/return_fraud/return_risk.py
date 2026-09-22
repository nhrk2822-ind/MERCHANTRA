"""
MERCHANTRA - Return Risk Model (Phase 7)

Status: IMPLEMENTED (classical ML prototype). This is a RISK INDICATOR
to help humans prioritize review — never an automated fraud accusation.

Approach:
  No real "this return was fraudulent" labels exist. Instead, we train a
  regression model to predict a product's historical return_rate from
  its other features (price, category, verification history, ad spend,
  etc.), then convert the prediction into a risk_score/risk_level. This
  surfaces WHICH products are structurally likely to see high returns,
  using signals available before most of the returns have even happened
  (e.g. for a newly listed product in the same category/price tier).

Model: RandomForestRegressor (scikit-learn). XGBoost is used instead if
available in the environment (see USE_XGBOOST below) — same interface.

Usage:
    python ../datasets/generate_dataset.py --num-products 500 --days 365
    python ../datasets/feature_engineering.py
    python return_risk.py --train
    python return_risk.py --predict MCH-P-000001

Dependencies:
    pip install scikit-learn pandas numpy joblib
    pip install xgboost   # optional, used automatically if present
"""

import argparse
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder

try:
    from xgboost import XGBRegressor
    USE_XGBOOST = True
except ImportError:
    USE_XGBOOST = False

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "return_risk_model.joblib")

FEATURE_COLUMNS_NUMERIC = [
    "price", "cost", "margin_pct", "rating", "days_since_launch",
    "verification_fail_rate", "avg_damage_probability", "avg_anomaly_score",
    "ad_spend_per_sale", "sales_volatility", "avg_discount", "total_orders",
]
FEATURE_COLUMNS_CATEGORICAL = ["category", "marketplace", "price_tier", "top_return_reason"]
TARGET_COLUMN = "return_rate"

RISK_THRESHOLDS = {"low": 0.08, "medium": 0.18}  # return_rate cutoffs -> risk_level


def load_features():
    path = os.path.join(DATA_DIR, "product_features.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"{path} not found. Run generate_dataset.py then feature_engineering.py first."
        )
    return pd.read_csv(path)


def build_design_matrix(df: pd.DataFrame, encoder: OneHotEncoder = None, fit: bool = False):
    numeric = df[FEATURE_COLUMNS_NUMERIC].fillna(0.0)
    categorical_raw = df[FEATURE_COLUMNS_CATEGORICAL].fillna("unknown").astype(str)

    if fit:
        encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        categorical_encoded = encoder.fit_transform(categorical_raw)
    else:
        categorical_encoded = encoder.transform(categorical_raw)

    cat_columns = encoder.get_feature_names_out(FEATURE_COLUMNS_CATEGORICAL)
    categorical_df = pd.DataFrame(categorical_encoded, columns=cat_columns, index=df.index)

    X = pd.concat([numeric.reset_index(drop=True), categorical_df.reset_index(drop=True)], axis=1)
    return X, encoder


def risk_level_for(return_rate_pred: float) -> str:
    if return_rate_pred < RISK_THRESHOLDS["low"]:
        return "LOW"
    if return_rate_pred < RISK_THRESHOLDS["medium"]:
        return "MEDIUM"
    return "HIGH"


def explain_reasons(row: pd.Series, dataset_means: pd.Series) -> list:
    """Simple, transparent explanation: which numeric features are notably
    above the dataset average for this product (drives risk up)."""
    reasons = []

    if row["verification_fail_rate"] > dataset_means["verification_fail_rate"] * 1.5:
        reasons.append("Higher-than-average Smart Station verification fail/review rate")
    if row["avg_damage_probability"] > dataset_means["avg_damage_probability"] * 1.5:
        reasons.append("Elevated average damage probability at packing verification")
    if row["sales_volatility"] > dataset_means["sales_volatility"] * 1.5:
        reasons.append("Unusually volatile daily sales pattern")
    if row.get("top_return_reason") in ("size_issue", "wrong_item"):
        reasons.append(f"Most common return reason historically: {row.get('top_return_reason')}")
    if row["price"] > dataset_means["price"] * 2:
        reasons.append("Premium price point (higher-value items tend to see closer scrutiny on return)")

    if not reasons:
        reasons.append("No individual risk factor stands out; risk driven by category/price-tier baseline")

    return reasons


def train(save: bool = True):
    df = load_features()

    X, encoder = build_design_matrix(df, fit=True)
    y = df[TARGET_COLUMN].values

    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, df.index, test_size=0.2, random_state=42
    )

    if USE_XGBOOST:
        model = XGBRegressor(n_estimators=200, max_depth=4, learning_rate=0.08, random_state=42)
        model_name = "XGBRegressor"
    else:
        model = RandomForestRegressor(n_estimators=300, max_depth=8, random_state=42, n_jobs=-1)
        model_name = "RandomForestRegressor"

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print(f"[SIMULATED] Trained {model_name} on {len(X_train)} products, tested on {len(X_test)}")
    print(f"[SIMULATED] Test MAE: {mae:.4f} | Test R^2: {r2:.4f}")
    print("Note: predicting historical return_rate from product features — this is a risk")
    print("INDICATOR for prioritizing review, not a fraud-detection or accusation system.")

    if save:
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump({
            "model": model,
            "encoder": encoder,
            "feature_columns_numeric": FEATURE_COLUMNS_NUMERIC,
            "feature_columns_categorical": FEATURE_COLUMNS_CATEGORICAL,
            "dataset_means": df[FEATURE_COLUMNS_NUMERIC].mean(),
            "model_name": model_name,
        }, MODEL_PATH)
        print(f"[SIMULATED] Model saved -> {MODEL_PATH}")

    return model, encoder


def predict_return_risk(product_id: str) -> dict:
    """
    Public entrypoint matching the AI API contract for POST /ai/return-risk.

    Returns:
        {
            "risk_score": float,
            "risk_level": "LOW" | "MEDIUM" | "HIGH",
            "confidence": float,
            "reasons": [str, ...]
        }
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("No trained model found. Run `python return_risk.py --train` first.")

    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]
    encoder = bundle["encoder"]
    dataset_means = bundle["dataset_means"]

    df = load_features()
    row = df[df["product_id"] == product_id]
    if row.empty:
        raise ValueError(f"product_id {product_id} not found in product_features.csv")

    X, _ = build_design_matrix(row, encoder=encoder, fit=False)
    predicted_return_rate = float(np.clip(model.predict(X)[0], 0, 1))

    risk_level = risk_level_for(predicted_return_rate)
    reasons = explain_reasons(row.iloc[0], dataset_means)

    # confidence: lower for products with very little sales history
    days_with_data = row.iloc[0].get("days_with_data", 0)
    confidence = float(np.clip(0.6 + min(days_with_data, 180) / 180 * 0.35, 0, 0.95))

    return {
        "product_id": product_id,
        "risk_score": round(predicted_return_rate, 3),
        "risk_level": risk_level,
        "confidence": round(confidence, 3),
        "reasons": reasons,
    }


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA return-risk model.")
    parser.add_argument("--train", action="store_true", help="Train and save the model.")
    parser.add_argument("--predict", type=str, metavar="PRODUCT_ID", help="Predict risk for a product_id.")
    args = parser.parse_args()

    if args.train:
        train()
    elif args.predict:
        result = predict_return_risk(args.predict)
        print(result)
    else:
        print("Nothing to do. Use --train or --predict PRODUCT_ID.")


if __name__ == "__main__":
    main()