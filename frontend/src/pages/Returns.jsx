import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";
import amazonLogo from "../assets/amazon.svg";
import flipkartLogo from "../assets/flipkart.svg";
import meeshoLogo from "../assets/meesho.svg";
import myntraLogo from "../assets/myntra.svg";


const RETURNS_STYLES = `
.returns-page {
  --r-navy: #244b67;
  --r-navy-deep: #17354d;
  --r-blue: #577a96;
  --r-blue-soft: #eaf2f7;
  --r-bg: #f3f6f8;
  --r-panel: #ffffff;
  --r-panel-soft: #f8fafb;
  --r-line: #dbe3e8;
  --r-line-dark: #c8d3db;
  --r-text: #22313d;
  --r-muted: #768692;
  --r-success: #2d7d5b;
  --r-success-bg: #edf8f2;
  --r-warning: #9b6a17;
  --r-warning-bg: #fff8e8;
  --r-danger: #a14c4c;
  --r-danger-bg: #fff1f1;
  --r-violet: #6d5c99;
  --r-violet-bg: #f4f1fb;

  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  color: var(--r-text);
}

.returns-page * {
  box-sizing: border-box;
}

.returns-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 22px;
}

.returns-eyebrow {
  color: #6f8596;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.returns-hero h1,
.returns-drawer h2 {
  margin: 4px 0 7px;
  color: var(--r-navy-deep);
  font-size: clamp(27px, 3vw, 34px);
  font-weight: 800;
  letter-spacing: -.04em;
}

.returns-hero p,
.returns-panel__header p,
.returns-detail-title-row p {
  margin: 0;
  color: var(--r-muted);
  font-size: 13px;
  line-height: 1.65;
}

.returns-sync-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.returns-sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #69808f;
  font-size: 11px;
}

.returns-sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #46a97d;
  box-shadow: 0 0 0 4px rgba(70, 169, 125, .10);
}

.returns-sync-actions {
  display: flex;
  align-items: center;
  gap: 13px;
  color: var(--r-muted);
  font-size: 11px;
}

.returns-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--r-line-dark);
  border-radius: 9px;
  background: #fff;
  color: var(--r-text);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .02em;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
}

.returns-button svg {
  width: 15px;
  height: 15px;
}

.returns-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #acbcc7;
  box-shadow: 0 10px 22px rgba(28, 45, 57, .08);
}

.returns-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.returns-button--primary {
  background: linear-gradient(135deg, #244b67, #2f6387);
  border-color: #244b67;
  color: #fff;
}

.returns-button--secondary {
  background: #f6f9fb;
  color: #38566e;
}

.returns-button--ghost {
  background: transparent;
  border-color: transparent;
}

.returns-button--ai {
  background: linear-gradient(135deg, #3e5872, #5a7088);
  border-color: #3e5872;
  color: #fff;
  min-width: 210px;
}

.returns-button-icon {
  font-size: 14px;
}

.returns-notice {
  margin: 0 0 18px;
  padding: 11px 13px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
}

.returns-notice--success {
  border: 1px solid #c9e8d8;
  background: var(--r-success-bg);
  color: #31735a;
}

.returns-notice--error {
  border: 1px solid #ecd0d0;
  background: var(--r-danger-bg);
  color: #984848;
}

.returns-summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.returns-summary-card,
.returns-panel,
.returns-detail-card {
  background: var(--r-panel);
  border: 1px solid var(--r-line);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(31, 53, 67, .045);
}

.returns-summary-card {
  position: relative;
  padding: 15px 16px;
  overflow: hidden;
}

.returns-summary-card::after {
  content: "";
  position: absolute;
  top: -18px;
  right: -18px;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  opacity: .50;
}

.returns-summary-card--navy::after { background: rgba(46, 97, 132, .10); }
.returns-summary-card--amber::after { background: rgba(215, 168, 62, .12); }
.returns-summary-card--blue::after { background: rgba(75, 133, 174, .10); }
.returns-summary-card--slate::after { background: rgba(102, 123, 141, .10); }
.returns-summary-card--violet::after { background: rgba(111, 91, 153, .10); }
.returns-summary-card--green::after { background: rgba(68, 162, 117, .10); }

.returns-summary-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--r-muted);
  font-size: 11px;
  font-weight: 700;
}

.returns-summary-card__spark {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8fa3b3;
}

.returns-summary-card strong {
  display: block;
  color: var(--r-navy-deep);
  font-size: 26px;
  line-height: 1;
}

.returns-panel {
  margin-bottom: 18px;
  overflow: hidden;
}

.returns-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 18px 14px;
}

.returns-panel__header h2 {
  margin: 0 0 5px;
  color: var(--r-navy-deep);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -.02em;
}

.returns-panel__count {
  padding: 6px 9px;
  border: 1px solid var(--r-line);
  border-radius: 999px;
  background: #f8fafb;
  color: #6c8190;
  font-size: 10px;
  font-weight: 800;
}

.returns-filters {
  display: grid;
  grid-template-columns: minmax(260px, 1.8fr) minmax(130px, .7fr) minmax(150px, .85fr) minmax(125px, .7fr) minmax(125px, .7fr);
  gap: 8px;
  padding: 0 18px 14px;
}

.returns-filters input,
.returns-filters select,
.returns-pid-input-wrap input,
.returns-checklist-grid select,
.returns-notes-field textarea {
  width: 100%;
  border: 1px solid var(--r-line);
  border-radius: 9px;
  background: #fbfcfd;
  color: var(--r-text);
  font-family: inherit;
  font-size: 11px;
  outline: none;
}

.returns-filters input,
.returns-filters select,
.returns-pid-input-wrap input,
.returns-checklist-grid select {
  height: 39px;
  padding: 0 10px;
}

.returns-search {
  position: relative;
}

.returns-search svg {
  position: absolute;
  left: 11px;
  top: 50%;
  width: 15px;
  height: 15px;
  transform: translateY(-50%);
  color: #8b9aa5;
}

.returns-search input {
  padding-left: 35px;
}

.returns-filters input:focus,
.returns-filters select:focus,
.returns-pid-input-wrap input:focus,
.returns-checklist-grid select:focus,
.returns-notes-field textarea:focus {
  border-color: rgba(36, 75, 103, .38);
  box-shadow: 0 0 0 3px rgba(36, 75, 103, .06);
}

.returns-table-wrap {
  overflow-x: auto;
  border-top: 1px solid var(--r-line);
}

.returns-table {
  width: 100%;
  min-width: 1240px;
  border-collapse: collapse;
}

.returns-table th {
  padding: 11px 14px;
  border-bottom: 1px solid var(--r-line);
  background: #f9fbfc;
  color: #7a8b97;
  text-align: left;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
  white-space: nowrap;
}

.returns-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #edf1f4;
  color: #4b5f6c;
  font-size: 11px;
  vertical-align: middle;
}

.returns-table tbody tr {
  transition: background .18s ease;
}

.returns-table tbody tr:hover {
  background: #fbfdfe;
}

.returns-table tbody tr:last-child td {
  border-bottom: 0;
}

.returns-mono {
  color: #526d80;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
}

.returns-product-cell {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 210px;
}

.returns-product-mini {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  overflow: hidden;
  border-radius: 9px;
  border: 1px solid var(--r-line);
  background: #f5f8fa;
}

.returns-product-mini .returns-product-image,
.returns-product-mini .returns-product-placeholder {
  width: 100%;
  height: 100%;
}

.returns-product-mini .returns-product-placeholder span {
  display: none;
}

.returns-product-cell strong {
  display: block;
  color: #314958;
  font-size: 11px;
  font-weight: 800;
}

.returns-product-cell span {
  display: block;
  margin-top: 3px;
  color: #93a0aa;
  font-size: 9px;
}

.returns-product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.returns-product-placeholder,
.returns-evidence-placeholder {
  display: grid;
  place-items: center;
  color: #90a1ad;
  background: linear-gradient(145deg, #f7fafb, #eef3f6);
}

.returns-product-placeholder svg {
  width: 24px;
  height: 24px;
}

.returns-product-placeholder span {
  padding: 0 7px 6px;
  color: #8496a2;
  font-size: 8px;
  text-align: center;
}

.returns-marketplace,
.returns-status,
.returns-ai-chip,
.returns-core-chip,
.returns-verification-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .03em;
}

.returns-marketplace {
  padding: 5px 8px;
  border: 1px solid var(--r-line);
  background: #fafcfd;
  color: #637783;
}

.returns-marketplace__logo {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  object-fit: contain;
  display: block;
}

.returns-marketplace__dot,
.returns-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8ca0ad;
}

.returns-marketplace--amazon .returns-marketplace__dot { background: #ef9a19; }
.returns-marketplace--flipkart .returns-marketplace__dot { background: #2874f0; }
.returns-marketplace--meesho .returns-marketplace__dot { background: #ef4f98; }
.returns-marketplace--myntra .returns-marketplace__dot { background: #ff5275; }

.returns-status {
  padding: 6px 8px;
  background: #f5f7f9;
  color: #617783;
}

.returns-status--needs-verification,
.returns-status--manual-review,
.returns-status--replacement-required {
  background: var(--r-warning-bg);
  color: #8e671f;
}

.returns-status--received,
.returns-status--in-transit {
  background: #edf5fa;
  color: #41677f;
}

.returns-status--under-inspection {
  background: var(--r-violet-bg);
  color: #6d5c99;
}

.returns-status--resolved,
.returns-status--approved,
.returns-status--restock-approved {
  background: var(--r-success-bg);
  color: #3d7b61;
}

.returns-status--rejected {
  background: var(--r-danger-bg);
  color: #984e4e;
}

.returns-view-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #3e6782;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.returns-view-button span {
  transition: transform .18s ease;
}

.returns-view-button:hover span {
  transform: translateX(3px);
}

.returns-empty {
  padding: 24px;
  color: var(--r-muted);
  text-align: center;
  font-size: 12px;
}

.returns-insights-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 18px;
}

.returns-insights-card,
.returns-analytics-card,
.returns-reasons-panel {
  margin-bottom: 0;
}

.returns-insight-list {
  padding: 0 18px 18px;
}

.returns-insight-row {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 11px 0;
  border-top: 1px solid #edf1f4;
}

.returns-insight-row:first-child {
  border-top: 0;
}

.returns-insight-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  flex: 0 0 26px;
  border-radius: 8px;
  background: #eef4f8;
  color: #527590;
  font-size: 12px;
  font-weight: 800;
}

.returns-insight-row strong {
  display: block;
  color: #345163;
  font-size: 11px;
}

.returns-insight-row p {
  margin: 3px 0 0;
  color: #82919b;
  font-size: 10px;
  line-height: 1.6;
}

.returns-ai-chip,
.returns-core-chip {
  padding: 5px 8px;
  background: #eef4f8;
  color: #54728a;
}

.returns-rate {
  color: #244b67;
  font-size: 25px;
  line-height: 1;
}

.returns-analytics-row {
  padding: 0 18px 12px;
}

.returns-analytics-row > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7c8d98;
  font-size: 10px;
}

.returns-analytics-row strong {
  color: #244b67;
  font-size: 11px;
}

.returns-progress,
.returns-bar {
  height: 8px;
  margin-top: 8px;
  border-radius: 999px;
  background: #edf2f5;
  overflow: hidden;
}

.returns-progress span,
.returns-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4e7895, #8aa4b8);
}

.returns-marketplace-bars {
  padding: 7px 18px 18px;
}

.returns-marketplace-bar {
  margin-top: 10px;
}

.returns-marketplace-bar > div:first-child {
  display: flex;
  justify-content: space-between;
  color: #718592;
  font-size: 10px;
}

.returns-marketplace-bar strong {
  color: #355369;
}

.returns-bar {
  height: 7px;
  margin-top: 5px;
}

.returns-reasons-panel {
  margin-top: 18px;
}

.returns-reason-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 0 18px 18px;
}

.returns-reason-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 13px;
  border: 1px solid var(--r-line);
  border-radius: 10px;
  background: #fafcfd;
  color: #677c88;
  font-size: 10px;
}

.returns-reason-card strong {
  min-width: 25px;
  text-align: right;
  color: #36576c;
  font-size: 15px;
}

.returns-muted {
  color: var(--r-muted);
  font-size: 11px;
}

.returns-verification-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--r-line);
}

.returns-verification-summary > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  color: #83929c;
  font-size: 10px;
}

.returns-verification-summary > div + div {
  border-left: 1px solid var(--r-line);
}

.returns-verification-summary strong {
  color: #36576d;
  font-size: 15px;
}

/* =========================================================
   DETAIL DRAWER
   ========================================================= */

.returns-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(17, 31, 42, .28);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.returns-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(920px, 92vw);
  display: flex;
  flex-direction: column;
  background: #f4f7f9;
  border-left: 1px solid rgba(255, 255, 255, .45);
  box-shadow: -24px 0 70px rgba(16, 31, 42, .18);
}

.returns-drawer__header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px 17px;
  border-bottom: 1px solid var(--r-line);
  background: rgba(255,255,255,.96);
}

.returns-drawer__header h2 {
  margin-bottom: 3px;
  font-size: 25px;
}

.returns-drawer__header p {
  margin: 0;
  color: #7e8d97;
  font-size: 11px;
}

.returns-icon-button,
.returns-camera-header button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--r-line);
  border-radius: 9px;
  background: #fff;
  color: #667d8a;
  font-size: 20px;
  cursor: pointer;
}

.returns-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 40px;
}

.returns-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.returns-detail-grid {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 12px;
  margin-bottom: 12px;
}

.returns-detail-card {
  padding: 15px;
  margin-bottom: 12px;
  background: rgba(255,255,255,.93);
}

.returns-detail-title {
  color: #304f63;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -.01em;
}

.returns-detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 13px;
}

.returns-detail-title-row p {
  margin-top: 4px;
  font-size: 10px;
}

.returns-field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 18px;
  margin-top: 12px;
}

.returns-field-grid > div {
  min-width: 0;
}

.returns-field-grid__full {
  grid-column: 1 / -1;
}

.returns-field-grid span,
.returns-product-meta span,
.returns-checklist-grid label > span,
.returns-notes-field > span,
.returns-pid-label {
  display: block;
  color: #85949e;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.returns-field-grid strong {
  display: block;
  margin-top: 3px;
  color: #3b5567;
  font-size: 10px;
  line-height: 1.5;
}

.returns-product-detail {
  display: flex;
  gap: 13px;
  margin-top: 12px;
}

.returns-product-detail__image {
  width: 98px;
  height: 98px;
  flex: 0 0 98px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--r-line);
  background: #f4f7f9;
}

.returns-product-detail__copy h3 {
  margin: 0;
  color: #2f4b60;
  font-size: 14px;
}

.returns-product-detail__copy > span {
  display: block;
  margin-top: 3px;
  color: #8b99a3;
  font-size: 10px;
}

.returns-product-pid {
  display: inline-flex;
  margin-top: 9px;
  padding: 6px 8px;
  border-radius: 7px;
  background: #eef4f8;
  color: #3f647e;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 9px;
  font-weight: 800;
}

.returns-product-meta {
  display: flex;
  gap: 14px;
  margin-top: 10px;
}

.returns-product-meta strong {
  margin-left: 3px;
  color: #355369;
  font-size: 10px;
  text-transform: none;
  letter-spacing: 0;
}

.returns-pid-row {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto auto;
  gap: 8px;
  align-items: end;
}

.returns-pid-input-wrap input {
  margin-top: 6px;
}

.returns-verification-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 10px;
  color: #7a8b95;
  font-size: 10px;
  line-height: 1.5;
}

.returns-verification-pill {
  padding: 6px 9px;
  background: #eef4f8;
  color: #4d728d;
}

.returns-verification-pill--done {
  background: var(--r-success-bg);
  color: var(--r-success);
}

.returns-verification-pill--error {
  background: var(--r-danger-bg);
  color: var(--r-danger);
}

.returns-verification-pill--loading {
  background: var(--r-warning-bg);
  color: var(--r-warning);
}


.returns-resolved-record {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 11px;
  padding: 10px;
  border: 1px solid #d7e2e9;
  border-radius: 9px;
  background: #f7fafc;
}

.returns-resolved-record > div {
  min-width: 0;
}

.returns-resolved-record span,
.returns-resolved-record strong {
  display: block;
}

.returns-resolved-record span {
  color: #8898a2;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.returns-resolved-record strong {
  margin-top: 3px;
  color: #3d596b;
  font-size: 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.returns-timeline {
  display: grid;
  gap: 9px;
  margin-top: 13px;
}

.returns-timeline-step {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 9px;
  background: #f8fafb;
  color: #7e8e98;
}

.returns-timeline-step::before {
  content: "";
  position: absolute;
  left: 18px;
  top: 31px;
  bottom: -11px;
  width: 1px;
  background: #d8e1e6;
}

.returns-timeline-step:last-child::before {
  display: none;
}

.returns-timeline-step.is-done {
  background: #f1f7f4;
}

.returns-timeline-step.is-current {
  background: #eef4f8;
}

.returns-timeline-step__marker {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid #c7d3da;
  background: #fff;
  color: #7b909f;
  font-size: 8px;
  font-weight: 800;
}

.returns-timeline-step.is-done .returns-timeline-step__marker {
  background: #e2f2e8;
  border-color: #b9dec8;
  color: #3f815f;
}

.returns-timeline-step strong,
.returns-timeline-step span {
  display: block;
}

.returns-timeline-step strong {
  color: #486374;
  font-size: 10px;
}

.returns-timeline-step span {
  margin-top: 2px;
  color: #95a2ab;
  font-size: 9px;
}

.returns-evidence-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  margin-top: 12px;
}

.returns-evidence-card {
  overflow: hidden;
  border: 1px solid var(--r-line);
  border-radius: 10px;
  background: #f8fafb;
}

.returns-evidence-card > img,
.returns-evidence-placeholder {
  width: 100%;
  height: 118px;
  object-fit: cover;
}

.returns-evidence-placeholder svg {
  width: 30px;
  height: 30px;
}

.returns-evidence-card__meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 9px;
}

.returns-evidence-card__meta strong {
  color: #4d6574;
  font-size: 9px;
}

.returns-evidence-card__meta span {
  color: #94a1a9;
  font-size: 8px;
}

.returns-inspection-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.returns-photo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin-top: 12px;
}

.returns-photo-card {
  overflow: hidden;
  border: 1px solid var(--r-line);
  border-radius: 10px;
  background: #f8fafb;
}

.returns-photo-card img {
  display: block;
  width: 100%;
  height: 125px;
  object-fit: cover;
}

.returns-photo-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
}

.returns-photo-card__footer span {
  overflow: hidden;
  color: #647a87;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.returns-photo-card__footer button {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 6px;
  background: #edf2f5;
  color: #6f828f;
  cursor: pointer;
}

.returns-photo-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 128px;
  border: 1px dashed #cad7df;
  border-radius: 10px;
  background: #fafcfd;
  color: #86959e;
  text-align: center;
}

.returns-photo-empty strong {
  color: #5a7180;
  font-size: 11px;
}

.returns-photo-empty span {
  max-width: 360px;
  margin-top: 4px;
  font-size: 9px;
  line-height: 1.6;
}

.returns-ai-result {
  margin-top: 12px;
  padding: 13px;
  border-radius: 11px;
  border: 1px solid #decfb0;
  background: #fffaf0;
}

.returns-ai-result.is-verified {
  border-color: #c8e1d2;
  background: #f3faf6;
}

.returns-ai-result__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.returns-ai-result__header span {
  color: #88774f;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .08em;
}

.returns-ai-result.is-verified .returns-ai-result__header span {
  color: #4d7d66;
}

.returns-ai-result h3 {
  margin: 3px 0 0;
  color: #725f2c;
  font-size: 15px;
  font-weight: 800;
}

.returns-ai-result.is-verified h3 {
  color: #397257;
}

.returns-ai-result > p {
  margin: 7px 0 12px;
  color: #7f765f;
  font-size: 10px;
  line-height: 1.6;
}

.returns-ai-result.is-verified > p {
  color: #607e6e;
}

.returns-ai-result__state {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff1c7;
  color: #8d6b20;
  font-weight: 800;
}

.returns-ai-result.is-verified .returns-ai-result__state {
  background: #def0e4;
  color: #3a7b5b;
}

.returns-ai-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.returns-ai-grid > div {
  padding: 9px;
  border-radius: 8px;
  background: rgba(255,255,255,.66);
}

.returns-ai-grid span,
.returns-ai-grid strong {
  display: block;
}

.returns-ai-grid span {
  color: #8e856f;
  font-size: 8px;
}

.returns-ai-grid strong {
  margin-top: 4px;
  color: #5a5f58;
  font-size: 10px;
}

.returns-ai-flags {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  color: #866f36;
  font-size: 9px;
  line-height: 1.5;
}

.returns-checklist-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.returns-checklist-grid label,
.returns-notes-field {
  display: block;
}

.returns-checklist-grid select {
  margin-top: 5px;
}

.returns-notes-field {
  margin-top: 11px;
}

.returns-notes-field textarea {
  min-height: 86px;
  margin-top: 5px;
  padding: 10px;
  resize: vertical;
}

.returns-upload-evidence {
  margin-top: 9px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #42657c;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.returns-resolution-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 11px;
}

.returns-resolution-grid button {
  min-height: 46px;
  border: 1px solid var(--r-line-dark);
  border-radius: 9px;
  background: #fafcfd;
  color: #496476;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .18s ease, border-color .18s ease, background .18s ease;
}

.returns-resolution-grid button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #9fb4c2;
  background: #fff;
}

.returns-resolution-grid button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.returns-lifecycle-line {
  display: grid;
  grid-template-columns: repeat(10, minmax(70px, 1fr));
  gap: 6px;
  overflow-x: auto;
  margin-top: 14px;
  padding-bottom: 4px;
}

.returns-lifecycle-node {
  min-width: 84px;
  position: relative;
  padding-top: 2px;
  text-align: center;
}

.returns-lifecycle-node:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 10px;
  left: calc(50% + 13px);
  right: calc(-50% + 13px);
  height: 1px;
  background: #d8e1e7;
}

.returns-lifecycle-node span {
  position: relative;
  z-index: 2;
  width: 20px;
  height: 20px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid #ccd8df;
  background: #fff;
  color: #8b9da8;
  font-size: 8px;
  font-weight: 800;
}

.returns-lifecycle-node.is-done span {
  border-color: #b9dbc7;
  background: #e8f5ed;
  color: #3f7d5e;
}

.returns-lifecycle-node.is-done::after {
  background: #b9dbc7;
}

.returns-lifecycle-node small {
  display: block;
  margin-top: 7px;
  color: #82929d;
  font-size: 8px;
  line-height: 1.45;
}

/* =========================================================
   CAMERA
   ========================================================= */

.returns-camera-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(12, 24, 33, .56);
}

.returns-camera-modal {
  width: min(680px, 94vw);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 16px;
  background: #f6f9fb;
  box-shadow: 0 30px 80px rgba(10,20,27,.30);
}

.returns-camera-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 17px;
  border-bottom: 1px solid var(--r-line);
  background: #fff;
}

.returns-camera-header > div > span {
  color: #78909e;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .1em;
}

.returns-camera-header h3 {
  margin: 3px 0 0;
  color: #2a4a60;
  font-size: 15px;
}

.returns-camera-view {
  position: relative;
  aspect-ratio: 16 / 10;
  background: #14242f;
  overflow: hidden;
}

.returns-camera-view video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.returns-camera-frame {
  position: absolute;
  inset: 13% 16%;
  border: 2px solid rgba(255,255,255,.70);
  border-radius: 18px;
  box-shadow: 0 0 0 999px rgba(5, 13, 18, .16);
  pointer-events: none;
}

.returns-camera-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 11px;
  border-radius: 999px;
  background: rgba(0,0,0,.42);
  color: #fff;
  font-size: 10px;
}

.returns-camera-error {
  padding: 10px 14px;
  border-top: 1px solid #efd6d6;
  background: #fff3f3;
  color: #965151;
  font-size: 10px;
  line-height: 1.55;
}

.returns-camera-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid var(--r-line);
  background: #fff;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 1250px) {
  .returns-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .returns-filters {
    grid-template-columns: minmax(240px, 1.5fr) repeat(2, minmax(130px, .7fr)) repeat(2, minmax(120px, .6fr));
  }
}

@media (max-width: 980px) {
  .returns-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .returns-sync-panel {
    align-items: flex-start;
  }

  .returns-insights-grid,
  .returns-detail-grid {
    grid-template-columns: 1fr;
  }

  .returns-reason-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .returns-checklist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .returns-resolution-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .returns-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .returns-filters {
    grid-template-columns: 1fr 1fr;
  }

  .returns-search {
    grid-column: 1 / -1;
  }

  .returns-pid-row {
    grid-template-columns: 1fr 1fr;
  }

  .returns-pid-input-wrap {
    grid-column: 1 / -1;
  }

  .returns-photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .returns-ai-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .returns-resolved-record {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .returns-verification-summary {
    grid-template-columns: 1fr;
  }

  .returns-verification-summary > div + div {
    border-top: 1px solid var(--r-line);
    border-left: 0;
  }
}

@media (max-width: 560px) {
  .returns-hero h1 {
    font-size: 26px;
  }

  .returns-sync-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .returns-summary-grid,
  .returns-reason-grid,
  .returns-checklist-grid,
  .returns-resolution-grid {
    grid-template-columns: 1fr;
  }

  .returns-filters {
    grid-template-columns: 1fr;
  }

  .returns-search {
    grid-column: auto;
  }

  .returns-pid-row {
    grid-template-columns: 1fr;
  }

  .returns-drawer {
    width: 100%;
  }

  .returns-field-grid {
    grid-template-columns: 1fr;
  }

  .returns-field-grid__full {
    grid-column: auto;
  }

  .returns-evidence-grid,
  .returns-photo-grid {
    grid-template-columns: 1fr;
  }

  .returns-ai-grid {
    grid-template-columns: 1fr;
  }

  .returns-drawer__header,
  .returns-drawer__body {
    padding-left: 14px;
    padding-right: 14px;
  }
}

`;

