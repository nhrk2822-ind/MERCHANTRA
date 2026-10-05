import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

const STATUS_CLASS = {
  CREATED: "neutral",
  PACKING: "warning",
  PACKED: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.orders.list().then(setOrders).catch((e) => setError(e.message));
  }, []);

  const delivered = useMemo(
    () => orders.filter((o) => o.status === "DELIVERED").length,
    [orders]
  );

  const open = useMemo(
    () =>
      orders.filter(
        (o) => !["DELIVERED", "CANCELLED", "RETURNED"].includes(o.status)
      ).length,
    [orders]
  );

  const revenue = orders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );

  return (
    <Layout title="Orders">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Order operations</div>
          <h2 className="mt-page-heading">Orders</h2>
          <p className="mt-page-description">
            Monitor fulfillment state, totals and recent commerce activity.
          </p>
        </div>
      </div>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      <div className="mt-mini-stats mt-mini-stats--3">
        <div className="mt-mini-stat">
          <span>Total orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="mt-mini-stat">
          <span>Open orders</span>
          <strong>{open}</strong>
        </div>
        <div className="mt-mini-stat">
          <span>Delivered</span>
          <strong>{delivered}</strong>
        </div>
      </div>

      <div className="mt-table-panel">
        <div className="mt-panel-heading">
          <div>
            <h3>Order ledger</h3>
            <span>
              Total recorded value: ₹{revenue.toLocaleString("en-IN")}
            </span>
          </div>
          <span className="mt-count-pill">{orders.length} records</span>
        </div>

        {orders.length === 0 ? (
          <div className="mt-empty-state">
            <div className="mt-empty-state__icon">◫</div>
            <h3>No orders yet</h3>
            <p>Recorded orders will appear here once commerce activity arrives.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order number</th>
                <th>Status</th>
                <th className="text-right">Total</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="mt-mono mt-strong">
                    {order.order_number}
                  </td>
                  <td>
                    <span
                      className={`mt-status-pill mt-status-pill--${
                        STATUS_CLASS[order.status] || "neutral"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="text-right mt-mono">
                    ₹{Number(order.total_amount).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString(
                          "en-IN"
                        )
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
