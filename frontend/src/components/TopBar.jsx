import React from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TopBar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-line flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-medium">{title}</h1>
      <div className="flex items-center gap-4">
        {user && (
          <span className="font-mono text-xs text-text-muted">
            {user.name} · {user.role}
          </span>
        )}
        <button
          onClick={logout}
          className="text-xs text-text-muted hover:text-text"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}