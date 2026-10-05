import React, { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

const STATUS_CLASS = {
  PASS: "success",
  FAIL: "danger",
  REVIEW: "warning",
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
  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    api.station.status().then(setStatus).catch((e) => setError(e.message));

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
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Physical verification</div>
          <h2 className="mt-page-heading">Smart Station</h2>
          <p className="mt-page-description">
            Verify product identity, quantity and station events in real time.
          </p>
        </div>
      </div>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      {status && (
        <div className="mt-station-status">
          <div className="mt-station-status__title">
            Station health
          </div>

          <div className="mt-station-status__items">
            {[
              ["Mode", status.mode],
              ["Scanner", status.scanner],
              ["Camera", status.camera],
              ["Printer", status.printer],
            ].map(([label, value]) => (
              <div key={label} className="mt-station-chip">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-station-grid">
        <form onSubmit={handleVerify} className="mt-form-panel mt-form-panel--plain">
          <div className="mt-panel-heading">
            <div>
              <h3>Run verification</h3>
              <span>Send a station verification request to the backend.</span>
            </div>
            <span className="mt-live-pill">LIVE</span>
          </div>

          <div className="mt-form-grid">
            {[
              ["order_item_id", "Order item ID"],
              ["permanent_product_id", "Permanent product ID"],
              ["expected_barcode", "Expected barcode"],
              ["scanned_quantity", "Scanned quantity"],
              ["expected_quantity", "Expected quantity"],
              ["expected_category", "Expected category"],
            ].map(([key, label]) => (
              <label key={key} className="mt-field">
                <span>{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]: e.target.value,
                    })
                  }
                  required
                />
              </label>
            ))}
          </div>

          <div className="mt-form-actions">
            <button type="submit" className="mt-primary-btn">
              Verify product
            </button>
          </div>

          {result && (
            <div className="mt-verification-result">
              <div
                className={`mt-verification-result__status mt-status-pill mt-status-pill--${
                  STATUS_CLASS[result.status] || "neutral"
                }`}
              >
                {result.status}
              </div>

              <div className="mt-verification-result__grid">
                <div>
                  <span>Barcode match</span>
                  <strong>{String(result.barcode_match)}</strong>
                </div>
                <div>
                  <span>Quantity match</span>
                  <strong>{String(result.quantity_match)}</strong>
                </div>
                <div>
                  <span>AI confidence</span>
                  <strong>{result.ai_confidence}</strong>
                </div>
              </div>
            </div>
          )}
        </form>

        <section className="mt-feed-panel">
          <div className="mt-panel-heading">
            <div>
              <h3>Live station feed</h3>
              <span>Latest websocket events.</span>
            </div>
            <span className="mt-live-pill">STREAM</span>
          </div>

          {events.length === 0 ? (
            <div className="mt-empty-state mt-empty-state--compact">
              <div className="mt-empty-state__icon">⌁</div>
              <h3>Waiting for station activity</h3>
              <p>Live scan events will appear here.</p>
            </div>
          ) : (
            <ul className="mt-feed-list">
              {events.map((event, idx) => (
                <li key={idx} className="mt-feed-row">
                  <div>
                    <div className="mt-mono mt-strong">
                      {event.permanent_product_id || "Unknown product"}
                    </div>
                    <div className="mt-feed-time">
                      Station event
                    </div>
                  </div>
                  <span
                    className={`mt-status-pill mt-status-pill--${
                      STATUS_CLASS[event.status] || "neutral"
                    }`}
                  >
                    {event.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
