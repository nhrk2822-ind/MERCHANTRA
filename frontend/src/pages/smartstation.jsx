import React, { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

const STATUS_TONE = {
  PASS: "text-status-pass",
  FAIL: "text-status-fail",
  REVIEW: "text-status-review",
};

export default function SmartStation() {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    order_item_id: "",
    permanent_product_id: "",
    expected_barcode: "",
    scanned_quantity: "",
    expected_quantity: "",
    expected_category: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]); // live feed from the WebSocket
  const wsRef = useRef(null);

  useEffect(() => {
    api.station.status().then(setStatus).catch((e) => setError(e.message));

    // Live station feed — see backend/src/ws/StationStatusHub.
    const token = localStorage.getItem("merchantra_token");
    const wsUrl = `${window.location.origin.replace(/^http/, "ws")}/ws/station?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        setEvents((prev) => [data, ...prev].slice(0, 20));
      } catch {
        // ignore malformed frames
      }
    };

    return () => ws.close();
  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    try {
      const outcome = await api.station.verify({
        order_item_id: Number(form.order_item_id),
        permanent_product_id: form.permanent_product_id,
        expected_barcode: form.expected_barcode,
        scanned_quantity: Number(form.scanned_quantity),
        expected_quantity: Number(form.expected_quantity),
        expected_category: form.expected_category,
      });
      setResult(outcome);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Smart Station">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}

      {status && (
        <div className="flex gap-6 mb-6 text-xs font-mono">
          <span>Mode: {status.mode}</span>
          <span>Scanner: {status.scanner}</span>
          <span>Camera: {status.camera}</span>
          <span>Printer: {status.printer}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <form onSubmit={handleVerify} className="border border-line rounded p-4 space-y-3">
          <h2 className="text-sm font-medium mb-2">Run Verification</h2>
          {[
            ["order_item_id", "Order Item ID"],
            ["permanent_product_id", "Permanent Product ID"],
            ["expected_barcode", "Expected Barcode"],
            ["scanned_quantity", "Scanned Quantity"],
            ["expected_quantity", "Expected Quantity"],
            ["expected_category", "Expected Category"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-text-muted mb-1">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
                className="w-full bg-panel border border-line rounded-sm px-3 py-2 text-sm"
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-signal-amber text-ink font-medium rounded-sm py-2 text-sm"
          >
            Verify
          </button>

          {result && (
            <div className="mt-3 border-t border-line pt-3 text-sm">
              <div className={`font-mono font-semibold ${STATUS_TONE[result.status]}`}>
                {result.status}
              </div>
              <div className="text-xs text-text-muted mt-1">
                Barcode match: {String(result.barcode_match)} · Quantity match: {String(result.quantity_match)}
              </div>
              <div className="text-xs text-text-muted">
                AI confidence: {result.ai_confidence}
              </div>
            </div>
          )}
        </form>

        <div className="border border-line rounded p-4">
          <h2 className="text-sm font-medium mb-2">Live Feed</h2>
          {events.length === 0 ? (
            <p className="text-text-muted text-sm">Waiting for station activity...</p>
          ) : (
            <ul className="space-y-2">
              {events.map((event, idx) => (
                <li key={idx} className="text-sm flex justify-between font-mono">
                  <span>{event.permanent_product_id}</span>
                  <span className={STATUS_TONE[event.status] || ""}>{event.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}