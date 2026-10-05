import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function AIIntelligence() {
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.restock
      .list()
      .then(setRecommendations)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Layout title="AI Intelligence">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Decision support</div>
          <h2 className="mt-page-heading">AI Intelligence</h2>
          <p className="mt-page-description">
            Review backend-served recommendations without turning them into
            automatic operational decisions.
          </p>
        </div>

        <span className="mt-feature-pill">RESTOCK ENGINE</span>
      </div>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      <section className="mt-table-panel">
        <div className="mt-panel-heading">
          <div>
            <h3>Pending restock recommendations</h3>
            <span>Recommendations currently returned by the backend.</span>
          </div>
          <span className="mt-count-pill">
            {recommendations.length} pending
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="mt-empty-state">
            <div className="mt-empty-state__icon">✦</div>
            <h3>Nothing pending</h3>
            <p>
              AI-generated restock recommendations will appear here when available.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Recommended qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => (
                <tr key={r.id}>
                  <td className="mt-mono">{r.permanent_product_id}</td>
                  <td className="text-right mt-mono">
                    {r.recommended_quantity}
                  </td>
                  <td>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="mt-info-strip">
        <span>Related intelligence</span>
        <div>
          <span>Forecasting</span>
          <span>Advertising / ROI</span>
          <span>Smart Station confidence</span>
          <span>Returns risk assessment</span>
        </div>
      </div>
    </Layout>
  );
}
