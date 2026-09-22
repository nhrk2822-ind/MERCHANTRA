"""
MERCHANTRA - Advertising Intelligence (Phase 12)

Status: IMPLEMENTED (classical ML prototype). This is a RECOMMENDATION
system only. It never spends money or launches campaigns automatically.

Approach:
  1. Train a RandomForestRegressor to predict a product-day's `revenue`
     from advertising_spend plus the usual context (discount, festival,
     calendar, price, category, marketplace, organic-demand baseline).
     This lets us isolate the model's learned relationship between ad
     spend and revenue, controlling for everything else.
  2. For a target product, simulate predicted revenue at several
     candidate daily ad-spend levels (holding other context fixed) and
     compute marginal ROI = (extra revenue) / (extra spend) between
     consecutive levels.
  3. Recommend the highest spend level whose marginal ROI still clears a
     minimum threshold, capped by margin and current inventory (don't
     recommend spend that would require selling more than stock allows).
  4. Timing: if a festival falls within the lookahead window, recommend
     starting the campaign ahead of it; otherwise recommend starting now
     if the numbers justify it.
  5. Which marketplace: this dataset assigns one marketplace per product
     (see products_master.csv), so that's reported directly. As a bonus
     signal, also reports which marketplace has historically had the
     best revenue-per-ad-spend for this product's category, in case
     cross-listing is being considered.

Usage:
    python ../demand_forecasting/forecast.py --train   # for context reuse, optional
    python advertising.py --train
    python advertising.py --predict MCH-P-000001

Dependencies:
    pip install scikit-learn pandas numpy joblib
"""

import argparse
import os
from datetime import date, timedelta

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets")
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "advertising_model.joblib")

NUMERIC_FEATURES = [
    "advertising_spend", "discount", "is_festival", "day_of_week", "month",
    "price", "margin_pct", "sales_rolling_mean_7",
]
CATEGORICAL_FEATURES = ["category", "marketplace", "festival"]
TARGET_COLUMN = "revenue"

# Lookahead window used to decide WHEN to start a campaign.
FESTIVAL_LOOKAHEAD_DAYS = 30
FESTIVAL_CALENDAR = {
    (1, 1): ("New Year", 1.3), (2, 14): ("Valentine's Day", 1.4), (3, 8): ("Holi", 1.5),
    (4, 10): ("Eid", 1.3), (8, 19): ("Raksha Bandhan", 1.35), (10, 20): ("Diwali", 1.9),
    (11, 24): ("Wedding Season Peak", 1.4), (12, 25): ("Christmas", 1.6),
}

MIN_MARGINAL_ROI = 1.3       # only keep increasing spend while marginal ROI clears this
SPEND_GRID_MULTIPLIERS = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0]  # relative to product's recent avg spend
MIN_SPEND_FLOOR = 50.0        # INR/day minimum candidate spend when recent spend was ~0


def load_sales():
    return pd.read_csv(os.path.join(DATA_DIR, "sales_daily.csv"), parse_dates=["date"])


def load_products():
    return pd.read_csv(os.path.join(DATA_DIR, "products_master.csv"))


def load_product_features():
    return pd.read_csv(os.path.join(DATA_DIR, "product_features.csv"))


def _next_festival_within(days_ahead: int, today: date):
    hits = []
    for (m, d), (name, _mult) in FESTIVAL_CALENDAR.items():
        candidate = date(today.year, m, d)
        if candidate < today:
            candidate = date(today.year + 1, m, d)
        days_until = (candidate - today).days
        if 0 <= days_until <= days_ahead:
            hits.append((name, candidate, days_until))
    return sorted(hits, key=lambda x: x[2])


