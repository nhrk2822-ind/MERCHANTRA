import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

// No dedicated /analytics endpoint exists yet — this aggregates what
// GET /orders and GET /inventory already return, client-side. If this
// grows beyond a couple of simple rollups, it should move to a real
// backend aggregation endpoint instead of pulling full lists here.
export default function Analytics() {
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.orders
      .list()
      .then((orders) => {
        const counts = {};
        orders.forEach((o) => {
          counts[o.status] = (counts[o.status] || 0) + 1;
        });
        setOrdersByStatus(
          Object.entries(counts).map(([status, count]) => ({ status, count }))
        );
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Layout title="Analytics">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}

      <div className="border border-line rounded p-4">
        <h2 className="text-sm font-medium mb-4">Orders by Status</h2>
        {ordersByStatus.length === 0 ? (
          <p className="text-text-muted text-sm">No order data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ordersByStatus}>
              <CartesianGrid stroke="#3E4A5C" strokeDasharray="3 3" />
              <XAxis dataKey="status" stroke="#8D97A6" fontSize={12} />
              <YAxis stroke="#8D97A6" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1C222B", border: "1px solid #3E4A5C" }}
                labelStyle={{ color: "#EDEFF2" }}
              />
              <Bar dataKey="count" fill="#E8A23D" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-xs text-text-muted mt-4">
        Marketplace performance, top products, and demand-forecast charts
        will be added here once there's real data flowing through
        marketplace sync and the forecasting pipeline.
      </p>
    </Layout>
  );
}