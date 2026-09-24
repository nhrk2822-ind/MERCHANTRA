import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Inventory from "./pages/Inventory.jsx";
import Orders from "./pages/Orders.jsx";
import SmartStation from "./pages/SmartStation.jsx";
import Returns from "./pages/Returns.jsx";
import AIIntelligence from "./pages/AIIntelligence.jsx";
import Advertising from "./pages/Advertising.jsx";
import Forecasting from "./pages/Forecasting.jsx";
import Analytics from "./pages/Analytics.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
      <Route path="/products/:permanentId" element={<RequireAuth><ProductDetail /></RequireAuth>} />
      <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
      <Route path="/station" element={<RequireAuth><SmartStation /></RequireAuth>} />
      <Route path="/returns" element={<RequireAuth><Returns /></RequireAuth>} />
      <Route path="/ai" element={<RequireAuth><AIIntelligence /></RequireAuth>} />
      <Route path="/advertising" element={<RequireAuth><Advertising /></RequireAuth>} />
      <Route path="/forecasting" element={<RequireAuth><Forecasting /></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
      <Route
        path="/audit-logs"
        element={
          <RequireAuth roles={["ADMIN", "ANALYST"]}>
            <AuditLogs />
          </RequireAuth>
        }
      />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

      {/* Unknown paths fall back to the dashboard (which itself
          redirects to /login if not authenticated). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}