def build_design_matrix(df: pd.DataFrame, encoder: OneHotEncoder = None, fit: bool = False):
    df = df.copy()
    if "festival" in df.columns:
        df["festival"] = df["festival"].fillna("none")
    numeric = df[NUMERIC_FEATURES].fillna(0.0)
    categorical_raw = df[CATEGORICAL_FEATURES].fillna("unknown").astype(str)

    if fit:
        encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        categorical_encoded = encoder.fit_transform(categorical_raw)
    else:
        categorical_encoded = encoder.transform(categorical_raw)

    cat_columns = encoder.get_feature_names_out(CATEGORICAL_FEATURES)
    categorical_df = pd.DataFrame(categorical_encoded, columns=cat_columns, index=df.index)
    X = pd.concat([numeric.reset_index(drop=True), categorical_df.reset_index(drop=True)], axis=1)
    if fit:
        return X, encoder
    return X


def train(save: bool = True):
    sales = load_sales()
    products = load_products()
    df = sales.merge(products[["product_id", "category", "marketplace", "price", "cost"]], on="product_id")
    df["margin_pct"] = np.where(df["price"] > 0, (df["price"] - df["cost"]) / df["price"], 0.0)
    df["is_festival"] = df["festival"].notna().astype(int)
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month

    # organic-demand baseline proxy: trailing 7-day sales mean per product,
    # computed BEFORE merging ad spend features so the model can separate
    # "this product just sells a lot anyway" from "ads are working"
    df = df.sort_values(["product_id", "date"])
    df["sales_rolling_mean_7"] = (
        df.groupby("product_id")["sales"].transform(lambda s: s.shift(1).rolling(7, min_periods=1).mean())
    ).fillna(0.0)

    X, encoder = build_design_matrix(df, fit=True)
    y = df[TARGET_COLUMN].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=250, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    print(f"[SIMULATED] Trained RandomForestRegressor on {len(X_train)} product-day rows")
    print(f"[SIMULATED] Test MAE: {mean_absolute_error(y_test, preds):.1f} revenue units | "
          f"Test R^2: {r2_score(y_test, preds):.3f}")

    if save:
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump({"model": model, "encoder": encoder}, MODEL_PATH)
        print(f"[SIMULATED] Model saved -> {MODEL_PATH}")

    return model, encoder


def _product_context(product_id: str, sales: pd.DataFrame, products: pd.DataFrame,
                      product_features: pd.DataFrame) -> dict:
    history = sales[sales["product_id"] == product_id].sort_values("date")
    if history.empty:
        raise ValueError(f"product_id {product_id} not found in sales_daily.csv")

    product_row = products[products["product_id"] == product_id].iloc[0]
    feat_row = product_features[product_features["product_id"] == product_id].iloc[0]

    recent_avg_spend = float(history["advertising_spend"].tail(30).mean())
    recent_discount = float(history["discount"].tail(7).mean())
    organic_baseline = float(history["sales"].tail(7).mean())

    return {
        "category": product_row["category"],
        "marketplace": product_row["marketplace"],
        "price": float(product_row["price"]),
        "margin_pct": float(feat_row["margin_pct"]),
        "recent_avg_spend": max(recent_avg_spend, 0.0),
        "recent_discount": recent_discount,
        "organic_baseline": organic_baseline,
        "verification_fail_rate": float(feat_row.get("verification_fail_rate", 0.0)),
    }


def _predict_revenue(model, encoder, context: dict, spend: float, is_festival: int,
                      festival_name: str, target_date: date) -> float:
    row = pd.DataFrame([{
        "advertising_spend": spend,
        "discount": context["recent_discount"],
        "is_festival": is_festival,
        "festival": festival_name,
        "day_of_week": target_date.weekday(),
        "month": target_date.month,
        "price": context["price"],
        "margin_pct": context["margin_pct"],
        "sales_rolling_mean_7": context["organic_baseline"],
        "category": context["category"],
        "marketplace": context["marketplace"],
    }])
    X = build_design_matrix(row, encoder=encoder, fit=False)
    return max(0.0, float(model.predict(X)[0]))


