import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function Advertising() {
  const [permanentId, setPermanentId] = useState("");
  const [campaigns, setCampaigns] = useState(null);
  const [roi, setRoi] = useState(null);
  const [error, setError] = useState("");

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setCampaigns(null);
    setRoi(null);

    try {
      const [c, r] = await Promise.all([
        api.advertising.get(permanentId),
        api.roi.get(permanentId),
      ]);

      setCampaigns(c);
      setRoi(r);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalBudget =
    campaigns?.reduce(
      (sum, campaign) => sum + Number(campaign.budget || 0),
      0
    ) || 0;

  return (
    <Layout title="Advertising">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Marketplace growth</div>
          <h2 className="mt-page-heading">Advertising</h2>
          <p className="mt-page-description">
            Inspect campaign activity and product-level return on ad spend.
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
          Look up
        </button>
      </form>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      {campaigns && (
        <section className="mt-table-panel">
          <div className="mt-panel-heading">
            <div>
              <h3>Campaigns</h3>
              <span>
                Total listed budget: ₹{totalBudget.toLocaleString("en-IN")}
              </span>
            </div>
            <span className="mt-count-pill">
              {campaigns.length} campaigns
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div className="mt-empty-state">
              <h3>No campaigns for this product</h3>
              <p>Try another permanent product ID.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th className="text-right">Budget</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaign_id}>
                    <td className="mt-mono">#{c.campaign_id}</td>
                    <td>
                      <span className="mt-status-pill mt-status-pill--neutral">
                        {c.status}
                      </span>
                    </td>
                    <td className="text-right mt-mono">
                      ₹{Number(c.budget || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {roi && (
        <section className="mt-table-panel mt-panel-gap">
          <div className="mt-panel-heading">
            <div>
              <h3>ROI history</h3>
              <span>Historical cost, revenue and ROI returned by the backend.</span>
            </div>
            <span className="mt-count-pill">{roi.length} periods</span>
          </div>

          {roi.length === 0 ? (
            <div className="mt-empty-state">
              <h3>No ROI records</h3>
              <p>No ROI history is available for this product.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {roi.map((record, idx) => (
                  <tr key={idx}>
                    <td className="mt-mono">{record.period}</td>
                    <td className="text-right mt-mono">
                      ₹{Number(record.cost || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="text-right mt-mono">
                      ₹{Number(record.revenue || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="text-right">
                      <span className="mt-status-pill mt-status-pill--success">
                        {record.roi}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </Layout>
  );
}
