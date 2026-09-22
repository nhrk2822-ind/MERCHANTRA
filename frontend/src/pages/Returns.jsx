import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

const DECISIONS = ["RESTOCK", "DAMAGED_WRITE_OFF", "FLAG_FOR_REVIEW"];

export default function Returns() {
  const [step, setStep] = useState("create"); // create -> receive -> inspect
  const [returnId, setReturnId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [createForm, setCreateForm] = useState({
    order_item_id: "",
    permanent_product_id: "",
    reason: "",
  });

  const [inspectForm, setInspectForm] = useState({
    inspector_id: "",
    condition_notes: "",
    decision: "RESTOCK",
  });

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.returns.create({
        order_item_id: Number(createForm.order_item_id),
        permanent_product_id: createForm.permanent_product_id,
        reason: createForm.reason,
      });
      setReturnId(res.id);
      setMessage(`Return #${res.id} requested.`);
      setStep("receive");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReceive() {
    setError("");
    try {
      await api.returns.receive(returnId);
      setMessage(`Return #${returnId} marked received — AI risk assessment triggered.`);
      setStep("inspect");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleInspect(e) {
    e.preventDefault();
    setError("");
    try {
      await api.returns.inspect(returnId, inspectForm);
      setMessage(`Return #${returnId} inspected — decision: ${inspectForm.decision}.`);
      setStep("done");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Returns">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}
      {message && <div className="mb-4 text-status-pass text-sm">{message}</div>}

      <div className="max-w-lg border border-line rounded p-4">
        {step === "create" && (
          <form onSubmit={handleCreate} className="space-y-3">
            <h2 className="text-sm font-medium mb-2">1. Request Return</h2>
            <input
              placeholder="Order Item ID"
              required
              value={createForm.order_item_id}
              onChange={(e) => setCreateForm({ ...createForm, order_item_id: e.target.value })}
              className="w-full bg-panel border border-line rounded-sm px-3 py-2 text-sm"
            />
            <input
              placeholder="Permanent Product ID"
              required
              value={createForm.permanent_product_id}
              onChange={(e) => setCreateForm({ ...createForm, permanent_product_id: e.target.value })}
              className="w-full bg-panel border border-line rounded-sm px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Reason"
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              className="w-full bg-panel border border-line rounded-sm px-3 py-2 text-sm"
            />
            <button type="submit" className="w-full bg-signal-amber text-ink font-medium rounded-sm py-2 text-sm">
              Request Return
            </button>
          </form>
        )}

        {step === "receive" && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium mb-2">2. Mark Received</h2>
            <p className="text-text-muted text-sm">
              Confirms the item physically arrived at the warehouse and triggers the AI return-risk assessment.
            </p>
            <button
              onClick={handleReceive}
              className="w-full bg-signal-amber text-ink font-medium rounded-sm py-2 text-sm"
            >
              Mark Received
            </button>
          </div>
        )}

        {step === "inspect" && (
          <form onSubmit={handleInspect} className="space-y-3">
            <h2 className="text-sm font-medium mb-2">3. Inspect &amp; Decide</h2>
            <input
              placeholder="Inspector User ID"
              required
              value={inspectForm.inspector_id}
              onChange={(e) => setInspectForm({ ...inspectForm, inspector_id: e.target.value })}
              className="w-full bg-panel border border-line rounded-sm px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Condition notes"
              value={inspectForm.condition_notes}
              onChange={(e) => setInspectForm({ ...inspectForm, condition_notes: e.target.value })}
              className="w-full bg-panel border border-line rounded-sm px-3 py-2 text-sm"
            />
            <select
              value={inspectForm.decision}
              onChange={(e) => setInspectForm({ ...inspectForm, decision: e.target.value })}
              className="w-full bg-panel border border-line rounded-sm px-3 py-2 text-sm"
            >
              {DECISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted">
              This decision is yours to make — the AI risk score is context, not an auto-decision.
            </p>
            <button type="submit" className="w-full bg-signal-amber text-ink font-medium rounded-sm py-2 text-sm">
              Submit Inspection
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="text-sm text-status-pass">Return #{returnId} closed out.</div>
        )}
      </div>
    </Layout>
  );
}