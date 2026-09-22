import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

const STATUS_TONE = {
  CREATED: "text-text-muted",
  PACKING: "text-status-review",
  PACKED: "text-status-review",
  SHIPPED: "text-signal-amber",
  DELIVERED: "text-status-pass",
  CANCELLED: "text-status-fail",
  RETURNED: "text-status-fail",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.orders.list().then(setOrders).catch((e) => setError(e.message));
  }, []);

  return (
    <Layout title="Orders">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-muted border-b border-line">
            <th className="py-2 font-normal">Order #</th>
            <th className="py-2 font-normal">Status</th>
            <th className="py-2 font-normal text-right">Total</th>
            <th className="py-2 font-normal">Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-line hover:bg-panel/50">
              <td className="py-2">
                <Link to={`/orders/${order.id}`} className="font-mono text-signal-amber">
                  {order.order_number}
                </Link>
              </td>
              <td className={`py-2 font-mono text-xs ${STATUS_TONE[order.status] || ""}`}>
                {order.status}
              </td>
              <td className="py-2 text-right font-mono">
                ₹{Number(order.total_amount).toLocaleString("en-IN")}
              </td>
              <td className="py-2 text-text-muted">
                {new Date(order.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}