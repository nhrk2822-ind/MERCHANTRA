import React from "react";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Settings() {
  const { user } = useAuth();

  return (
    <Layout title="Settings">
      <div className="mt-page-intro">
        <div>
          <div className="mt-page-kicker">Workspace configuration</div>
          <h2 className="mt-page-heading">Settings</h2>
          <p className="mt-page-description">
            Account information and the future home for marketplace and station
            configuration.
          </p>
        </div>
      </div>

      <div className="mt-settings-grid">
        <section className="mt-account-card">
          <div className="mt-account-card__header">
            <div>
              <div className="mt-page-kicker">Current session</div>
              <h3>Account</h3>
            </div>

            <div className="mt-account-avatar">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>

          {user ? (
            <dl className="mt-account-list">
              <div>
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd className="mt-mono">{user.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>
                  <span className="mt-status-pill mt-status-pill--info">
                    {user.role}
                  </span>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-empty-copy">Not signed in.</p>
          )}
        </section>

        <section className="mt-settings-card">
          <div className="mt-panel-heading">
            <div>
              <h3>Configuration modules</h3>
              <span>Planned homes for the next product layers.</span>
            </div>
          </div>

          <div className="mt-settings-list">
            {[
              ["Marketplace connections", "Sync and connection settings"],
              ["Smart Station", "Scanner, camera and station preferences"],
              ["Notifications", "Operational alerts and preferences"],
              ["Access control", "Roles and workspace permissions"],
            ].map(([title, description]) => (
              <div className="mt-settings-row" key={title}>
                <div>
                  <div className="mt-strong">{title}</div>
                  <div className="mt-settings-row__description">
                    {description}
                  </div>
                </div>

                <span className="mt-status-pill mt-status-pill--neutral">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
