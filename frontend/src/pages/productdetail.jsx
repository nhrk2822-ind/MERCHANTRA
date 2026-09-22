import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function ProductDetail() {
  const { permanentId } = useParams();
  const [product, setProduct] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.products.get(permanentId), api.products.timeline(permanentId)])
      .then(([p, t]) => {
        setProduct(p);
        setTimeline(t);
      })
      .catch((e) => setError(e.message));
  }, [permanentId]);

  return (
    <Layout title={permanentId}>
      {error && <div className="text-status-fail text-sm mb-4">{error}</div>}

      {product && (
        <div className="border border-line rounded p-4 mb-6">
          <div className="font-mono text-signal-amber text-sm mb-1">
            {product.permanent_product_id}
          </div>
          <div className="text-lg font-semibold">{product.name}</div>
          <div className="text-text-muted text-sm mt-1">
            {product.category} · SKU {product.sku} · {product.status}
          </div>
        </div>
      )}

      <h2 className="text-sm font-medium mb-3">Lifecycle Timeline</h2>
      {timeline.length === 0 ? (
        <p className="text-text-muted text-sm">No events recorded yet.</p>
      ) : (
        <ol className="relative border-l border-line ml-2">
          {timeline.map((event, idx) => (
            <li key={idx} className="mb-4 ml-4">
              <div className="absolute w-2 h-2 bg-signal-amber rounded-full -left-1 mt-1.5" />
              <div className="text-sm font-mono">{event.event_type}</div>
              <div className="text-xs text-text-muted">{event.created_at}</div>
            </li>
          ))}
        </ol>
      )}
    </Layout>
  );
}