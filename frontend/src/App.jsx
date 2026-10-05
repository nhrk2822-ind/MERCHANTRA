import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth.jsx";

import Login from "./pages/login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Marketplaces from "./pages/Marketplaces.jsx";
import Products from "./pages/products.jsx";
import ProductDetail from "./pages/productdetail.jsx";
import Inventory from "./pages/Inventory.jsx";
import Orders from "./pages/Orders.jsx";
import SmartStation from "./pages/smartstation.jsx";
import Returns from "./pages/Returns.jsx";
import AIIntelligence from "./pages/Aiintelligence.jsx";
import Advertising from "./pages/Advertising.jsx";
import Forecasting from "./pages/Forecasting.jsx";
import Analytics from "./pages/Analytics.jsx";
import AuditLogs from "./pages/Auditlogs.jsx";
import Settings from "./pages/settings.jsx";

export default function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* DASHBOARD */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      {/* MARKETPLACES & APPS */}
      <Route
        path="/marketplaces"
        element={
          <RequireAuth>
            <Marketplaces />
          </RequireAuth>
        }
      />

      {/* PRODUCTS */}
      <Route
        path="/products"
        element={
          <RequireAuth>
            <Products />
          </RequireAuth>
        }
      />

      {/* PRODUCT DETAIL */}
      <Route
        path="/products/:permanentId"
        element={
          <RequireAuth>
            <ProductDetail />
          </RequireAuth>
        }
      />

      {/* INVENTORY */}
      <Route
        path="/inventory"
        element={
          <RequireAuth>
            <Inventory />
          </RequireAuth>
        }
      />

      {/* ORDERS */}
      <Route
        path="/orders"
        element={
          <RequireAuth>
            <Orders />
          </RequireAuth>
        }
      />

      {/* SMART STATION */}
      <Route
        path="/station"
        element={
          <RequireAuth>
            <SmartStation />
          </RequireAuth>
        }
      />

      {/* RETURNS */}
      <Route
        path="/returns"
        element={
          <RequireAuth>
            <Returns />
          </RequireAuth>
        }
      />

      {/* AI INTELLIGENCE */}
      <Route
        path="/ai"
        element={
          <RequireAuth>
            <AIIntelligence />
          </RequireAuth>
        }
      />

      {/* ADVERTISING */}
      <Route
        path="/advertising"
        element={
          <RequireAuth>
            <Advertising />
          </RequireAuth>
        }
      />

      {/* FORECASTING */}
      <Route
        path="/forecasting"
        element={
          <RequireAuth>
            <Forecasting />
          </RequireAuth>
        }
      />

      {/* ANALYTICS */}
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <Analytics />
          </RequireAuth>
        }
      />

      {/* AUDIT LOGS */}
      <Route
        path="/audit-logs"
        element={
          <RequireAuth roles={["ADMIN", "ANALYST"]}>
            <AuditLogs />
          </RequireAuth>
        }
      />

      {/* SETTINGS */}
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />

      {/* UNKNOWN ROUTES */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}