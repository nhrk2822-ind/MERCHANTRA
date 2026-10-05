import React from "react";

export default function StatCard({ label, value, sub, tone = "default", icon }) {
  const toneClass =
    {
      default: "",
      pass: "is-pass",
      fail: "is-fail",
      review: "is-review",
    }[tone] || "";

  return (
    <div className={`mt-stat-card ${toneClass}`}>
      <div className="mt-stat-card__top">
        <div className="mt-stat-card__label">{label}</div>
        {icon && <span className="mt-stat-card__icon">{icon}</span>}
      </div>

      <div className="mt-stat-card__value">{value}</div>

      {sub && <div className="mt-stat-card__sub">{sub}</div>}
    </div>
  );
}
