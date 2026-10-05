import React from "react";

function AmazonIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path
        d="M18 28v-9c0-7.7 6.2-14 14-14s14 6.3 14 14v9"
        fill="none"
        stroke="#252525"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M16 27h32l-3 24H19z" fill="#272727" />
      <path
        d="M15 43c9 8 25 10 35 1"
        fill="none"
        stroke="#f6a21a"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlipkartIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path d="M17 22h30l-4 30H21z" fill="#2874f0" />
      <path
        d="M24 22v-6a8 8 0 0 1 16 0v6"
        fill="none"
        stroke="#ffd54a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M25 33h15"
        stroke="#ffd54a"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MeeshoIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path
        d="M11 49V15l12 17 9-17 9 17 12-17v34"
        fill="none"
        stroke="#f43397"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 49h24"
        stroke="#f43397"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MyntraIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path
        d="M10 50 21 13l11 25 11-25 11 37"
        fill="none"
        stroke="#ff3f6c"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 13 32 38 43 13"
        fill="none"
        stroke="#ff8a3d"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NykaaIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path
        d="M13 50V14l38 36V14"
        fill="none"
        stroke="#fc2779"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AjioIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path
        d="M12 50 32 12l20 38"
        fill="none"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 36h24"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShopifyIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path
        d="m20 19 10-5 16 4 7 36-28 5z"
        fill="#95bf47"
      />
      <path
        d="M30 14c1-7 6-10 11-8 4 2 3 8 1 12"
        fill="none"
        stroke="#5e8e32"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M31 29c4-3 11-1 11 3 0 5-7 6-12 2"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <path
        d="M11 15h7l7 28h25l6-21H19"
        fill="none"
        stroke="#6d584a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="52" r="4" fill="#6d584a" />
      <circle cx="47" cy="52" r="4" fill="#6d584a" />
    </svg>
  );
}

const icons = [
  AmazonIcon,
  FlipkartIcon,
  MeeshoIcon,
  MyntraIcon,
  NykaaIcon,
  AjioIcon,
  ShopifyIcon,
  CartIcon,
];

const floatingIcons = [
  [0, "4%", "-2s", "25s", 82, 38, -8],
  [3, "12%", "-13s", "31s", 72, -45, 9],
  [5, "20%", "-7s", "28s", 88, 55, -12],
  [1, "29%", "-19s", "34s", 66, -32, 7],
  [4, "37%", "-4s", "27s", 78, 44, -6],
  [6, "46%", "-16s", "32s", 70, -55, 10],
  [2, "54%", "-9s", "29s", 86, 36, -10],
  [0, "63%", "-23s", "35s", 74, -42, 8],
  [7, "71%", "-5s", "26s", 82, 50, -7],
  [3, "79%", "-14s", "33s", 70, -34, 11],
  [5, "87%", "-8s", "30s", 88, 48, -9],
  [1, "94%", "-20s", "36s", 69, -52, 6],
];

export default function FloatingBackground() {
  return (
    <div className="mt-float" aria-hidden="true">
      <div className="mt-float__atmosphere" />

      {floatingIcons.map(
        ([iconIndex, x, delay, duration, size, drift, rotate], index) => {
          const Icon = icons[iconIndex];

          return (
            <div
              className="mt-float__item"
              key={index}
              style={{
                "--icon-x": x,
                "--icon-delay": delay,
                "--icon-duration": duration,
                "--icon-size": `${size}px`,
                "--icon-drift": `${drift}px`,
                "--icon-rotate": `${rotate}deg`,
              }}
            >
              <div className="mt-float__icon">
                <Icon />
              </div>
            </div>
          );
        }
      )}

      <div className="mt-float__center-glow" />
    </div>
  );
}