import React from "react";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Settings() {
  const { user } = useAuth();

  return (
    <Layout title="Settings">
      <div className="max-w-md border border-line rounded p-4">
        <h2 className="text-sm font-medium mb-3">Account</h2>
        {user ? (
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-text-muted">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Email</dt>
              <dd className="font-mono">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Role</dt>
              <dd className="font-mono">{user.role}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-text-muted text-sm">Not signed in.</p>
        )}
      </div>

      <p className="text-xs text-text-muted mt-6">
        Marketplace connections, station configuration, and notification
        preferences will live here as those features are built out.
      </p>
    </Layout>
  );
}