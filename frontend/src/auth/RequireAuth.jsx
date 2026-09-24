import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

// Wrap any <Route> element to require a logged-in user.
// Pass roles={["ADMIN","WAREHOUSE_MANAGER"]} to also enforce RBAC client-side
// (the C++ backend is still the real authority on every request).
export function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-8 text-text-muted">
        You don&apos;t have access to this section.
      </div>
    );
  }

  return children;
}