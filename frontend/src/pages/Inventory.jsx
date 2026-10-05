import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState(null);
  const [delta, setDelta] = useState("");

  function load() {
    api.inventory.list().then(setItems).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function submitAdjust(productId) {
    setError("");

    try {
      await api.inventory.adjust({
        product_id: productId,
        delta: Number(delta),
        reason: "manual adjustment",
      });

      setAdjusting(null);
      setDelta("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const lowStockCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.quantity_available <= item.low_stock_threshold
      ).length,
    [items]
  );

  const totalAvailable = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.quantity_available || 0),
        0
      ),
    [items]
  );

  return (
    <Layout title="Inventory">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Stock control</div>
          <h2 className="mt-page-heading">Inventory</h2>
          <p className="mt-page-description">
            Track stock across product records, locations and reservations.
          </p>
        </div>
      </div>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      <div className="mt-mini-stats mt-mini-stats--3">
        <div className="mt-mini-stat">
          <span>Inventory lines</span>
          <strong>{items.length}</strong>
        </div>
        <div className="mt-mini-stat">
          <span>Total available</span>
          <strong>{totalAvailable.toLocaleString("en-IN")}</strong>
        </div>
        <div className="mt-mini-stat mt-mini-stat--warning">
          <span>Low stock</span>
          <strong>{lowStockCount}</strong>
        </div>
      </div>

      <div className="mt-table-panel">
        <div className="mt-panel-heading">
          <div>
            <h3>Stock ledger</h3>
            <span>Use Adjust only for controlled manual corrections.</span>
          </div>
          <span className="mt-count-pill">{items.length} lines</span>
        </div>

        {items.length === 0 ? (
          <div className="mt-empty-state">
            <div className="mt-empty-state__icon">◫</div>
            <h3>No inventory records</h3>
            <p>Inventory data will appear here once product stock is recorded.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Location</th>
                <th className="text-right">On hand</th>
                <th className="text-right">Reserved</th>
                <th className="text-right">Available</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow =
                  item.quantity_available <= item.low_stock_threshold;

                return (
                  <tr key={item.product_id}>
                    <td className="mt-mono">
                      {item.permanent_product_id}
                    </td>
                    <td>{item.warehouse_location || "—"}</td>
                    <td className="text-right mt-mono">
                      {item.quantity_on_hand}
                    </td>
                    <td className="text-right mt-mono">
                      {item.quantity_reserved}
                    </td>
                    <td className="text-right">
                      <span
                        className={
                          isLow
                            ? "mt-status-pill mt-status-pill--warning"
                            : "mt-status-pill mt-status-pill--success"
                        }
                      >
                        {item.quantity_available}
                      </span>
                    </td>
                    <td className="text-right">
                      {adjusting === item.product_id ? (
                        <span className="mt-inline-control">
                          <input
                            autoFocus
                            type="number"
                            value={delta}
                            onChange={(e) => setDelta(e.target.value)}
                            className="mt-small-input"
                          />
                          <button
                            onClick={() =>
                              submitAdjust(item.product_id)
                            }
                            className="mt-small-btn"
                          >
                            Save
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            setAdjusting(item.product_id)
                          }
                          className="mt-text-btn"
                        >
                          Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
