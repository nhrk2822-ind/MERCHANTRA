import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const redirectTo = location.state?.from?.pathname || "/";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-ink text-text">
      <form
        onSubmit={handleSubmit}
        className="w-80 border border-line rounded p-6"
      >
        <div className="mb-6">
          <span className="font-mono text-sm text-signal-amber">MCH</span>
          <span className="ml-2 font-semibold">MERCHANTRA</span>
        </div>

        <label className="block text-xs text-text-muted mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 bg-panel border border-line rounded-sm px-3 py-2 text-sm outline-none focus:border-signal-amber"
        />

        <label className="block text-xs text-text-muted mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 bg-panel border border-line rounded-sm px-3 py-2 text-sm outline-none focus:border-signal-amber"
        />

        {error && (
          <div className="text-status-fail text-xs mb-4">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-signal-amber text-ink font-medium rounded-sm py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}