import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", sku: "" });

  function loadProducts() {
    api.products.list().then(setProducts).catch((e) => setError(e.message));
  }

  useEffect(loadProducts, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.products.create(form);
      setForm({ name: "", category: "", sku: "" });
      setShowForm(false);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Products">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-text-muted">{products.length} products</span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-signal-amber text-ink px-3 py-1.5 rounded-sm font-medium"
        >
          {showForm ? "Cancel" : "New Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-line rounded p-4 mb-6 flex gap-3">
          <input
            placeholder="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-panel border border-line rounded-sm px-3 py-2 text-sm flex-1"
          />
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-panel border border-line rounded-sm px-3 py-2 text-sm flex-1"
          />
          <input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="bg-panel border border-line rounded-sm px-3 py-2 text-sm flex-1"
          />
          <button type="submit" className="bg-signal-amber text-ink px-4 rounded-sm text-sm font-medium">
            Create
          </button>
        </form>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-muted border-b border-line">
            <th className="py-2 font-normal">Permanent ID</th>
            <th className="py-2 font-normal">Name</th>
            <th className="py-2 font-normal">Category</th>
            <th className="py-2 font-normal">SKU</th>
            <th className="py-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-line hover:bg-panel/50">
              <td className="py-2">
                <Link to={`/products/${p.permanent_product_id}`} className="font-mono text-signal-amber">
                  {p.permanent_product_id}
                </Link>
              </td>
              <td className="py-2">{p.name}</td>
              <td className="py-2 text-text-muted">{p.category}</td>
              <td className="py-2 text-text-muted font-mono">{p.sku}</td>
              <td className="py-2 text-text-muted">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}