import React, { useState } from "react";
import Layout from "../components/Layout.jsx";

import amazonLogo from "../assets/amazon.svg";
import flipkartLogo from "../assets/flipkart.svg";
import shopifyLogo from "../assets/shopify.svg";
import meeshoLogo from "../assets/meesho.svg";
import myntraLogo from "../assets/myntra.svg";
import bigcommerceLogo from "../assets/bigcommerce.svg";
import etsyLogo from "../assets/esty.svg";
import walmartLogo from "../assets/walmart.svg";

const marketplaces = [
  {
    name: "Amazon",
    type: "Marketplaces",
    logo: amazonLogo,
    description:
      "Connect your Amazon seller account and sync products, inventory and orders.",
  },
  {
    name: "Flipkart",
    type: "Marketplaces",
    logo: flipkartLogo,
    description:
      "Connect Flipkart to manage your marketplace products and orders.",
  },
  {
    name: "Shopify",
    type: "Websites",
    logo: shopifyLogo,
    description:
      "Connect your Shopify store and keep your commerce data synchronized.",
  },
  {
    name: "Meesho",
    type: "Marketplaces",
    logo: meeshoLogo,
    description:
      "Manage your Meesho marketplace data from Merchantra.",
  },
  {
    name: "Myntra",
    type: "Marketplaces",
    logo: myntraLogo,
    description:
      "Connect Myntra for centralized product and order management.",
  },
  {
    name: "BigCommerce",
    type: "Websites",
    logo: bigcommerceLogo,
    description:
      "Connect your BigCommerce store with your Merchantra workspace.",
  },
  {
    name: "Etsy",
    type: "Marketplaces",
    logo: etsyLogo,
    description:
      "Connect Etsy and manage your marketplace information centrally.",
  },
  {
    name: "Walmart",
    type: "Marketplaces",
    logo: walmartLogo,
    description:
      "Connect Walmart Marketplace with your Merchantra account.",
  },
];

export default function Marketplaces() {
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);

  const openConnect = (marketplace) => {
    setSelectedMarketplace(marketplace);
  };

  const closeConnect = () => {
    setSelectedMarketplace(null);
  };

  return (
    <Layout title="Marketplaces & Apps">
      <div className="min-h-full bg-[#f4f7fa]">

        {/* HEADER */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400">
            MERCHANTRA WORKSPACE
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[#17354a]">
            Marketplaces & Apps
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Connect your marketplaces, stores and business applications with
            Merchantra.
          </p>
        </div>

        {/* SEARCH / FILTER */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Search apps or marketplaces..."
            className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
          />

          <select className="h-12 w-44 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none">
            <option>All</option>
            <option>Marketplaces</option>
            <option>Websites</option>
          </select>
        </div>

        {/* MARKETPLACE CARDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {marketplaces.map((marketplace) => (
            <div
              key={marketplace.name}
              className="flex min-h-[330px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* LOGO */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eef7f9]">
                <img
                  src={marketplace.logo}
                  alt={`${marketplace.name} logo`}
                  className="max-h-11 max-w-11 object-contain"
                />
              </div>

              {/* NAME */}
              <h2 className="mt-6 text-lg font-medium text-[#17354a]">
                {marketplace.name}
              </h2>

              {/* TYPE */}
              <p className="mt-1 text-xs text-slate-400">
                {marketplace.type}
              </p>

              {/* DESCRIPTION */}
              <p className="mt-5 text-sm leading-6 text-slate-500">
                {marketplace.description}
              </p>

              {/* CONNECT BUTTON */}
              <button
                type="button"
                onClick={() => openConnect(marketplace)}
                className="mt-auto w-full rounded-lg bg-[#288da0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#207c8d] active:scale-[0.98]"
              >
                Connect {marketplace.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CONNECT MODAL */}
      {selectedMarketplace && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={closeConnect}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef7f9]">
                  <img
                    src={selectedMarketplace.logo}
                    alt={`${selectedMarketplace.name} logo`}
                    className="max-h-9 max-w-9 object-contain"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[#17354a]">
                    Connect {selectedMarketplace.name}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {selectedMarketplace.type}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeConnect}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Connect your{" "}
                <strong>{selectedMarketplace.name}</strong> account to
                synchronize products, inventory and orders with Merchantra.
              </p>
            </div>

            {/* ACCOUNT FIELD */}
            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Account / Store ID
              </label>

              <input
                type="text"
                placeholder={`Enter ${selectedMarketplace.name} account`}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-cyan-400"
              />
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeConnect}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(
                    `${selectedMarketplace.name} connection flow is ready.`
                  );
                  closeConnect();
                }}
                className="flex-1 rounded-xl bg-[#288da0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#207c8d]"
              >
                Connect Account
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}