import React from "react";
import { NavLink } from "react-router-dom";
import MerchantraLogo from "./MerchantraLogo.jsx";

const SECTIONS = [
  {
    label: "OPERATIONS",
    items: [
      { to: "/", label: "Dashboard", icon: "⌂" },
      { to: "/products", label: "Products", icon: "◈" },
      { to: "/inventory", label: "Inventory", icon: "▦" },
      { to: "/orders", label: "Orders", icon: "↗" },
      { to: "/station", label: "Smart Station", icon: "⌁" },
      { to: "/returns", label: "Returns", icon: "↩" },
      {
        to: "/marketplaces",
        label: "Marketplaces & Apps",
        icon: "⊞",
      },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { to: "/ai", label: "AI Intelligence", icon: "✦" },
      { to: "/advertising", label: "Advertising", icon: "◉" },
      { to: "/forecasting", label: "Forecasting", icon: "⌁" },
      { to: "/analytics", label: "Analytics", icon: "⌁" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { to: "/audit-logs", label: "Audit Logs", icon: "≡" },
      { to: "/settings", label: "Settings", icon: "⚙" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-[245px] shrink-0 border-r border-white/[0.07] bg-[#050d18] text-white md:flex md:flex-col">

      {/* BRAND */}
      <div className="flex h-[72px] items-center border-b border-white/[0.07] px-5">
        <div className="w-[155px] overflow-hidden">
          <MerchantraLogo />
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-7">
            <div className="mb-2 px-3 text-[9px] font-semibold tracking-[0.2em] text-slate-600">
              {section.label}
            </div>

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] transition-all duration-200 ${
                      isActive
                        ? "bg-cyan-400/[0.09] text-cyan-200"
                        : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 h-5 w-[2px] rounded-r-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
                      )}

                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                          isActive
                            ? "bg-cyan-300/10 text-cyan-200"
                            : "bg-white/[0.025] text-slate-600 group-hover:text-slate-300"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span>{item.label}</span>

                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* AI ASSISTANT */}
      <div className="mx-3 mb-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
            ✦
          </div>

          <div>
            <p className="text-xs font-medium text-slate-200">
              Merchantra AI
            </p>

            <p className="text-[9px] text-slate-600">
              Business Assistant
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[9px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Intelligence active
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-white/[0.07] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300/20 to-violet-300/10 text-xs text-cyan-200">
            S
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs text-slate-300">
              Seller Account
            </p>

            <p className="text-[9px] text-slate-600">
              Command Center
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}