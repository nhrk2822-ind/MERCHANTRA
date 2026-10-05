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
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Demand planning</div>
          <h2 className="mt-page-heading">Forecasting</h2>
          <p className="mt-page-description">
            Retrieve demand projections, stockout risk and restock guidance.
          </p>
        </div>
      </div>

      <form onSubmit={handleLookup} className="mt-search-bar">
        <div className="mt-search-bar__field">
          <span>Product identity</span>
          <input
            placeholder="MCH-P-000125"
            value={permanentId}
            onChange={(e) => setPermanentId(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="mt-primary-btn">
          Look up forecasts
        </button>
      </form>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      {forecasts && forecasts.length === 0 && (
        <div className="mt-empty-state mt-table-panel">
          <div className="mt-empty-state__icon">⌁</div>
          <h3>No forecasts recorded</h3>
          <p>No forecast records exist for this product yet.</p>
        </div>
      )}

      {forecasts && forecasts.length > 0 && (
        <section className="mt-table-panel">
          <div className="mt-panel-heading">
            <div>
              <h3>Forecast records</h3>
              <span>Prediction horizon, risk and suggested restock.</span>
            </div>
            <span className="mt-count-pill">
              {forecasts.length} records
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Horizon</th>
                <th className="text-right">Predicted</th>
                <th className="text-right">Stockout risk</th>
                <th className="text-right">Recommended restock</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f, idx) => {
                const risk = Number(f.stockout_risk || 0) * 100;

                return (
                  <tr key={idx}>
                    <td className="mt-mono">{f.forecast_type}</td>
                    <td>{f.horizon_days}d</td>
                    <td className="text-right mt-mono">
                      {f.predicted_value}
                    </td>
                    <td className="text-right">
                      <span
                        className={`mt-status-pill ${
                          risk >= 70
                            ? "mt-status-pill--danger"
                            : risk >= 40
                            ? "mt-status-pill--warning"
                            : "mt-status-pill--success"
                        }`}
                      >
                        {risk.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-right mt-mono">
                      {f.recommended_restock}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </Layout>
  );
}
