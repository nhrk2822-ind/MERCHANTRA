import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";
import MerchantraLogo from "../components/MerchantraLogo.jsx";
import FloatingBackground from "../components/Floating.jsx";

import "./Login.css";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();

  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(cleanEmail, password);

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please check your email and password.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <FloatingBackground />

      <section className="login__stage">
        <div className="login__halo" />

        <MerchantraLogo />

        <div className="login__content">
          <h1>Welcome back</h1>

          <p className="login__subtitle">
            Sign in to continue to your workspace.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              disabled={submitting}
            />

            <label htmlFor="password">
              Password
            </label>

            <div
              style={{
                position: "relative",
                width: "100%",
              }}
            >
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={submitting}
                style={{
                  paddingRight: "48px",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={submitting}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                style={{
                  position: "absolute",
                  right: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "30px",
                  height: "30px",
                  padding: 0,
                  margin: 0,
                  border: 0,
                  outline: "none",
                  background: "transparent",
                  boxShadow: "none",
                  color: "#667b8c",
                  cursor: submitting
                    ? "not-allowed"
                    : "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 3l18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <path
                      d="M10.6 10.7a2 2 0 0 0 2.8 2.8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <path
                      d="M9.9 5.1A10.6 10.6 0 0 1 12 4.9c5.2 0 8.8 4.1 10 7.1-.4 1-1.2 2.2-2.2 3.3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M6.1 6.1C4.3 7.2 3 9 2 12c1.2 3 4.8 7.1 10 7.1 1.7 0 3.2-.4 4.5-1"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />

                    <circle
                      cx="12"
                      cy="12"
                      r="2.7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div
                className="login__error"
                role="alert"
                style={{
                  marginTop: "11px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={
                submitting
                  ? {
                      opacity: 0.72,
                      cursor: "wait",
                    }
                  : undefined
              }
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}