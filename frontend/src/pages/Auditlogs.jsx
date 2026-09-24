import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only ADMIN/ANALYST can actually load this — the backend's
    // AuditController enforces that via RbacUtils, so anyone else
    // will see the 403 message surface here.
    api.audit.list().then(setLogs).catch((e) => setError(e.message));
  }, []);

  return (
    <Layout title="Audit Logs">
      {error && <div className="mb-4 text-status-fail text-sm">{error}</div>}

      {logs.length === 0 && !error && (
        <p className="text-text-muted text-sm">No audit entries yet.</p>
      )}

      {logs.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted border-b border-line">
              <th className="py-2 font-normal">User</th>
              <th className="py-2 font-normal">Action</th>
              <th className="py-2 font-normal">Resource</th>
              <th className="py-2 font-normal">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-line">
                <td className="py-2">{log.user}</td>
                <td className="py-2 font-mono">{log.action}</td>
                <td className="py-2 text-text-muted">{log.resource_type}</td>
                <td className="py-2 text-text-muted">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}