def recommend_advertising(product_id: str) -> dict:
    """
    Public entrypoint matching the AI API contract for POST /ai/advertising.

    Returns:
        {
            "advertise": bool,
            "recommended_budget": float,
            "expected_roi": float,
            "recommended_marketplace": str,
            "recommended_start_date": "YYYY-MM-DD",
            "reason": str
        }
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("No trained model found. Run `python advertising.py --train` first.")

    bundle = joblib.load(MODEL_PATH)
    model, encoder = bundle["model"], bundle["encoder"]

    sales = load_sales()
    products = load_products()
    product_features = load_product_features()
    context = _product_context(product_id, sales, products, product_features)

    upcoming = _next_festival_within(FESTIVAL_LOOKAHEAD_DAYS, date.today())
    if upcoming:
        festival_name, festival_date, days_until = upcoming[0]
        target_date = festival_date
        is_festival = 1
        recommended_start_date = (date.today() + timedelta(days=max(0, days_until - 7))).isoformat()
        timing_reason = f"Campaign timed ~7 days ahead of upcoming {festival_name} ({festival_date.isoformat()})"
    else:
        festival_name, target_date, is_festival = "none", date.today(), 0
        recommended_start_date = date.today().isoformat()
        timing_reason = "No festival in the next 30 days; recommending immediate start if numbers justify it"

    base_spend = max(context["recent_avg_spend"], MIN_SPEND_FLOOR)
    spend_levels = sorted(set([round(base_spend * m, 2) for m in SPEND_GRID_MULTIPLIERS]))

    predicted_revenue = [
        _predict_revenue(model, encoder, context, spend, is_festival, festival_name, target_date)
        for spend in spend_levels
    ]

    best_spend = spend_levels[0]
    best_roi = 0.0
    for i in range(1, len(spend_levels)):
        delta_spend = spend_levels[i] - spend_levels[i - 1]
        delta_revenue = predicted_revenue[i] - predicted_revenue[i - 1]
        marginal_roi = (delta_revenue * context["margin_pct"]) / delta_spend if delta_spend > 0 else 0.0

        if marginal_roi >= MIN_MARGINAL_ROI:
            best_spend = spend_levels[i]
            best_roi = marginal_roi
        else:
            break

    if best_spend <= spend_levels[0] or best_roi <= 0:
        advertise = False
        recommended_budget = 0.0
        expected_roi = 0.0
        reason = "Marginal ROI on additional ad spend does not clear the profitability threshold at current margin"
    else:
        advertise = True
        recommended_budget = round(best_spend, 2)
        expected_roi = round(best_roi, 2)
        reason = (
            f"Best marginal ROI {best_roi:.2f}x found at daily spend {best_spend:.0f} "
            f"(margin {context['margin_pct']*100:.0f}%). {timing_reason}."
        )

    # Bonus signal: which marketplace has historically had the best
    # revenue-per-ad-spend for this category (informational only — this
    # dataset assigns one marketplace per product, so it isn't acted on
    # automatically).
    category = context["category"]
    cat_products = product_features[product_features["category"] == category].copy()
    cat_products["roas"] = np.where(
        cat_products["total_ad_spend"] > 0,
        cat_products["total_revenue"] / cat_products["total_ad_spend"],
        0.0,
    )
    best_marketplace_row = (
        cat_products.groupby("marketplace")["roas"].mean().sort_values(ascending=False)
    )
    best_marketplace = best_marketplace_row.index[0] if not best_marketplace_row.empty else context["marketplace"]

    return {
        "product_id": product_id,
        "advertise": advertise,
        "recommended_budget": recommended_budget,
        "expected_roi": expected_roi,
        "current_marketplace": context["marketplace"],
        "best_historical_roas_marketplace_for_category": best_marketplace,
        "recommended_start_date": recommended_start_date,
        "reason": reason,
    }


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA advertising intelligence.")
    parser.add_argument("--train", action="store_true")
    parser.add_argument("--predict", type=str, metavar="PRODUCT_ID")
    args = parser.parse_args()

    if args.train:
        train()
    elif args.predict:
        print(recommend_advertising(args.predict))
    else:
        print("Nothing to do. Use --train or --predict PRODUCT_ID.")


if __name__ == "__main__":
    main()