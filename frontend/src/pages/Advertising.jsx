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

  return (
    <Layout title="Advertising">
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

      {campaigns && (
        <div className="mb-8">
          <h2 className="text-sm font-medium mb-3">Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-text-muted text-sm">No campaigns for this product.</p>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li key={c.campaign_id} className="flex justify-between text-sm border-b border-line py-2">
                  <span className="font-mono">#{c.campaign_id}</span>
                  <span className="text-text-muted">{c.status}</span>
                  <span className="font-mono">₹{c.budget.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {roi && (
        <div>
          <h2 className="text-sm font-medium mb-3">ROI History</h2>
          {roi.length === 0 ? (
            <p className="text-text-muted text-sm">No ROI records for this product.</p>
          ) : (
            <table className="w-full text-sm max-w-2xl">
              <thead>
                <tr className="text-left text-text-muted border-b border-line">
                  <th className="py-2 font-normal">Period</th>
                  <th className="py-2 font-normal text-right">Cost</th>
                  <th className="py-2 font-normal text-right">Revenue</th>
                  <th className="py-2 font-normal text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {roi.map((r, idx) => (
                  <tr key={idx} className="border-b border-line">
                    <td className="py-2 font-mono">{r.period}</td>
                    <td className="py-2 text-right font-mono">₹{r.cost.toLocaleString("en-IN")}</td>
                    <td className="py-2 text-right font-mono">₹{r.revenue.toLocaleString("en-IN")}</td>
                    <td className="py-2 text-right font-mono text-status-pass">{r.roi}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  );
}