"""
MERCHANTRA - Synthetic Dataset Generator (Phase 3)

Status: SIMULATED / synthetic data only. Nothing produced here should ever
be presented as real marketplace, seller, or customer data.

Covers a full e-commerce category taxonomy and a comprehensive list of
Indian + global e-selling platforms, so downstream models (return-risk,
forecasting, advertising) train/test across realistic breadth rather than
a toy handful of categories.

Implements the schema defined in ai/datasets/README.md:
    - products_master.csv
    - sales_daily.csv
    - verification_events.csv

Usage:
    python generate_dataset.py --num-products 500 --days 365 --seed 42

Dependencies:
    pip install pandas numpy
"""

import argparse
import os
import uuid
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# ------------------------------------------------------------------
# CATEGORY TAXONOMY
# Covers the full breadth of what Indian + global marketplaces sell.
# (price_range in INR, base_return_rate, fragile flag used for
#  damage-probability / return-reason weighting)
# ------------------------------------------------------------------
CATEGORY_PROFILE = {
    # Electronics & tech
    "mobiles_tablets":        {"price_range": (2999, 150000), "return_rate": 0.09, "fragile": True},
    "laptops_computers":      {"price_range": (15000, 250000), "return_rate": 0.07, "fragile": True},
    "cameras_accessories":    {"price_range": (999, 200000), "return_rate": 0.06, "fragile": True},
    "audio_headphones":       {"price_range": (299, 40000), "return_rate": 0.10, "fragile": True},
    "wearables_smartwatch":   {"price_range": (999, 60000), "return_rate": 0.11, "fragile": True},
    "large_appliances":       {"price_range": (8000, 120000), "return_rate": 0.04, "fragile": True},
    "small_kitchen_appliances": {"price_range": (499, 25000), "return_rate": 0.06, "fragile": True},
    "computer_accessories":   {"price_range": (199, 15000), "return_rate": 0.08, "fragile": True},

    # Fashion & apparel
    "mens_apparel":           {"price_range": (299, 8000), "return_rate": 0.14, "fragile": False},
    "womens_apparel":         {"price_range": (299, 10000), "return_rate": 0.18, "fragile": False},
    "kids_apparel":           {"price_range": (199, 4000), "return_rate": 0.12, "fragile": False},
    "ethnic_wear":            {"price_range": (499, 25000), "return_rate": 0.16, "fragile": False},
    "footwear":               {"price_range": (399, 12000), "return_rate": 0.20, "fragile": False},
    "innerwear_sleepwear":    {"price_range": (149, 2500), "return_rate": 0.10, "fragile": False},
    "winterwear":             {"price_range": (499, 9000), "return_rate": 0.13, "fragile": False},
    "bags_luggage":           {"price_range": (299, 20000), "return_rate": 0.09, "fragile": False},
    "jewellery":              {"price_range": (199, 100000), "return_rate": 0.11, "fragile": True},
    "watches_eyewear":        {"price_range": (299, 50000), "return_rate": 0.10, "fragile": True},

    # Beauty & personal care
    "skincare":               {"price_range": (99, 5000), "return_rate": 0.03, "fragile": False},
    "makeup_cosmetics":       {"price_range": (99, 4000), "return_rate": 0.04, "fragile": True},
    "haircare":               {"price_range": (99, 3000), "return_rate": 0.03, "fragile": False},
    "fragrances":             {"price_range": (199, 8000), "return_rate": 0.05, "fragile": True},
    "personal_care":          {"price_range": (49, 2500), "return_rate": 0.03, "fragile": False},
    "health_wellness":        {"price_range": (99, 6000), "return_rate": 0.04, "fragile": False},

    # Home & living
    "furniture":              {"price_range": (999, 80000), "return_rate": 0.05, "fragile": True},
    "home_decor":             {"price_range": (149, 15000), "return_rate": 0.07, "fragile": True},
    "kitchenware_dining":     {"price_range": (99, 10000), "return_rate": 0.06, "fragile": True},
    "bedding_linen":          {"price_range": (299, 8000), "return_rate": 0.08, "fragile": False},
    "home_improvement_tools": {"price_range": (99, 20000), "return_rate": 0.05, "fragile": True},
    "garden_outdoor":         {"price_range": (149, 15000), "return_rate": 0.04, "fragile": True},

    # Family, kids & pets
    "baby_products":          {"price_range": (99, 12000), "return_rate": 0.07, "fragile": False},
    "toys_games":             {"price_range": (149, 8000), "return_rate": 0.08, "fragile": True},
    "pet_supplies":           {"price_range": (99, 6000), "return_rate": 0.05, "fragile": False},

    # Leisure & other
    "sports_fitness":         {"price_range": (199, 40000), "return_rate": 0.06, "fragile": True},
    "books_media":            {"price_range": (99, 3000), "return_rate": 0.02, "fragile": False},
    "stationery_office":      {"price_range": (49, 5000), "return_rate": 0.03, "fragile": False},
    "musical_instruments":    {"price_range": (499, 60000), "return_rate": 0.06, "fragile": True},
    "automotive_accessories": {"price_range": (149, 25000), "return_rate": 0.06, "fragile": True},
    "groceries_gourmet":      {"price_range": (49, 3000), "return_rate": 0.02, "fragile": False},
    "industrial_scientific":  {"price_range": (299, 100000), "return_rate": 0.03, "fragile": True},
}

