import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";
import "./Dashboard.css";

import amazonLogo from "../assets/amazon.svg";
import flipkartLogo from "../assets/flipkart.svg";
import shopifyLogo from "../assets/shopify.svg";
import meeshoLogo from "../assets/meesho.svg";
import myntraLogo from "../assets/myntra.svg";
import bigcommerceLogo from "../assets/bigcommerce.svg";
import etsyLogo from "../assets/esty.svg";
import walmartLogo from "../assets/walmart.svg";

const marketplaces = [
  { name: "Amazon", logo: amazonLogo },
  { name: "Flipkart", logo: flipkartLogo },
  { name: "Shopify", logo: shopifyLogo },
  { name: "Meesho", logo: meeshoLogo },
  { name: "Myntra", logo: myntraLogo },
  { name: "BigCommerce", logo: bigcommerceLogo },
  { name: "Etsy", logo: etsyLogo },
  { name: "Walmart", logo: walmartLogo },
];

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.products
      .list()
      .then((data) => setProducts(data || []))
      .catch((err) => {
        console.error(err);
        setError(err.message || "Unable to load dashboard data.");
      });
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="dashboard-home">

        {/* HERO */}
        <section className="dashboard-hero">

          {/* LEFT */}
          <div className="dashboard-hero-content">

            <div className="dashboard-eyebrow">
              <span className="dashboard-eyebrow-dot" />
              AI-POWERED COMMERCE PLATFORM
            </div>

            <h1 className="dashboard-title">
              Your products.
              <br />
              <span>One continuous</span>
              <br />
              record.
            </h1>

            <p className="dashboard-description">
              Merchantra connects your marketplaces, products, inventory,
              warehouse operations, orders, returns and AI intelligence into
              one connected ecosystem.
            </p>

            <div className="dashboard-actions">
              <Link to="/products" className="dashboard-primary-btn">
                Start with Merchantra
                <span>→</span>
              </Link>

              <Link to="/analytics" className="dashboard-secondary-btn">
                Explore Platform
              </Link>
            </div>

            <div className="dashboard-features">
              <div>
                <span>✓</span>
                Centralized data
              </div>

              <div>
                <span>✓</span>
                AI recommendations
              </div>

              <div>
                <span>✓</span>
                Product traceability
              </div>
            </div>

          </div>

          {/* RIGHT APPLICATION PREVIEW */}
          <div className="dashboard-visual">

            <div className="dashboard-browser">

              <div className="browser-top">
                <div className="browser-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="browser-address" />
              </div>

              <div className="browser-body">

                {/* MINI SIDEBAR */}
                <div className="mock-sidebar">

                  <div className="mock-logo">
                    MERCHANTRA
                  </div>

                  <div className="mock-nav active">
                    ✦ Overview
                  </div>

                  <div className="mock-nav">
                    Products
                  </div>

                  <div className="mock-nav">
                    Inventory
                  </div>

                  <div className="mock-nav">
                    Orders
                  </div>

                  <div className="mock-nav">
                    Smart Station
                  </div>

                  <div className="mock-nav">
                    Returns
                  </div>

                  <div className="mock-nav">
                    AI Intelligence
                  </div>

                </div>

                {/* MINI COMMAND CENTER */}
                <div className="mock-main">

                  <div className="mock-main-top">

                    <div>
                      <div className="mock-small-label">
                        COMMAND CENTER
                      </div>

                      <div className="mock-greeting">
                        Good morning, Seller
                      </div>
                    </div>

                    <div className="mock-ai-status">
                      <span />
                      Intelligence Active
                    </div>

                  </div>

                  <div className="mock-product-card">

                    <div className="mock-small-label">
                      PERMANENT PRODUCT ID
                    </div>

                    <div className="mock-product-id">
                      MCH-P-00125
                    </div>

                    <div className="mock-progress">
                      <span />
                    </div>

                    <div className="mock-lifecycle">
                      <span>Product</span>
                      <span>Inventory</span>
                      <span>Order</span>
                      <span>Shipping</span>
                      <span>Return</span>
                    </div>

                  </div>

                  <div className="mock-ai-card">

                    <div className="mock-ai-icon">
                      ✦
                    </div>

                    <div>
                      <div className="mock-ai-title">
                        AI Recommendation
                      </div>

                      <div className="mock-ai-text">
                        3 products may need price optimization.
                      </div>
                    </div>

                  </div>

                  <div className="mock-stat-row">

                    <div className="mock-stat-card">
                      <span>MARKETPLACES</span>
                      <strong>4 Connected</strong>
                    </div>

                    <div className="mock-stat-card">
                      <span>SMART STATION</span>
                      <strong>Ready</strong>
                    </div>

                  </div>

                  {/* CONNECT MARKETPLACES BUTTON */}
                  <Link
                    to="/marketplaces"
                    className="mock-connect"
                    style={{
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    <div className="mock-connect-icon">
                      ⊞
                    </div>

                    <div>
                      <strong>
                        Connect Marketplaces & Apps
                      </strong>

                      <small>
                        Integrate your sales & data channels
                      </small>
                    </div>

                    <span>→</span>
                  </Link>

                </div>

              </div>

            </div>

            {/* MARKETPLACE PANEL */}
            <div className="marketplace-panel">

              <div className="marketplace-heading">
                Connect Marketplaces & Apps
              </div>

              <p>
                Choose from apps and marketplaces
                <br />
                to connect and sync your data.
              </p>

              <div className="marketplace-search">
                <span>⌕</span>
                Search apps or marketplaces...
              </div>

              <button className="marketplace-filter">
                All Categories
                <span>⌄</span>
              </button>

              <div className="marketplace-section-title">
                <strong>Popular</strong>

                <Link
                  to="/marketplaces"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  View all
                </Link>
              </div>

              {/* ACTUAL LOGOS */}
              <div className="marketplace-grid">

                {marketplaces.map((marketplace) => (
                  <div
                    className="marketplace-item"
                    key={marketplace.name}
                  >
                    <div className="marketplace-icon">
                      <img
                        src={marketplace.logo}
                        alt={`${marketplace.name} logo`}
                      />
                    </div>

                    <span>
                      {marketplace.name}
                    </span>
                  </div>
                ))}

              </div>

              <div className="marketplace-section-title categories-title">
                <strong>Categories</strong>

                <Link
                  to="/marketplaces"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  View all
                </Link>
              </div>

              <div className="category-grid">

                <div className="category-item">
                  <div>▦</div>
                  <span>Marketplaces</span>
                  <small>32 apps</small>
                </div>

                <div className="category-item">
                  <div>▣</div>
                  <span>Websites</span>
                  <small>12 apps</small>
                </div>

                <div className="category-item">
                  <div>▤</div>
                  <span>Logistics</span>
                  <small>12 apps</small>
                </div>

                <div className="category-item">
                  <div>✈</div>
                  <span>Marketing</span>
                  <small>16 apps</small>
                </div>

              </div>

              {/* VIEW ALL APPS BUTTON */}
              <Link
                to="/marketplaces"
                className="view-all-apps"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                View All Apps (100+) →
              </Link>

            </div>

            {/* PERMANENT PRODUCT ID */}
            <div className="permanent-id-badge">
              <span>PERMANENT PRODUCT ID</span>
              <strong>MCH-P-00125</strong>
            </div>

          </div>

        </section>

        {error && (
          <div className="dashboard-error">
            Couldn't load dashboard data: {error}
          </div>
        )}

      </div>
    </Layout>
  );
}