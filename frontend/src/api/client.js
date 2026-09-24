// Single HTTP client for the C++ core backend.
// The frontend must never call the Python AI service directly — every
// AI-derived value (forecasts, risk scores, ROI) is served back to us
// through the C++ backend's own endpoints, already persisted in Postgres.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function getToken() {
  return localStorage.getItem("merchantra_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  auth: {
    login: (email, password) =>
      request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
    register: (name, email, password, role) =>
      request("/auth/register", { method: "POST", body: { name, email, password, role }, auth: false }),
    me: () => request("/auth/me"),
  },
  products: {
    list: (params = "") => request(`/products${params}`),
    get: (permanentId) => request(`/products/${permanentId}`),
    timeline: (permanentId) => request(`/products/${permanentId}/timeline`),
    create: (payload) => request("/products", { method: "POST", body: payload }),
    update: (permanentId, payload) =>
      request(`/products/${permanentId}`, { method: "PATCH", body: payload }),
  },
  inventory: {
    list: () => request("/inventory"),
    lowStock: () => request("/inventory/low-stock"),
    adjust: (payload) => request("/inventory/adjust", { method: "POST", body: payload }),
  },
  orders: {
    list: () => request("/orders"),
    get: (id) => request(`/orders/${id}`),
    create: (payload) => request("/orders", { method: "POST", body: payload }),
    updateStatus: (id, status) =>
      request(`/orders/${id}/status`, { method: "PATCH", body: { status } }),
  },
  station: {
    status: () => request("/station/status"),
    scan: (payload) => request("/station/scan", { method: "POST", body: payload }),
    verify: (payload) => request("/station/verify", { method: "POST", body: payload }),
    session: (id) => request(`/station/sessions/${id}`),
  },
  returns: {
    create: (payload) => request("/returns", { method: "POST", body: payload }),
    receive: (id) => request(`/returns/${id}/receive`, { method: "POST" }),
    inspect: (id, payload) => request(`/returns/${id}/inspect`, { method: "POST", body: payload }),
  },
  marketplaces: {
    list: () => request("/marketplaces"),
    sync: (id) => request(`/marketplaces/${id}/sync`, { method: "POST" }),
  },
  forecasts: {
    get: (permanentId) => request(`/forecasts/${permanentId}`),
  },
  advertising: {
    get: (permanentId) => request(`/advertising/${permanentId}`),
  },
  roi: {
    get: (permanentId) => request(`/roi/${permanentId}`),
  },
  restock: {
    list: () => request("/restock-recommendations"),
  },
  audit: {
    list: () => request("/audit-logs"),
  },
};