const MOCK_RETURNS = [
  {
    id: "RET-1042",
    backendId: null,
    orderId: "ORD-89231",
    product: "Wireless Headphones",
    sku: "WH-X200",
    permanentProductId: "MCH-P-000125",
    marketplace: "Amazon",
    reason: "Damaged product",
    requestedOn: "28 Sep",
    status: "Needs Verification",
    description:
      "Customer reports visible damage on the earcup and outer package.",
    customerDescription:
      "The returned headset arrived with a cracked left earcup and packaging that looks different from the original shipment.",
    quantity: 1,
    orderValue: "₹2,499",
    imageUrl: "",
    originalPacking: [
      { label: "Front", meta: "Packed 28 Sep · 10:42 AM" },
      { label: "Product label", meta: "MCH-P-000125 · ORD-89231" },
      { label: "Package seal", meta: "Evidence recorded at packing" },
    ],
    lifecycleIndex: 8,
  },
  {
    id: "RET-1043",
    backendId: null,
    orderId: "ORD-89245",
    product: "Cotton Kurti",
    sku: "CK-ROSE-M",
    permanentProductId: "MCH-P-000218",
    marketplace: "Meesho",
    reason: "Wrong size",
    requestedOn: "29 Sep",
    status: "Received",
    description: "Customer requested a return because the selected size did not fit.",
    customerDescription:
      "Size M is too loose. Customer says the product itself appears unused.",
    quantity: 1,
    orderValue: "₹899",
    imageUrl: "",
    originalPacking: [
      { label: "Front", meta: "Packed 29 Sep · 12:18 PM" },
      { label: "SKU label", meta: "CK-ROSE-M" },
      { label: "Order pack", meta: "ORD-89245 · Meesho" },
    ],
    lifecycleIndex: 5,
  },
  {
    id: "RET-1044",
    backendId: null,
    orderId: "ORD-89261",
    product: "Smart Watch",
    sku: "SW-EDGE-01",
    permanentProductId: "MCH-P-000341",
    marketplace: "Flipkart",
    reason: "Product not as expected",
    requestedOn: "30 Sep",
    status: "Under Inspection",
    description: "Customer reports that the received appearance did not match expectations.",
    customerDescription:
      "Customer says the finish looks different from the listing and wants the item inspected.",
    quantity: 1,
    orderValue: "₹3,199",
    imageUrl: "",
    originalPacking: [
      { label: "Front", meta: "Packed 30 Sep · 2:06 PM" },
      { label: "Serial / PID", meta: "MCH-P-000341" },
      { label: "Box seal", meta: "Evidence recorded at packing" },
    ],
    lifecycleIndex: 7,
  },
  {
    id: "RET-1045",
    backendId: null,
    orderId: "ORD-89284",
    product: "Bluetooth Speaker",
    sku: "BS-MINI-03",
    permanentProductId: "MCH-P-000412",
    marketplace: "Myntra",
    reason: "Missing accessory",
    requestedOn: "30 Sep",
    status: "In Transit",
    description: "Return is moving back to the seller and is not yet physically received.",
    customerDescription:
      "Customer says the charging cable was missing from the delivered package.",
    quantity: 1,
    orderValue: "₹1,499",
    imageUrl: "",
    originalPacking: [
      { label: "Front", meta: "Packed 30 Sep · 4:28 PM" },
      { label: "Accessory tray", meta: "Cable visible at packing" },
      { label: "Seal", meta: "Original packaging evidence" },
    ],
    lifecycleIndex: 4,
  },
  {
    id: "RET-1046",
    backendId: null,
    orderId: "ORD-89305",
    product: "Wireless Mouse",
    sku: "WM-AERO-02",
    permanentProductId: "MCH-P-000516",
    marketplace: "Amazon",
    reason: "Not working",
    requestedOn: "30 Sep",
    status: "Resolved",
    description: "Inspection completed and return was approved for restocking.",
    customerDescription:
      "Customer reported that the mouse stopped responding after delivery.",
    quantity: 1,
    orderValue: "₹1,099",
    imageUrl: "",
    originalPacking: [
      { label: "Front", meta: "Packed 30 Sep · 5:19 PM" },
      { label: "Label", meta: "MCH-P-000516" },
      { label: "Accessory check", meta: "Receiver included" },
    ],
    lifecycleIndex: 10,
  },
];

