import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState(null); // product_id currently being adjusted
  const [delta, setDelta] = useState("");

  function load() {
    api.inventory.list().then(setItems).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function submitAdjust(productId) {
    try {
      await api.inventory.adjust({ product_id: productId, delta: Number(delta), reason: "manual adjustment" });
      setAdjusting(null);
      setDelta("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Inventory">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-muted border-b border-line">
            <th className="py-2 font-normal">Product</th>
            <th className="py-2 font-normal">Location</th>
            <th className="py-2 font-normal text-right">On Hand</th>
            <th className="py-2 font-normal text-right">Reserved</th>
            <th className="py-2 font-normal text-right">Available</th>
            <th className="py-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.product_id} className="border-b border-line hover:bg-panel/50">
              <td className="py-2 font-mono">{item.permanent_product_id}</td>
              <td className="py-2 text-text-muted">{item.warehouse_location}</td>
              <td className="py-2 text-right font-mono">{item.quantity_on_hand}</td>
              <td className="py-2 text-right font-mono">{item.quantity_reserved}</td>
              <td
                className={`py-2 text-right font-mono ${
                  item.quantity_available <= item.low_stock_threshold ? "text-status-review" : ""
                }`}
              >
                {item.quantity_available}
              </td>
              <td className="py-2 text-right">
                {adjusting === item.product_id ? (
                  <span className="inline-flex gap-1">
                    <input
                      autoFocus
                      type="number"
                      value={delta}
                      onChange={(e) => setDelta(e.target.value)}
                      className="w-16 bg-panel border border-line rounded-sm px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() => submitAdjust(item.product_id)}
                      className="text-xs bg-signal-amber text-ink px-2 rounded-sm"
                    >
                      Save
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setAdjusting(item.product_id)}
                    className="text-xs text-text-muted hover:text-text"
                  >
                    Adjust
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}