CATEGORIES = list(CATEGORY_PROFILE.keys())

# ------------------------------------------------------------------
# MARKETPLACE LIST
# Comprehensive Indian + global e-selling platforms. All handled here
# through a mock marketplace-adapter interface (see project mocking
# rule) — no real marketplace API calls are made anywhere.
# ------------------------------------------------------------------
MARKETPLACES = [
    "amazon",
    "flipkart",
    "meesho",
    "myntra",
    "ajio",
    "snapdeal",
    "tata_cliq",
    "jiomart",
    "nykaa",
    "shopsy",
    "limeroad",
    "firstcry",
    "pepperfry",
    "urban_ladder",
    "croma",
    "reliance_digital",
    "paytm_mall",
    "shopclues",
    "indiamart",
    "1mg",
    "netmeds",
    "purplle",
    "ebay",
    "etsy",
    "walmart_marketplace",
    "own_shopify_store",
    "woocommerce_store",
]

RETURN_REASONS = ["damage", "wrong_item", "size_issue", "not_needed", "quality_issue", "other"]
SEASONS = ["summer", "winter", "monsoon"]

# Festival calendar: month/day -> festival name, plus a demand uplift multiplier
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
FESTIVAL_WINDOW_DAYS = 5  # uplift applies +/- this many days around the date


def season_for_month(month: int) -> str:
    if month in (4, 5, 6):
        return "summer"
    if month in (7, 8, 9):
        return "monsoon"
    return "winter"


def festival_for_date(d: datetime):
    for (m, day), (name, uplift) in FESTIVAL_CALENDAR.items():
        festival_date = datetime(d.year, m, day)
        if abs((d - festival_date).days) <= FESTIVAL_WINDOW_DAYS:
            return name, uplift
    return None, 1.0


def make_product_id(index: int) -> str:
    return f"MCH-P-{index:06d}"