const TIMELINE_STEPS = [
  "Customer Requested Return",
  "Marketplace Return Created",
  "Return Synced to Merchantra",
  "Pickup Scheduled",
  "In Transit",
  "Received",
  "Product ID Verified",
  "AI/CV Inspection",
  "Seller Decision",
  "Refund / Replacement / Restock",
];

const STATUS_OPTIONS = [
  "All",
  "Needs Verification",
  "Received",
  "Under Inspection",
  "In Transit",
  "Resolved",
  "Approved",
  "Rejected",
  "Manual Review",
  "Replacement Required",
  "Restock Approved",
];

const MARKETPLACE_OPTIONS = ["All", "Amazon", "Flipkart", "Meesho", "Myntra"];

const INSPECTION_OPTIONS = {
  condition: ["Good", "Damaged", "Used", "Missing parts"],
  packaging: ["Original packaging", "Damaged packaging", "Missing packaging"],
  accessories: ["Complete", "Missing items"],
  identity: ["Matches", "Mismatch"],
  pid: ["Verified", "Not verified"],
};

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function getLifecycleIndex(status) {
  const map = {
    "Needs Verification": 6,
    Received: 5,
    "Under Inspection": 7,
    "In Transit": 4,
    Resolved: 9,
    Approved: 9,
    Rejected: 9,
    "Manual Review": 8,
    "Replacement Required": 9,
    "Restock Approved": 9,
  };
  return map[status] ?? 6;
}

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeReturn(value) {
  if (!value) return null;
  return {
    ...value,
    id: value.id?.toString().startsWith("RET-") ? value.id : `RET-${value.id}`,
    orderId: value.orderId ?? value.order_id ?? "ORD-—",
    product: value.product ?? value.product_name ?? "Unknown product",
    permanentProductId:
      value.permanentProductId ?? value.permanent_product_id ?? "—",
    marketplace: value.marketplace ?? "Marketplace",
    reason: value.reason ?? "Not specified",
    requestedOn: value.requestedOn ?? value.requested_on ?? "—",
    status: value.status ?? "Needs Verification",
    quantity: value.quantity ?? 1,
    orderValue: value.orderValue ?? value.order_value ?? "—",
    lifecycleIndex: getLifecycleIndex(value.status),
  };
}

