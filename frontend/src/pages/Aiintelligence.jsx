import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

// Overview page: pulls together the pending restock recommendations
// (the one cross-product AI view we have) and links out to the
// per-product Forecasting/Advertising pages for anything more specific.
export default function AIIntelligence() {
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.restock.list().then(setRecommendations).catch((e) => setError(e.message));
  }, []);

  return (
    <Layout title="AI Intelligence">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}

      <h2 className="text-sm font-medium mb-3">Pending Restock Recommendations</h2>
      {recommendations.length === 0 ? (
        <p className="text-text-muted text-sm">
          Nothing pending — AI-generated restock recommendations will show up here.
        </p>
      ) : (
        <table className="w-full text-sm max-w-2xl">
          <thead>
            <tr className="text-left text-text-muted border-b border-line">
              <th className="py-2 font-normal">Product</th>
              <th className="py-2 font-normal text-right">Recommended Qty</th>
              <th className="py-2 font-normal">Reason</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="py-2 font-mono">{r.permanent_product_id}</td>
                <td className="py-2 text-right font-mono">{r.recommended_quantity}</td>
                <td className="py-2 text-text-muted">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-text-muted mt-6">
        For product-verification confidence scores, see the Smart Station page.
        For return-risk assessments, see a return&apos;s inspection step under Returns.
      </p>
    </Layout>
  );
}