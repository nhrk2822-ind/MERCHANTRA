import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function Analytics() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.orders
      .list()
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  const ordersByStatus = useMemo(() => {
    const counts = {};

    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [orders]);

  const totalValue = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const delivered = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  return (
    <Layout title="Analytics">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Commerce intelligence</div>
          <h2 className="mt-page-heading">Analytics</h2>
          <p className="mt-page-description">
            A lightweight operational view built from the existing order feed.
          </p>
        </div>
      </div>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      <div className="mt-mini-stats mt-mini-stats--3">
        <div className="mt-mini-stat">
          <span>Orders analysed</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="mt-mini-stat">
          <span>Delivered</span>
          <strong>{delivered}</strong>
        </div>
        <div className="mt-mini-stat">
          <span>Recorded value</span>
          <strong>₹{totalValue.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <section className="mt-chart-panel">
        <div className="mt-panel-heading">
          <div>
            <h3>Orders by status</h3>
            <span>Aggregated client-side from GET /orders.</span>
          </div>
        </div>

        {ordersByStatus.length === 0 ? (
          <div className="mt-empty-state">
            <div className="mt-empty-state__icon">↗</div>
            <h3>No order data yet</h3>
            <p>The chart will populate when order records are available.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={ordersByStatus}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                stroke="#e5eaed"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="status"
                stroke="#8b99a3"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#8b99a3"
                fontSize={10}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #dfe5e8",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(25,56,83,.08)",
                  color: "#243b4f",
                }}
              />

              <Bar
                dataKey="count"
                fill="#315d7d"
                radius={[7, 7, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="mt-info-strip">
        <span>Next analytics layer</span>
        <div>
          <span>Marketplace performance</span>
          <span>Top products</span>
          <span>Demand trend</span>
          <span>Campaign efficiency</span>
        </div>
      </div>
    </Layout>
  );
}
