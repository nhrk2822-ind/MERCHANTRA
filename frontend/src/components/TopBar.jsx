import React from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TopBar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="mt-topbar">
      <div className="mt-topbar__left">
        <div className="mt-topbar__eyebrow">MERCHANTRA WORKSPACE</div>
        <h1 className="mt-topbar__title">{title}</h1>
      </div>

      <div className="mt-topbar__right">
        <div className="mt-topbar__status">
          <span className="mt-topbar__status-dot" />
          Connected
        </div>

        {user && (
          <div className="mt-user-chip">
            <div className="mt-user-avatar">
              {(user.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="mt-user-copy">
              <div className="mt-user-name">{user.name}</div>
              <div className="mt-user-role">{user.role}</div>
            </div>
          </div>
        )}

        <button onClick={logout} className="mt-signout">
          Sign out
        </button>
      </div>
    </header>
  );
}
