import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function ProductDetail() {
  const { permanentId } = useParams();
  const [product, setProduct] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.products.get(permanentId),
      api.products.timeline(permanentId),
    ])
      .then(([p, t]) => {
        setProduct(p);
        setTimeline(t);
      })
      .catch((e) => setError(e.message));
  }, [permanentId]);

  return (
    <Layout title="Product detail">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Permanent product record</div>
          <h2 className="mt-page-heading">
            {product?.name || "Product detail"}
          </h2>
          <p className="mt-page-description">
            Full lifecycle history for {permanentId}.
          </p>
        </div>

        <Link to="/products" className="mt-secondary-btn">
          ← Products
        </Link>
      </div>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      {product && (
        <section className="mt-detail-hero">
          <div className="mt-detail-hero__identity">
            <div className="mt-product-mark">M</div>
            <div>
              <div className="mt-detail-id">
                {product.permanent_product_id}
              </div>
              <h3>{product.name}</h3>
              <p>
                {product.category || "Uncategorised"} · SKU{" "}
                {product.sku || "—"}
              </p>
            </div>
          </div>

          <span className="mt-status-pill mt-status-pill--success">
            {product.status || "ACTIVE"}
          </span>
        </section>
      )}

      <section className="mt-table-panel mt-timeline-panel">
        <div className="mt-panel-heading">
          <div>
            <h3>Lifecycle timeline</h3>
            <span>Immutable product events returned by the backend.</span>
          </div>
          <span className="mt-count-pill">
            {timeline.length} events
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="mt-empty-state">
            <div className="mt-empty-state__icon">◌</div>
            <h3>No events recorded yet</h3>
            <p>The timeline will populate as the product moves through MERCHANTRA.</p>
          </div>
        ) : (
          <ol className="mt-timeline">
            {timeline.map((event, idx) => (
              <li key={idx} className="mt-timeline__item">
                <div className="mt-timeline__dot" />
                <div className="mt-timeline__content">
                  <div className="mt-timeline__top">
                    <span className="mt-mono mt-strong">
                      {event.event_type}
                    </span>
                    <span className="mt-timeline__time">
                      {event.created_at}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Layout>
  );
}