def generate_products(num_products: int, rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    for i in range(1, num_products + 1):
        category = rng.choice(CATEGORIES)
        profile = CATEGORY_PROFILE[category]
        low, high = profile["price_range"]
        price = round(float(rng.uniform(low, high)), 2)
        cost = round(price * float(rng.uniform(0.5, 0.85)), 2)  # cost < price
        launch_offset = int(rng.integers(30, 900))
        rows.append({
            "product_id": make_product_id(i),
            "sku": f"SKU-{uuid.uuid4().hex[:8].upper()}",
            "category": category,
            "marketplace": rng.choice(MARKETPLACES),
            "price": price,
            "cost": cost,
            "rating": round(float(rng.uniform(2.5, 5.0)), 1),
            "launch_date": (datetime.today() - timedelta(days=launch_offset)).date().isoformat(),
        })
    return pd.DataFrame(rows)


def generate_sales(products: pd.DataFrame, days: int, rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    start_date = datetime.today() - timedelta(days=days)

    for _, product in products.iterrows():
        category = product["category"]
        profile = CATEGORY_PROFILE[category]
        base_return_rate = profile["return_rate"]
        fragile = profile["fragile"]

        stock = int(rng.integers(50, 500))
        base_daily_demand = float(rng.uniform(1, 20))

        for day_offset in range(days):
            current_date = start_date + timedelta(days=day_offset)
            season = season_for_month(current_date.month)
            festival, uplift = festival_for_date(current_date)

            weekend_multiplier = 1.15 if current_date.weekday() >= 5 else 1.0

            expected_orders = base_daily_demand * uplift * weekend_multiplier
            orders = int(max(0, rng.poisson(expected_orders)))

            cancel_rate = float(rng.uniform(0.0, 0.05))
            sales = int(orders * (1 - cancel_rate))

            discount = 0.0
            if festival is not None:
                discount = round(float(rng.uniform(0.05, 0.35)), 2)
            elif rng.random() < 0.05:
                discount = round(float(rng.uniform(0.05, 0.15)), 2)

            effective_price = product["price"] * (1 - discount)
            revenue = round(sales * effective_price, 2)

            day_return_rate = base_return_rate * (1.5 if fragile else 1.0)
            returns = int(rng.binomial(sales, min(day_return_rate, 0.6)) if sales > 0 else 0)
            return_reason = None
            if returns > 0:
                if fragile:
                    reason_weights = [0.35, 0.15, 0.15, 0.15, 0.15, 0.05]
                else:
                    reason_weights = [0.10, 0.20, 0.25, 0.25, 0.15, 0.05]
                return_reason = rng.choice(RETURN_REASONS, p=reason_weights)

            advertising_spend = round(float(rng.uniform(0, 500)) * (2.0 if festival else 1.0), 2)

            stock = max(0, stock - sales)
            if stock < 20:
                stock += int(rng.integers(100, 300))

            rows.append({
                "product_id": product["product_id"],
                "date": current_date.date().isoformat(),
                "stock": stock,
                "orders": orders,
                "sales": sales,
                "revenue": revenue,
                "discount": discount,
                "returns": returns,
                "return_reason": return_reason,
                "advertising_spend": advertising_spend,
                "season": season,
                "festival": festival,
            })

    return pd.DataFrame(rows)


def generate_verification_events(products: pd.DataFrame, rng: np.random.Generator,
                                   events_per_product: int = 3) -> pd.DataFrame:
    rows = []
    operators = [f"OP-{i:03d}" for i in range(1, 11)]

    for _, product in products.iterrows():
        fragile = CATEGORY_PROFILE[product["category"]]["fragile"]
        for _ in range(events_per_product):
            barcode_match = bool(rng.random() > 0.03)
            quantity_expected = int(rng.integers(1, 10))
            quantity_scanned = quantity_expected if rng.random() > 0.05 else quantity_expected - 1

            product_match_score = float(np.clip(rng.normal(0.95, 0.05), 0, 1))
            damage_probability = float(np.clip(rng.normal(0.08 if fragile else 0.03, 0.05), 0, 1))
            anomaly_score = float(np.clip(rng.normal(0.05, 0.04), 0, 1))

            if not barcode_match or quantity_scanned != quantity_expected:
                decision = "FAIL"
            elif damage_probability > 0.3 or anomaly_score > 0.3:
                decision = "REVIEW"
            elif product_match_score < 0.7:
                decision = "REVIEW"
            else:
                decision = "PASS"

            rows.append({
                "product_id": product["product_id"],
                "event_id": f"EV-{uuid.uuid4().hex[:10].upper()}",
                "timestamp": (datetime.now() - timedelta(minutes=int(rng.integers(0, 200000)))).isoformat(),
                "barcode_match": barcode_match,
                "quantity_expected": quantity_expected,
                "quantity_scanned": quantity_scanned,
                "image_path": f"mock_images/{product['product_id']}_{uuid.uuid4().hex[:6]}.jpg",
                "product_match_score": round(product_match_score, 3),
                "damage_probability": round(damage_probability, 3),
                "anomaly_score": round(anomaly_score, 3),
                "decision": decision,
                "operator_id": rng.choice(operators),
            })

    return pd.DataFrame(rows)


def main():
    parser = argparse.ArgumentParser(description="Generate MERCHANTRA synthetic datasets.")
    parser.add_argument("--num-products", type=int, default=500)
    parser.add_argument("--days", type=int, default=365)
    parser.add_argument("--events-per-product", type=int, default=3)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out-dir", type=str, default=os.path.dirname(os.path.abspath(__file__)))
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)

    print(f"[SIMULATED] Categories: {len(CATEGORIES)} | Marketplaces: {len(MARKETPLACES)}")
    print(f"[SIMULATED] Generating {args.num_products} products over {args.days} days (seed={args.seed})...")

    products = generate_products(args.num_products, rng)
    sales = generate_sales(products, args.days, rng)
    verification = generate_verification_events(products, rng, args.events_per_product)

    os.makedirs(args.out_dir, exist_ok=True)
    products_path = os.path.join(args.out_dir, "products_master.csv")
    sales_path = os.path.join(args.out_dir, "sales_daily.csv")
    verification_path = os.path.join(args.out_dir, "verification_events.csv")

    products.to_csv(products_path, index=False)
    sales.to_csv(sales_path, index=False)
    verification.to_csv(verification_path, index=False)

    print(f"[SIMULATED] Wrote {len(products)} rows -> {products_path}")
    print(f"[SIMULATED] Wrote {len(sales)} rows -> {sales_path}")
    print(f"[SIMULATED] Wrote {len(verification)} rows -> {verification_path}")
    print("Done. All data above is synthetic (see ai/datasets/README.md).")


if __name__ == "__main__":
    main()