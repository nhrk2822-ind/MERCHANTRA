import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import StatCard from "../components/StatCard.jsx";
import { api } from "../api/client.js";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.products.list(),
      api.inventory.list(),
      api.orders.list(),
      api.inventory.lowStock(),
    ])
      .then(([p, i, o, low]) => {
        setProducts(p);
        setInventory(i);
        setOrders(o);
        setLowStock(low);
      })
      .catch((err) => setError(err.message));
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <Layout title="Dashboard">
      {error && (
        <div className="mb-4 text-status-fail text-sm">
          Couldn&apos;t load dashboard data: {error}
        </div>
      )}

      <div className="flex divide-x divide-line border border-line rounded mb-8">
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Inventory Lines" value={inventory.length} />
        <StatCard label="Orders" value={orders.length} />
        <StatCard
          label="Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
        />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          tone={lowStock.length > 0 ? "review" : "default"}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section className="border border-line rounded p-4">
          <h2 className="text-sm font-medium mb-3">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-text-muted text-sm">Nothing below threshold.</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((item) => (
                <li
                  key={item.product_id}
                  className="flex justify-between text-sm font-mono"
                >
                  <span>{item.permanent_product_id}</span>
                  <span className="text-status-review">
                    {item.quantity_available} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-line rounded p-4">
          <h2 className="text-sm font-medium mb-3">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-text-muted text-sm">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {orders.slice(0, 6).map((order) => (
                <li key={order.id} className="flex justify-between text-sm">
                  <span className="font-mono">{order.order_number}</span>
                  <span className="text-text-muted">{order.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}