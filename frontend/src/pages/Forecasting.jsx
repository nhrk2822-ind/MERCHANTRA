import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function Forecasting() {
  const [permanentId, setPermanentId] = useState("");
  const [forecasts, setForecasts] = useState(null);
  const [error, setError] = useState("");

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setForecasts(null);
    try {
      const data = await api.forecasts.get(permanentId);
      setForecasts(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Forecasting">
      <form onSubmit={handleLookup} className="flex gap-2 mb-6 max-w-md">
        <input
          placeholder="Permanent Product ID (MCH-P-000125)"
          value={permanentId}
          onChange={(e) => setPermanentId(e.target.value)}
          required
          className="flex-1 bg-panel border border-line rounded-sm px-3 py-2 text-sm font-mono"
        />
        <button type="submit" className="bg-signal-amber text-ink px-4 rounded-sm text-sm font-medium">
          Look up
        </button>
      </form>

      {error && <div className="text-status-fail text-sm mb-4">{error}</div>}

      {forecasts && forecasts.length === 0 && (
        <p className="text-text-muted text-sm">No forecasts recorded for this product yet.</p>
      )}

      {forecasts && forecasts.length > 0 && (
        <table className="w-full text-sm max-w-2xl">
          <thead>
            <tr className="text-left text-text-muted border-b border-line">
              <th className="py-2 font-normal">Type</th>
              <th className="py-2 font-normal">Horizon</th>
              <th className="py-2 font-normal text-right">Predicted</th>
              <th className="py-2 font-normal text-right">Stockout Risk</th>
              <th className="py-2 font-normal text-right">Recommended Restock</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map((f, idx) => (
              <tr key={idx} className="border-b border-line">
                <td className="py-2 font-mono">{f.forecast_type}</td>
                <td className="py-2 text-text-muted">{f.horizon_days}d</td>
                <td className="py-2 text-right font-mono">{f.predicted_value}</td>
                <td className="py-2 text-right font-mono text-status-review">
                  {(f.stockout_risk * 100).toFixed(0)}%
                </td>
                <td className="py-2 text-right font-mono">{f.recommended_restock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}