function getMarketplaceLogo(name) {
  const logos = {
    Amazon: amazonLogo,
    Flipkart: flipkartLogo,
    Meesho: meeshoLogo,
    Myntra: myntraLogo,
  };

  return logos[name] || null;
}

function MarketplaceBadge({ name }) {
  const logo = getMarketplaceLogo(name);

  return (
    <span className={`returns-marketplace returns-marketplace--${name.toLowerCase()}`}>
      {logo ? (
        <img className="returns-marketplace__logo" src={logo} alt={`${name} logo`} />
      ) : (
        <span className="returns-marketplace__dot" />
      )}
      {name}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`returns-status returns-status--${getStatusClass(status)}`}>
      <span className="returns-status__dot" />
      {status}
    </span>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`returns-summary-card returns-summary-card--${tone}`}>
      <div className="returns-summary-card__top">
        <span>{label}</span>
        <span className="returns-summary-card__spark" />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function ProductImage({ src, label }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        className="returns-product-image"
        src={src}
        alt={label}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="returns-product-placeholder" aria-label={label}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="8" y="9" width="32" height="29" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="18" cy="19" r="3" fill="currentColor" />
        <path d="m12 33 9-9 7 6 5-5 5 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function EvidenceCard({ item, fallbackImage }) {
  return (
    <div className="returns-evidence-card">
      {fallbackImage ? (
        <img src={fallbackImage} alt={item.label} />
      ) : (
        <div className="returns-evidence-placeholder">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <rect x="9" y="11" width="30" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="m13 31 7-7 6 5 5-6 5 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{item.label}</span>
        </div>
      )}
      <div className="returns-evidence-card__meta">
        <strong>{item.label}</strong>
        <span>{item.meta}</span>
      </div>
    </div>
  );
}

