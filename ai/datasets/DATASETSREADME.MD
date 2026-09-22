# MERCHANTRA — Dataset Structure (Phase 2)

Status: `PLANNED` schema definition. No data generated yet — this file only
defines shape, types, and constraints so Phase 3 (synthetic data generation)
can be implemented against a fixed contract.

All data described here is/will be **synthetic**. Nothing in this folder
represents real marketplace, seller, or customer data.

---

## 1. Core dataset: `products_master.csv`

One row per product (maps 1:1 to a Permanent Product ID).

| Column | Type | Notes |
|---|---|---|
| product_id | string | Format `MCH-P-000125` |
| sku | string | Seller-defined SKU |
| category | string | 40 categories spanning electronics, fashion, beauty, home, family/kids, and leisure — full list and per-category price/return profile hardcoded in `generate_dataset.py` |
| marketplace | string | 27 platforms incl. amazon, flipkart, meesho, myntra, ajio, snapdeal, tata_cliq, jiomart, nykaa, shopsy, limeroad, firstcry, pepperfry, urban_ladder, croma, reliance_digital, paytm_mall, shopclues, indiamart, 1mg, netmeds, purplle, ebay, etsy, walmart_marketplace, own_shopify_store, woocommerce_store (all mocked) |
| price | float | Selling price (INR) |
| cost | float | Cost price (INR), cost <= price |
| rating | float | 1.0–5.0 |
| launch_date | date | When product went live |

---

## 2. Transaction dataset: `sales_daily.csv`

One row per product per day. This is the main time-series table used by
demand/festival forecasting and advertising/ROI modules.

| Column | Type | Notes |
|---|---|---|
| product_id | string | FK to products_master |
| date | date | ISO 8601 |
| stock | int | Units on hand at day start |
| orders | int | Units ordered that day |
| sales | int | Units sold (<= orders, accounts for cancellations) |
| revenue | float | sales * price - discount effects |
| discount | float | 0.0–1.0, fraction off |
| returns | int | Units returned that day |
| return_reason | string / null | damage, wrong_item, size_issue, not_needed, other |
| advertising_spend | float | INR spent that day on this product |
| season | string | summer, winter, monsoon |
| festival | string / null | Diwali, Holi, Eid, Raksha Bandhan, Christmas, New Year, Valentine's Day, wedding_season, end_of_season_sale, marketplace_sale_event, or null |

---

## 3. Verification dataset: `verification_events.csv`

Used by computer_vision/ and anomaly_detection/ prototypes.

| Column | Type | Notes |
|---|---|---|
| product_id | string | FK to products_master |
| event_id | string | Unique event id |
| timestamp | datetime | |
| barcode_match | bool | CHECK 1 result |
| quantity_expected | int | |
| quantity_scanned | int | |
| image_path | string | Path to (synthetic/mock) product image |
| product_match_score | float | 0.0–1.0 |
| damage_probability | float | 0.0–1.0 |
| anomaly_score | float | 0.0–1.0 |
| decision | string | PASS / FAIL / REVIEW |
| operator_id | string | Mock warehouse operator |

---

## 4. Generation rules

- All datasets generated with a fixed random seed for reproducibility.
- Realistic but synthetic distributions: e.g. return rates vary by category,
  festival months show demand uplift, damage-related returns correlate
  weakly with low-cost/fragile categories.
- No file in this folder may claim to be sourced from a real marketplace.
- Every generated file must be accompanied by a short data dictionary
  (this document) and a `SIMULATED` label in any dashboard that consumes it.

---

## 5. Next file

`generate_dataset.py` — the synthetic data generator implementing this
schema (Phase 3). Not created yet.