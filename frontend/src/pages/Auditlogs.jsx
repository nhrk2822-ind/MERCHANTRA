import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.audit
      .list()
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Layout title="Audit Logs">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Governance & traceability</div>
          <h2 className="mt-page-heading">Audit Logs</h2>
          <p className="mt-page-description">
            Review recorded actions against the MERCHANTRA audit trail.
          </p>
        </div>
        <span className="mt-feature-pill">ADMIN / ANALYST</span>
      </div>

      {error && <div className="mt-alert mt-alert--error">{error}</div>}

      {logs.length === 0 && !error ? (
        <div className="mt-empty-state mt-table-panel">
          <div className="mt-empty-state__icon">⌁</div>
          <h3>No audit entries yet</h3>
          <p>
            Audit events will appear here as protected operations are recorded.
          </p>
        </div>
      ) : logs.length > 0 ? (
        <section className="mt-table-panel">
          <div className="mt-panel-heading">
            <div>
              <h3>Audit trail</h3>
              <span>Backend-enforced records.</span>
            </div>
            <span className="mt-count-pill">{logs.length} entries</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="mt-strong">{log.user}</td>
                  <td className="mt-mono">{log.action}</td>
                  <td>{log.resource_type}</td>
                  <td>
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </Layout>
  );
}