export default function Returns() {
  const [returns, setReturns] = useState(MOCK_RETURNS);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const [search, setSearch] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState("2 min ago");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [productPid, setProductPid] = useState("");
  const [productRecord, setProductRecord] = useState(null);
  const [productTimeline, setProductTimeline] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [verifyState, setVerifyState] = useState("idle");

  const [photos, setPhotos] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState("photo");
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const [inspection, setInspection] = useState({
    condition: "Good",
    packaging: "Original packaging",
    accessories: "Complete",
    identity: "Matches",
    pid: "Verified",
    notes: "",
  });

  const [aiResult, setAiResult] = useState(null);
  const [resolutionLoading, setResolutionLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const barcodeTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();

    function parseRequestedDate(value) {
      if (!value) return null;
      const parsed = new Date(`${value} ${new Date().getFullYear()}`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return returns.filter((item) => {
      const searchable = [
        item.id,
        item.orderId,
        item.product,
        item.permanentProductId,
      ]
        .join(" ")
        .toLowerCase();

      const itemDate = parseRequestedDate(item.requestedOn);
      const matchesQuery = !query || searchable.includes(query);
      const matchesMarketplace =
        marketplaceFilter === "All" || item.marketplace === marketplaceFilter;
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesFrom = !from || !itemDate || itemDate >= from;
      const matchesTo = !to || !itemDate || itemDate <= to;

      return matchesQuery && matchesMarketplace && matchesStatus && matchesFrom && matchesTo;
    });
  }, [returns, search, marketplaceFilter, statusFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter((x) => x.status === "Needs Verification").length;
    const transit = returns.filter((x) => x.status === "In Transit").length;
    const received = returns.filter((x) => x.status === "Received").length;
    const inspectionCount = returns.filter((x) => x.status === "Under Inspection").length;
    const resolved = returns.filter((x) =>
      ["Resolved", "Approved", "Rejected", "Restock Approved"].includes(x.status)
    ).length;

    return { total, pending, transit, received, inspectionCount, resolved };
  }, [returns]);

  const selectedIndex = selectedReturn
    ? getLifecycleIndex(selectedReturn.status)
    : 0;

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!selectedReturn) return;
    setProductPid(selectedReturn.permanentProductId || "");
    setProductRecord(null);
    setProductTimeline([]);
    setAiResult(null);
    setPhotos([]);
    setVerifyState("idle");
    setInspection({
      condition: "Good",
      packaging: "Original packaging",
      accessories: "Complete",
      identity: "Matches",
      pid: "Verified",
      notes: "",
    });
  }, [selectedReturn?.id]);

  async function syncReturns() {
    setSyncing(true);
    setError("");
    setNotice("");

    try {
      let remoteReturns = [];

      try {
        const token = localStorage.getItem("merchantra_token");
        const base = import.meta.env.VITE_API_BASE_URL || "/api";
        const res = await fetch(`${base}/returns`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          remoteReturns = Array.isArray(data) ? data : data.returns ?? [];
        }
      } catch {
        remoteReturns = [];
      }

      if (remoteReturns.length) {
        setReturns(remoteReturns.map(normalizeReturn));
        setNotice(`${remoteReturns.length} synchronized returns loaded.`);
      } else {
        setNotice("Marketplace return sync completed. Showing synchronized sample data while marketplace APIs are connected.");
      }

      setLastSynced("Just now");
    } catch (err) {
      setError(err.message || "Return synchronization failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function verifyProduct() {
    const pid = productPid.trim();
    if (!pid) {
      setError("Enter or scan a Permanent Product ID first.");
      return;
    }

    setProductLoading(true);
    setVerifyState("loading");
    setError("");

    try {
      const [product, timeline] = await Promise.allSettled([
        api.products.get(pid),
        api.products.timeline(pid),
      ]);

      if (product.status === "fulfilled") {
        setProductRecord(product.value?.product ?? product.value);
      } else {
        const fallback = selectedReturn
          ? {
              permanent_product_id: pid,
              name: selectedReturn.product,
              sku: selectedReturn.sku,
              quantity: selectedReturn.quantity,
              order_value: selectedReturn.orderValue,
              marketplace: selectedReturn.marketplace,
            }
          : null;
        setProductRecord(fallback);
      }

      if (timeline.status === "fulfilled") {
        const events = timeline.value?.timeline ?? timeline.value ?? [];
        setProductTimeline(Array.isArray(events) ? events : []);
      } else {
        setProductTimeline([]);
      }

      if (selectedReturn?.permanentProductId === pid) {
        setInspection((prev) => ({ ...prev, pid: "Verified", identity: "Matches" }));
        setNotice("Permanent Product ID matched the synchronized return record.");
      } else {
        setInspection((prev) => ({ ...prev, pid: "Not verified", identity: "Mismatch" }));
        setNotice("Product record loaded, but the scanned/entered PID differs from this return.");
      }

      setVerifyState("done");
    } catch (err) {
      setError(err.message || "Product verification failed.");
      setVerifyState("error");
    } finally {
      setProductLoading(false);
    }
  }

  async function startCamera(mode = "photo") {
    setCameraMode(mode);
    setCameraError("");
    setCameraReady(false);
    setCameraOpen(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }

      if (mode === "barcode" && "BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({
          formats: ["code_128", "ean_13", "ean_8", "qr_code"],
        });

        barcodeTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;

          try {
            const detected = await detector.detect(videoRef.current);
            const value = detected?.[0]?.rawValue;
            if (value) {
              setProductPid(value);
              setNotice(`Barcode detected: ${value}`);
              stopCamera();
              setCameraOpen(false);
            }
          } catch {
            // Ignore transient detector errors.
          }
        }, 700);
      } else if (mode === "barcode") {
        setCameraError("Barcode auto-detection is not available in this browser. Capture the label and enter the Permanent Product ID manually.");
      }
    } catch (err) {
      setCameraError(err.message || "Could not access the camera.");
    }
  }

  function stopCamera() {
    if (barcodeTimerRef.current) {
      window.clearInterval(barcodeTimerRef.current);
      barcodeTimerRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    setCameraReady(false);
  }

  function closeCamera() {
    stopCamera();
    setCameraOpen(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const src = canvas.toDataURL("image/jpeg", 0.88);

    setPhotos((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        src,
        label: getPhotoLabel(current.length),
      },
    ]);

    setNotice("Return inspection photo captured.");

    if (cameraMode === "barcode") {
      closeCamera();
    }
  }

  function getPhotoLabel(index) {
    const labels = [
      "Front",
      "Back",
      "Side",
      "Product label",
      "Barcode / PID",
      "Packaging",
      "Damaged area",
    ];
    return labels[index] || `Evidence ${index + 1}`;
  }

  function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const available = Math.max(0, 8 - photos.length);
    const selected = files.slice(0, available);

    Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: `${Date.now()}-${file.name}`,
                src: reader.result,
                label: file.name,
              });
            reader.readAsDataURL(file);
          })
      )
    ).then((items) => {
      setPhotos((current) => [...current, ...items]);
      setNotice(`${items.length} return evidence image${items.length > 1 ? "s" : ""} added.`);
    });

    event.target.value = "";
  }

  function removePhoto(id) {
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  }

  function runAiVerification() {
    setError("");

    if (!productRecord && !selectedReturn) {
      setError("Verify the Permanent Product ID before running AI/CV inspection.");
      return;
    }

    if (!photos.length) {
      setAiResult({
        overall: "Inspection Required",
        reason: "Add returned product photos before running the assistive comparison.",
        identity: inspection.identity === "Matches" ? "MATCH" : "REVIEW",
        pid: inspection.pid === "Verified" ? "MATCH" : "REVIEW",
        quantity: "REVIEW",
        packaging: "PENDING",
        damage: "PENDING",
        comparison: "PENDING",
        flags: [],
      });
      return;
    }

    const pidMatch = inspection.pid === "Verified";
    const identityMatch = inspection.identity === "Matches";
    const damaged = inspection.condition === "Damaged";
    const packagingChanged = inspection.packaging !== "Original packaging";

    const flags = [];

    if (!pidMatch) {
      flags.push("Possible Permanent Product ID mismatch detected. Manual review recommended.");
    }

    if (!identityMatch) {
      flags.push("Possible product mismatch detected. Compare return evidence with original packing evidence.");
    }

    if (damaged) {
      flags.push("Visible damage recorded in inspection checklist.");
    }

    if (packagingChanged) {
      flags.push("Packaging condition differs from the original packing state.");
    }

    const needsVerification = !pidMatch || !identityMatch || damaged || packagingChanged;

    setAiResult({
      overall: needsVerification ? "Return Needs Verification" : "Verified",
      reason: needsVerification
        ? "Returned evidence contains one or more differences that should be reviewed by the seller."
        : "Product identity and supplied evidence are consistent with the synchronized return record.",
      identity: identityMatch ? "MATCH" : "REVIEW",
      pid: pidMatch ? "MATCH" : "REVIEW",
      quantity: inspection.accessories === "Complete" ? "MATCH" : "REVIEW",
      packaging: packagingChanged ? "DIFFERENT" : "MATCH",
      damage: damaged ? "DETECTED" : "NOT DETECTED",
      comparison: needsVerification ? "PARTIAL MATCH" : "MATCH",
      flags,
    });

    setNotice("Assistive AI/CV verification completed for this inspection.");
  }

  async function updateReturnStatus(nextStatus, actionLabel) {
    if (!selectedReturn) return;

    setResolutionLoading(true);
    setError("");

    try {
      if (selectedReturn.backendId && actionLabel === "Mark Received") {
        await api.returns.receive(selectedReturn.backendId);
      }

      if (selectedReturn.backendId && ["Approved", "Rejected", "Restock Approved", "Manual Review", "Replacement Required"].includes(nextStatus)) {
        const numericInspector = Number(localStorage.getItem("merchantra_user_id"));
        await api.returns.inspect(selectedReturn.backendId, {
          inspector_id: Number.isFinite(numericInspector) ? numericInspector : 0,
          condition_notes: inspection.notes || "Seller inspection completed in Returns workspace.",
          decision:
            nextStatus === "Restock Approved"
              ? "RESTOCK"
              : nextStatus === "Manual Review"
                ? "FLAG_FOR_REVIEW"
                : "DAMAGED_WRITE_OFF",
        });
      }

      setReturns((current) =>
        current.map((item) =>
          item.id === selectedReturn.id
            ? { ...item, status: nextStatus, lifecycleIndex: getLifecycleIndex(nextStatus) }
            : item
        )
      );

      setSelectedReturn((current) =>
        current
          ? { ...current, status: nextStatus, lifecycleIndex: getLifecycleIndex(nextStatus) }
          : current
      );

      setNotice(`${actionLabel} completed. Return ${selectedReturn.id} is now ${nextStatus}.`);
    } catch (err) {
      setError(err.message || `${actionLabel} failed.`);
    } finally {
      setResolutionLoading(false);
    }
  }

  const returnRate = 4.6;
  const verifiedCount = returns.filter((item) => ["Resolved", "Approved", "Restock Approved"].includes(item.status)).length;
  const verificationCount = returns.filter((item) => ["Needs Verification", "Under Inspection", "Manual Review"].includes(item.status)).length;

  const marketplaceCounts = MARKETPLACE_OPTIONS.filter((m) => m !== "All").map((marketplace) => ({
    marketplace,
    count: returns.filter((item) => item.marketplace === marketplace).length,
  }));

  const reasonCounts = returns.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});

  const reasonEntries = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  return (
    <Layout title="Returns">
      <style>{RETURNS_STYLES}</style>
      <div className="returns-page">
        <header className="returns-hero">
          <div>
            <div className="returns-eyebrow">RETURN OPERATIONS</div>
            <h1>Returns</h1>
            <p>
              Verify, inspect and manage customer returns across all your connected marketplaces.
            </p>
          </div>

          <div className="returns-sync-panel">
            <div className="returns-sync-status">
              <span className="returns-sync-dot" />
              <span>Returns synchronized from connected marketplaces.</span>
            </div>
            <div className="returns-sync-actions">
              <span>Last synced: {lastSynced}</span>
              <button className="returns-button returns-button--primary" onClick={syncReturns} disabled={syncing}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12a8 8 0 0 1 13.6-5.7L20 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 12a8 8 0 0 1-13.6 5.7L4 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 20v-5h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {syncing ? "Syncing…" : "Sync Returns"}
              </button>
            </div>
          </div>
        </header>

        {notice && <div className="returns-notice returns-notice--success">{notice}</div>}
        {error && <div className="returns-notice returns-notice--error">{error}</div>}

        <section className="returns-summary-grid">
          <SummaryCard label="Total Returns" value={summary.total} tone="navy" />
          <SummaryCard label="Pending Verification" value={summary.pending} tone="amber" />
          <SummaryCard label="In Transit" value={summary.transit} tone="blue" />
          <SummaryCard label="Received" value={summary.received} tone="slate" />
          <SummaryCard label="Under Inspection" value={summary.inspectionCount} tone="violet" />
          <SummaryCard label="Resolved" value={summary.resolved} tone="green" />
        </section>

        <section className="returns-panel">
          <div className="returns-panel__header">
            <div>
              <h2>Return queue</h2>
              <p>Customer return events received from Amazon, Flipkart, Meesho and Myntra.</p>
            </div>
            <span className="returns-panel__count">{filteredReturns.length} records</span>
          </div>

          <div className="returns-filters">
            <label className="returns-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m16 16 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Return ID / Order ID / Product / Permanent Product ID"
              />
            </label>

            <select value={marketplaceFilter} onChange={(event) => setMarketplaceFilter(event.target.value)}>
              {MARKETPLACE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>

            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="From date" />
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="To date" />
          </div>

          <div className="returns-table-wrap">
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Permanent Product ID</th>
                  <th>Marketplace</th>
                  <th>Return Reason</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((item) => (
                  <tr key={item.id}>
                    <td><strong className="returns-mono">{item.id}</strong></td>
                    <td className="returns-mono">{item.orderId}</td>
                    <td>
                      <div className="returns-product-cell">
                        <div className="returns-product-mini"><ProductImage src={item.imageUrl} label={item.product} /></div>
                        <div>
                          <strong>{item.product}</strong>
                          <span>{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="returns-mono">{item.permanentProductId}</td>
                    <td><MarketplaceBadge name={item.marketplace} /></td>
                    <td>{item.reason}</td>
                    <td>{item.requestedOn}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <button className="returns-view-button" onClick={() => setSelectedReturn(item)}>
                        View
                        <span>→</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredReturns.length && (
              <div className="returns-empty">
                No returns match the selected filters.
              </div>
            )}
          </div>
        </section>

        <section className="returns-insights-grid">
          <div className="returns-panel returns-insights-card">
            <div className="returns-panel__header">
              <div>
                <h2>AI Return Insights</h2>
                <p>Assistive patterns to prioritize seller review.</p>
              </div>
              <span className="returns-ai-chip">ASSISTIVE</span>
            </div>

            <div className="returns-insight-list">
              <div className="returns-insight-row">
                <span className="returns-insight-icon">↗</span>
                <div>
                  <strong>Wireless Headphones</strong>
                  <p>Return rate increased this month. Manual identity verification recommended.</p>
                </div>
              </div>
              <div className="returns-insight-row">
                <span className="returns-insight-icon">◌</span>
                <div>
                  <strong>Cotton Kurti</strong>
                  <p>Most recent returns are related to sizing. Consider a clearer size guide.</p>
                </div>
              </div>
              <div className="returns-insight-row">
                <span className="returns-insight-icon">!</span>
                <div>
                  <strong>3 units need manual review</strong>
                  <p>Product evidence or lifecycle records require additional verification.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="returns-panel returns-analytics-card">
            <div className="returns-panel__header">
              <div>
                <h2>Returns analytics</h2>
                <p>Compact operational view.</p>
              </div>
              <strong className="returns-rate">{returnRate}%</strong>
            </div>

            <div className="returns-analytics-row">
              <div>
                <span>Overall return rate</span>
                <strong>{returnRate}%</strong>
              </div>
              <div className="returns-progress"><span style={{ width: `${returnRate * 12}%` }} /></div>
            </div>

            <div className="returns-marketplace-bars">
              {marketplaceCounts.map((entry) => (
                <div key={entry.marketplace} className="returns-marketplace-bar">
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {getMarketplaceLogo(entry.marketplace) ? (
                        <img
                          src={getMarketplaceLogo(entry.marketplace)}
                          alt={`${entry.marketplace} logo`}
                          style={{ width: "15px", height: "15px", objectFit: "contain" }}
                        />
                      ) : null}
                      {entry.marketplace}
                    </span>
                    <strong>{entry.count}</strong>
                  </div>
                  <div className="returns-bar"><span style={{ width: `${Math.max(12, entry.count * 25)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="returns-panel returns-reasons-panel">
          <div className="returns-panel__header">
            <div>
              <h2>Top return reasons</h2>
              <p>Reasons received from synchronized marketplaces.</p>
            </div>
          </div>

          <div className="returns-reason-grid">
            {reasonEntries.map(([reason, count]) => (
              <div className="returns-reason-card" key={reason}>
                <span>{reason}</span>
                <strong>{count}</strong>
              </div>
            ))}
            {!reasonEntries.length && <span className="returns-muted">No reason data available.</span>}
          </div>

          <div className="returns-verification-summary">
            <div>
              <span>Verified / resolved</span>
              <strong>{verifiedCount}</strong>
            </div>
            <div>
              <span>Needs verification / inspection</span>
              <strong>{verificationCount}</strong>
            </div>
          </div>
        </section>

        {selectedReturn && (
          <div className="returns-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedReturn(null);
          }}>
            <aside className="returns-drawer">
              <div className="returns-drawer__header">
                <div>
                  <div className="returns-eyebrow">RETURN INSPECTION</div>
                  <h2>{selectedReturn.id}</h2>
                  <p>{selectedReturn.product} · {selectedReturn.orderId}</p>
                </div>
                <button className="returns-icon-button" onClick={() => setSelectedReturn(null)} aria-label="Close return inspection">×</button>
              </div>

              <div className="returns-drawer__body">
                <section className="returns-detail-header">
                  <StatusBadge status={selectedReturn.status} />
                  <MarketplaceBadge name={selectedReturn.marketplace} />
                </section>

                <section className="returns-detail-grid">
                  <div className="returns-detail-card">
                    <div className="returns-detail-title">Return Information</div>
                    <div className="returns-field-grid">
                      <div><span>Return ID</span><strong>{selectedReturn.id}</strong></div>
                      <div><span>Order ID</span><strong>{selectedReturn.orderId}</strong></div>
                      <div><span>Marketplace</span><strong>{selectedReturn.marketplace}</strong></div>
                      <div><span>Requested</span><strong>{selectedReturn.requestedOn}</strong></div>
                      <div><span>Reason</span><strong>{selectedReturn.reason}</strong></div>
                      <div className="returns-field-grid__full"><span>Customer description</span><strong>{selectedReturn.customerDescription}</strong></div>
                    </div>
                  </div>

                  <div className="returns-detail-card">
                    <div className="returns-detail-title">Product Information</div>
                    <div className="returns-product-detail">
                      <div className="returns-product-detail__image">
                        <ProductImage src={selectedReturn.imageUrl} label={selectedReturn.product} />
                      </div>
                      <div className="returns-product-detail__copy">
                        <h3>{selectedReturn.product}</h3>
                        <span>SKU · {selectedReturn.sku}</span>
                        <div className="returns-product-pid">{selectedReturn.permanentProductId}</div>
                        <div className="returns-product-meta">
                          <span>Quantity <strong>{selectedReturn.quantity}</strong></span>
                          <span>Order value <strong>{selectedReturn.orderValue}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title-row">
                    <div>
                      <div className="returns-detail-title">Permanent Product ID / Barcode Verification</div>
                      <p>Connect the returned unit to its original lifecycle record.</p>
                    </div>
                    <span className="returns-core-chip">CORE MERCHANTRA FLOW</span>
                  </div>

                  <div className="returns-pid-row">
                    <div className="returns-pid-input-wrap">
                      <span className="returns-pid-label">Permanent Product ID</span>
                      <input
                        value={productPid}
                        onChange={(event) => setProductPid(event.target.value)}
                        placeholder="MCH-P-000125"
                      />
                    </div>
                    <button className="returns-button returns-button--secondary" onClick={() => startCamera("barcode")}>
                      <span className="returns-button-icon">⌁</span>
                      Scan Barcode
                    </button>
                    <button className="returns-button returns-button--primary" onClick={verifyProduct} disabled={productLoading}>
                      {productLoading ? "Verifying…" : "Verify Product"}
                    </button>
                  </div>

                  <div className="returns-verification-status">
                    <div className={`returns-verification-pill returns-verification-pill--${verifyState}`}>
                      {verifyState === "done" ? "IDENTITY CHECKED" : verifyState === "loading" ? "CHECKING" : "READY TO VERIFY"}
                    </div>
                    <span>
                      Lifecycle: Product Creation → Inventory → Packing → Verification → Shipping → Delivery → Return → Inspection → Resolution
                    </span>
                  </div>

                  {productRecord && (
                    <div className="returns-resolved-record">
                      <div>
                        <span>Resolved product record</span>
                        <strong>{productRecord.name ?? productRecord.product_name ?? selectedReturn.product}</strong>
                      </div>
                      <div>
                        <span>SKU</span>
                        <strong>{productRecord.sku ?? selectedReturn.sku ?? "—"}</strong>
                      </div>
                      <div>
                        <span>Permanent Product ID</span>
                        <strong>{productRecord.permanent_product_id ?? productRecord.permanentProductId ?? productPid}</strong>
                      </div>
                      <div>
                        <span>Lifecycle source</span>
                        <strong>{productTimeline.length ? "Backend timeline" : "Return record / simulator"}</strong>
                      </div>
                    </div>
                  )}
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title-row">
                    <div>
                      <div className="returns-detail-title">Product History</div>
                      <p>Lifecycle evidence linked to {selectedReturn.permanentProductId}.</p>
                    </div>
                  </div>

                  <div className="returns-timeline">
                    {TIMELINE_STEPS.map((step, index) => {
                      const done = index <= selectedIndex;
                      const current = index === selectedIndex;
                      const backendEvent = productTimeline[index];

                      return (
                        <div key={step} className={`returns-timeline-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}`}>
                          <span className="returns-timeline-step__marker">{done ? "✓" : index + 1}</span>
                          <div>
                            <strong>{step}</strong>
                            <span>{backendEvent?.timestamp ?? (current ? "Current state" : "Lifecycle event")}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title-row">
                    <div>
                      <div className="returns-detail-title">Original Packing Evidence</div>
                      <p>Compare original product/packing records against returned evidence.</p>
                    </div>
                  </div>

                  <div className="returns-evidence-grid">
                    {selectedReturn.originalPacking.map((item) => (
                      <EvidenceCard key={item.label} item={item} fallbackImage={selectedReturn.imageUrl} />
                    ))}
                  </div>
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title-row">
                    <div>
                      <div className="returns-detail-title">Return Inspection</div>
                      <p>Capture or upload evidence from the returned unit.</p>
                    </div>
                  </div>

                  <div className="returns-inspection-toolbar">
                    <button className="returns-button returns-button--primary" onClick={() => startCamera("photo")}>
                      <span className="returns-button-icon">◉</span>
                      Capture Return Photos
                    </button>
                    <button className="returns-button returns-button--secondary" onClick={() => fileInputRef.current?.click()}>
                      Upload Return Photos
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
                  </div>

                  <div className="returns-photo-grid">
                    {photos.map((photo) => (
                      <div className="returns-photo-card" key={photo.id}>
                        <img src={photo.src} alt={photo.label} />
                        <div className="returns-photo-card__footer">
                          <span>{photo.label}</span>
                          <button onClick={() => removePhoto(photo.id)} aria-label={`Remove ${photo.label}`}>×</button>
                        </div>
                      </div>
                    ))}
                    {!photos.length && (
                      <div className="returns-photo-empty">
                        <strong>No return photos yet</strong>
                        <span>Capture Front / Back / Side / Label / Barcode / Packaging / Damage evidence.</span>
                      </div>
                    )}
                  </div>
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title-row">
                    <div>
                      <div className="returns-detail-title">AI / Computer Vision Verification</div>
                      <p>Assistive comparison between original evidence and returned product photos.</p>
                    </div>
                    <span className="returns-ai-chip">ASSISTIVE · NOT AUTO-DECISION</span>
                  </div>

                  <button className="returns-button returns-button--ai" onClick={runAiVerification}>
                    Run AI/CV Verification
                  </button>

                  {aiResult && (
                    <div className={`returns-ai-result ${aiResult.overall === "Verified" ? "is-verified" : "is-review"}`}>
                      <div className="returns-ai-result__header">
                        <div>
                          <span>AI VERIFICATION</span>
                          <h3>{aiResult.overall}</h3>
                        </div>
                        <div className="returns-ai-result__state">{aiResult.overall === "Verified" ? "✓" : "!"}</div>
                      </div>

                      <p>{aiResult.reason}</p>

                      <div className="returns-ai-grid">
                        <div><span>Product Identity</span><strong>{aiResult.identity}</strong></div>
                        <div><span>Permanent Product ID</span><strong>{aiResult.pid}</strong></div>
                        <div><span>Quantity</span><strong>{aiResult.quantity}</strong></div>
                        <div><span>Packaging</span><strong>{aiResult.packaging}</strong></div>
                        <div><span>Visible Damage</span><strong>{aiResult.damage}</strong></div>
                        <div><span>Original vs Return</span><strong>{aiResult.comparison}</strong></div>
                      </div>

                      {aiResult.flags.length > 0 && (
                        <div className="returns-ai-flags">
                          {aiResult.flags.map((flag) => <div key={flag}>⚠ {flag}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title">Inspection Checklist</div>

                  <div className="returns-checklist-grid">
                    {Object.entries(INSPECTION_OPTIONS).map(([field, options]) => (
                      <label key={field}>
                        <span>{field === "pid" ? "Permanent Product ID" : field[0].toUpperCase() + field.slice(1)}</span>
                        <select
                          value={inspection[field]}
                          onChange={(event) => setInspection((current) => ({ ...current, [field]: event.target.value }))}
                          disabled={field === "pid" || field === "identity"}
                        >
                          {options.map((option) => <option key={option}>{option}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>

                  <label className="returns-notes-field">
                    <span>Inspection Notes</span>
                    <textarea
                      value={inspection.notes}
                      onChange={(event) => setInspection((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Record evidence, visible damage, missing items, comparison notes…"
                    />
                  </label>

                  <button className="returns-upload-evidence" onClick={() => fileInputRef.current?.click()}>
                    + Upload Additional Evidence
                  </button>
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title">Resolution</div>
                  <div className="returns-resolution-grid">
                    <button onClick={() => updateReturnStatus("Approved", "Approve Refund")} disabled={resolutionLoading}>Approve Refund</button>
                    <button onClick={() => updateReturnStatus("Rejected", "Reject Return")} disabled={resolutionLoading}>Reject Return</button>
                    <button onClick={() => updateReturnStatus("Replacement Required", "Mark for Replacement")} disabled={resolutionLoading}>Mark for Replacement</button>
                    <button onClick={() => updateReturnStatus("Restock Approved", "Approve Restocking")} disabled={resolutionLoading}>Approve Restocking</button>
                    <button onClick={() => updateReturnStatus("Manual Review", "Send for Manual Review")} disabled={resolutionLoading}>Send for Manual Review</button>
                  </div>
                </section>

                <section className="returns-detail-card">
                  <div className="returns-detail-title">Return Lifecycle Timeline</div>
                  <div className="returns-lifecycle-line">
                    {TIMELINE_STEPS.map((step, index) => (
                      <div key={step} className={`returns-lifecycle-node ${index <= selectedIndex ? "is-done" : ""}`}>
                        <span>{index <= selectedIndex ? "✓" : index + 1}</span>
                        <small>{step}</small>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </aside>
          </div>
        )}

        {cameraOpen && (
          <div className="returns-camera-overlay">
            <div className="returns-camera-modal">
              <div className="returns-camera-header">
                <div>
                  <span>{cameraMode === "barcode" ? "BARCODE SCANNER" : "RETURN CAMERA"}</span>
                  <h3>{cameraMode === "barcode" ? "Scan Permanent Product ID" : "Capture return evidence"}</h3>
                </div>
                <button onClick={closeCamera} aria-label="Close camera">×</button>
              </div>

              <div className="returns-camera-view">
                <video ref={videoRef} muted playsInline />
                <div className="returns-camera-frame" />
                {!cameraReady && <div className="returns-camera-loading">Starting camera…</div>}
              </div>

              {cameraError && <div className="returns-camera-error">{cameraError}</div>}

              <div className="returns-camera-actions">
                {cameraMode === "photo" && (
                  <button className="returns-button returns-button--primary" onClick={capturePhoto} disabled={!cameraReady}>Capture Photo</button>
                )}
                {cameraMode === "barcode" && !cameraError && (
                  <button className="returns-button returns-button--secondary" onClick={capturePhoto} disabled={!cameraReady}>Capture Label</button>
                )}
                <button className="returns-button returns-button--ghost" onClick={closeCamera}>Close</button>
              </div>

              <canvas ref={canvasRef} hidden />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
