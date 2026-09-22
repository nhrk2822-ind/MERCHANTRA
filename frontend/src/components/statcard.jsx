import React from "react";

// A manifest-style stat cell: sits inside a hairline-divided strip,
// not a floating rounded card with a shadow.
export default function StatCard({ label, value, sub, tone = "default" }) {
  const toneClass =
    {
      default: "text-text",
      pass: "text-status-pass",
      fail: "text-status-fail",
      review: "text-status-review",
    }[tone] || "text-text";

  return (
    <div className="px-5 py-4 first:pl-0 last:pr-0">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-2xl font-semibold font-mono ${toneClass}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}