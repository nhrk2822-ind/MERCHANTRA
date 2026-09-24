import React from "react";
import { NavLink } from "react-router-dom";

const SECTIONS = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Dashboard" },
      { to: "/products", label: "Products" },
      { to: "/inventory", label: "Inventory" },
      { to: "/orders", label: "Orders" },
      { to: "/station", label: "Smart Station" },
      { to: "/returns", label: "Returns" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/ai", label: "AI Intelligence" },
      { to: "/advertising", label: "Advertising" },
      { to: "/forecasting", label: "Forecasting" },
      { to: "/analytics", label: "Analytics" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/audit-logs", label: "Audit Logs" },
      { to: "/settings", label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-line bg-ink flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-line">
        <span className="font-mono text-sm tracking-tight text-signal-amber">
          MCH
        </span>
        <span className="ml-2 font-semibold">MERCHANTRA</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-6 px-3">
            <div className="px-2 mb-1 text-xs text-text-muted">
              {section.label}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `block px-2 py-1.5 text-sm rounded-sm mb-0.5 ${
                    isActive
                      ? "bg-panel text-text border-l-2 border-signal-amber pl-[6px]"
                      : "text-text-muted hover:text-text hover:bg-panel/60"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}