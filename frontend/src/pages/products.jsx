import React, { useEffect, useMemo, useState } from "react";
console.log("NEW MERCHANTRA PRODUCTS PAGE");

import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";
import "./Products.css";

const STORAGE_KEY = "merchantra_product_workspace";
const DRAFT_KEY = "merchantra_product_drafts";

const MARKETPLACES = [
  { id: "amazon", name: "Amazon", short: "AM" },
  { id: "flipkart", name: "Flipkart", short: "FK" },
  { id: "meesho", name: "Meesho", short: "ME" },
  { id: "myntra", name: "Myntra", short: "MY" },
];

const STEPS = [
  "Product Details",
  "Marketplaces",
  "Costing & Pricing",
  "AI Recommendation",
  "Review & Publish",
];

const EMPTY_COSTS = {
  product: 0,
  packaging: 0,
  shipping: 0,
  marketplaceFee: 0,
  paymentFee: 0,
  advertising: 0,
  other: 0,
};

function money(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateTotalCost(costs = EMPTY_COSTS) {
  return Object.values(costs).reduce(
    (total, value) => total + numberValue(value),
    0
  );
}

function calculateProfit(price, totalCost) {
  return numberValue(price) - numberValue(totalCost);
}

function calculateMargin(price, profit) {
  const sellingPrice = numberValue(price);

  if (sellingPrice <= 0) return 0;

  return (numberValue(profit) / sellingPrice) * 100;
}

function calculateRecommendedPrice(totalCost, targetMargin) {
  const cost = numberValue(totalCost);
  const margin = numberValue(targetMargin);

  if (cost <= 0) return 0;
  if (margin >= 100) return 0;

  const denominator = 1 - margin / 100;

  if (denominator <= 0) return 0;

  return cost / denominator;
}

function calculateMinimumSellingPrice(totalCost, minimumMargin) {
  const cost = numberValue(totalCost);
  const margin = numberValue(minimumMargin);

  if (cost <= 0) return 0;
  if (margin >= 100) return 0;

  const denominator = 1 - margin / 100;

  if (denominator <= 0) return 0;

  return cost / denominator;
}

function createMarketplaceState(existing = {}, defaultProductCost = 0) {
  const state = {};

  MARKETPLACES.forEach((marketplace) => {
    const old = existing[marketplace.id] || {};

    const oldCosts = old.costs || {};

    const costs = {
      ...EMPTY_COSTS,
      ...oldCosts,
    };

    /*
     * When a marketplace is newly selected, automatically carry
     * the Product Cost from Step 1 into that marketplace.
     *
     * Existing saved marketplace-specific costs are preserved.
     */
    if (
      numberValue(costs.product) <= 0 &&
      numberValue(defaultProductCost) > 0
    ) {
      costs.product = numberValue(defaultProductCost);
    }

    const totalCost = calculateTotalCost(costs);
    const sellingPrice = numberValue(old.sellingPrice);

    state[marketplace.id] = {
      selected: Boolean(old.selected),
      costs,
      totalCost,
      sellingPrice,
      expectedProfit: calculateProfit(sellingPrice, totalCost),
      profitMargin: calculateMargin(
        sellingPrice,
        calculateProfit(sellingPrice, totalCost)
      ),
    };
  });

  return state;
}

function createEmptyForm() {
  return {
    id: null,
    permanent_product_id: null,
    name: "",
    category: "",
    sku: "",
    description: "",
    stock: 0,
    productCost: 0,
    images: [],
    marketplaces: createMarketplaceState(),
    minimumMargin: 15,
    targetMargin: 30,
    status: "DRAFT",
  };
}

function normalizeProduct(product) {
  if (!product) return null;

  const localProduct = {
    ...product,
  };

  const stock =
    product.stock ??
    product.stock_quantity ??
    product.quantity ??
    0;

  const productCost = numberValue(
    product.productCost ?? product.product_cost
  );

  const marketplaces = createMarketplaceState(
    product.marketplaces || {},
    productCost
  );

  return {
    ...localProduct,
    name: product.name || "",
    category: product.category || "",
    sku: product.sku || "",
    description: product.description || "",
    stock: numberValue(stock),
    productCost,
    images: Array.isArray(product.images) ? product.images : [],
    marketplaces,
    status: product.status || "ACTIVE",
  };
}

function getStoredProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredProducts(products) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );
  } catch (error) {
    console.warn(
      "Unable to save local product workspace.",
      error
    );
  }
}

function getDrafts() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify(drafts)
    );
  } catch (error) {
    console.warn(
      "Unable to save product drafts.",
      error
    );
  }
}

function MarketplaceLogo({ marketplace }) {
  return (
    <div
      className={`product-marketplace-logo product-marketplace-logo--${marketplace.id}`}
    >
      {marketplace.short}
    </div>
  );
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="products-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </div>
  );
}

function CostInput({ label, value, onChange }) {
  return (
    <label className="products-field">
      <span>{label}</span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showWorkflow, setShowWorkflow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(createEmptyForm());

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [viewProduct, setViewProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const [connectedMarketplaces, setConnectedMarketplaces] =
    useState(
      MARKETPLACES.map(
        (marketplace) => marketplace.id
      )
    );

  const [recommendationMarketplace, setRecommendationMarketplace] =
    useState("");

  useEffect(() => {
    loadProducts();
    loadMarketplaceConnections();
  }, []);

  function loadMarketplaceConnections() {
    try {
      const stored = localStorage.getItem(
        "merchantra_connected_marketplaces"
      );

      if (!stored) return;

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed) && parsed.length) {
        setConnectedMarketplaces(parsed);
      }
    } catch {
      // Keep the existing local demo connection state.
    }
  }

  async function loadProducts() {
    setError("");

    try {
      const remote = await api.products.list();

      const remoteProducts = Array.isArray(remote)
        ? remote.map(normalizeProduct)
        : [];

      const localProducts = getStoredProducts().map(
        normalizeProduct
      );

      const merged = [...remoteProducts];

      localProducts.forEach((localProduct) => {
        const identifier =
          localProduct.permanent_product_id ||
          localProduct.id ||
          localProduct.sku;

        const alreadyExists = merged.some(
          (product) =>
            (product.permanent_product_id ||
              product.id ||
              product.sku) === identifier
        );

        if (!alreadyExists) {
          merged.push(localProduct);
        }
      });

      setProducts(merged);
    } catch (err) {
      const localProducts =
        getStoredProducts().map(normalizeProduct);

      setProducts(localProducts);

      setError(
        err.message ||
          "Unable to load products from the backend. Showing saved local products."
      );
    }
  }

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => product.status === "ACTIVE"
      ),
    [products]
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          numberValue(product.stock) > 0 &&
          numberValue(product.stock) <= 10
      ),
    [products]
  );

  const marketplaceListingCount = useMemo(
    () =>
      products.reduce((total, product) => {
        return (
          total +
          MARKETPLACES.filter(
            (marketplace) =>
              product.marketplaces?.[
                marketplace.id
              ]?.selected
          ).length
        );
      }, 0),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.name || "")
          .toLowerCase()
          .includes(query) ||
        String(product.sku || "")
          .toLowerCase()
          .includes(query) ||
        String(product.category || "")
          .toLowerCase()
          .includes(query);

      const status = String(
        product.status || ""
      ).toUpperCase();

      let matchesFilter = true;

      if (filter === "Active") {
        matchesFilter = status === "ACTIVE";
      }

      if (filter === "Draft") {
        matchesFilter = status === "DRAFT";
      }

      if (filter === "Low Stock") {
        matchesFilter =
          numberValue(product.stock) > 0 &&
          numberValue(product.stock) <= 10;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  function openNewProduct() {
    setError("");
    setNotice("");
    setForm(createEmptyForm());
    setCurrentStep(0);
    setRecommendationMarketplace("");
    setShowWorkflow(true);
  }

  function closeWorkflow() {
    setShowWorkflow(false);
    setCurrentStep(0);
    setRecommendationMarketplace("");
  }

  function openEdit(product) {
    const normalized = normalizeProduct(product);

    setForm({
      ...createEmptyForm(),
      ...normalized,
      marketplaces: createMarketplaceState(
        normalized.marketplaces,
        normalized.productCost
      ),
      images: normalized.images || [],
    });

    setCurrentStep(0);

    setRecommendationMarketplace(
      MARKETPLACES.find(
        (marketplace) =>
          normalized.marketplaces?.[
            marketplace.id
          ]?.selected
      )?.id || ""
    );

    setError("");
    setNotice("");
    setViewProduct(null);
    setShowWorkflow(true);
  }

  function updateFormField(field, value) {
    setForm((previous) => {
      const nextForm = {
        ...previous,
        [field]: value,
      };

      /*
       * Keep the marketplace Product Cost synchronized with
       * Step 1 when the user changes the main Product Cost.
       *
       * We only update selected marketplaces whose product
       * cost has not been manually changed yet.
       */
      if (field === "productCost") {
        const productCost = numberValue(value);

        const nextMarketplaces = {
          ...previous.marketplaces,
        };

        MARKETPLACES.forEach((marketplace) => {
          const current =
            previous.marketplaces[
              marketplace.id
            ];

          if (!current?.selected) return;

          const costs = {
            ...EMPTY_COSTS,
            ...(current.costs || {}),
          };

          if (
            numberValue(costs.product) <= 0 ||
            numberValue(costs.product) ===
              numberValue(previous.productCost)
          ) {
            costs.product = productCost;

            const totalCost =
              calculateTotalCost(costs);

            const currentSellingPrice =
              numberValue(
                current.sellingPrice
              );

            const minimumPrice =
              calculateMinimumSellingPrice(
                totalCost,
                previous.minimumMargin
              );

            const sellingPrice =
              currentSellingPrice <= 0
                ? Math.ceil(minimumPrice)
                : currentSellingPrice;

            const expectedProfit =
              calculateProfit(
                sellingPrice,
                totalCost
              );

            nextMarketplaces[
              marketplace.id
            ] = {
              ...current,
              costs,
              totalCost,
              sellingPrice,
              expectedProfit,
              profitMargin:
                calculateMargin(
                  sellingPrice,
                  expectedProfit
                ),
            };
          }
        });

        nextForm.marketplaces =
          nextMarketplaces;
      }

      return nextForm;
    });
  }

  function updateMarketplace(
    marketplaceId,
    updates
  ) {
    setForm((previous) => {
      const oldMarketplace =
        previous.marketplaces[
          marketplaceId
        ] || {
          selected: false,
          costs: {
            ...EMPTY_COSTS,
          },
          sellingPrice: 0,
        };

      const nextMarketplace = {
        ...oldMarketplace,
        ...updates,
      };

      const costs = {
        ...EMPTY_COSTS,
        ...(nextMarketplace.costs || {}),
      };

      const totalCost =
        calculateTotalCost(costs);

      const sellingPrice =
        numberValue(
          nextMarketplace.sellingPrice
        );

      const expectedProfit =
        calculateProfit(
          sellingPrice,
          totalCost
        );

      nextMarketplace.costs = costs;
      nextMarketplace.totalCost = totalCost;
      nextMarketplace.sellingPrice =
        sellingPrice;
      nextMarketplace.expectedProfit =
        expectedProfit;
      nextMarketplace.profitMargin =
        calculateMargin(
          sellingPrice,
          expectedProfit
        );

      return {
        ...previous,
        marketplaces: {
          ...previous.marketplaces,
          [marketplaceId]:
            nextMarketplace,
        },
      };
    });
  }

  function updateMarketplaceCost(
    marketplaceId,
    costKey,
    value
  ) {
    setForm((previous) => {
      const marketplace =
        previous.marketplaces[
          marketplaceId
        ] || {
          selected: false,
          costs: {
            ...EMPTY_COSTS,
          },
          sellingPrice: 0,
        };

      const oldTotalCost =
        numberValue(
          marketplace.totalCost
        );

      const oldSellingPrice =
        numberValue(
          marketplace.sellingPrice
        );

      const costs = {
        ...EMPTY_COSTS,
        ...(marketplace.costs || {}),
        [costKey]: numberValue(value),
      };

      const totalCost =
        calculateTotalCost(costs);

      /*
       * If the marketplace is still using an automatically
       * generated selling price, keep it above the minimum
       * required margin when costs increase.
       */
      const minimumPrice =
        calculateMinimumSellingPrice(
          totalCost,
          previous.minimumMargin
        );

      let sellingPrice =
        oldSellingPrice;

      if (
        oldSellingPrice <= 0 ||
        oldSellingPrice <= oldTotalCost
      ) {
        sellingPrice =
          Math.ceil(minimumPrice);
      }

      const expectedProfit =
        calculateProfit(
          sellingPrice,
          totalCost
        );

      return {
        ...previous,
        marketplaces: {
          ...previous.marketplaces,
          [marketplaceId]: {
            ...marketplace,
            costs,
            totalCost,
            sellingPrice,
            expectedProfit,
            profitMargin:
              calculateMargin(
                sellingPrice,
                expectedProfit
              ),
          },
        },
      };
    });
  }

  function toggleMarketplace(marketplaceId) {
    if (
      !connectedMarketplaces.includes(
        marketplaceId
      )
    ) {
      setError(
        "This marketplace is not connected."
      );
      return;
    }

    setError("");

    const marketplace =
      form.marketplaces[
        marketplaceId
      ] || {
        selected: false,
        costs: {
          ...EMPTY_COSTS,
        },
        sellingPrice: 0,
      };

    const nextSelected =
      !marketplace.selected;

    if (nextSelected) {
      const currentCosts = {
        ...EMPTY_COSTS,
        ...(marketplace.costs || {}),
      };

      /*
       * Automatically use Step 1 Product Cost.
       */
      if (
        numberValue(
          currentCosts.product
        ) <= 0
      ) {
        currentCosts.product =
          numberValue(
            form.productCost
          );
      }

      const totalCost =
        calculateTotalCost(
          currentCosts
        );

      /*
       * Automatically create a valid initial
       * selling price using minimum margin.
       */
      const minimumPrice =
        calculateMinimumSellingPrice(
          totalCost,
          form.minimumMargin
        );

      const currentPrice =
        numberValue(
          marketplace.sellingPrice
        );

      const sellingPrice =
        currentPrice > 0
          ? currentPrice
          : Math.ceil(minimumPrice);

      updateMarketplace(
        marketplaceId,
        {
          selected: true,
          costs: currentCosts,
          sellingPrice,
        }
      );

      if (!recommendationMarketplace) {
        setRecommendationMarketplace(
          marketplaceId
        );
      }
    } else {
      updateMarketplace(
        marketplaceId,
        {
          selected: false,
        }
      );

      if (
        recommendationMarketplace ===
        marketplaceId
      ) {
        const nextSelectedMarketplace =
          MARKETPLACES.find(
            (item) =>
              item.id !==
                marketplaceId &&
              form.marketplaces[
                item.id
              ]?.selected
          );

        setRecommendationMarketplace(
          nextSelectedMarketplace?.id ||
            ""
        );
      }
    }
  }

  async function handleImages(event) {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size <=
          2 * 1024 * 1024
    );

    if (!validFiles.length) {
      setError(
        "Please select image files up to 2 MB each."
      );
      return;
    }

    const readers = validFiles.map(
      (file) =>
        new Promise((resolve) => {
          const reader =
            new FileReader();

          reader.onload = () =>
            resolve({
              name: file.name,
              url: reader.result,
            });

          reader.readAsDataURL(file);
        })
    );

    const images =
      await Promise.all(readers);

    setForm((previous) => ({
      ...previous,
      images: [
        ...previous.images,
        ...images,
      ].slice(0, 5),
    }));

    setError("");
  }

  function removeImage(index) {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter(
        (_, imageIndex) =>
          imageIndex !== index
      ),
    }));
  }

  function aiExtractProductDetails() {
    const name =
      form.name.trim();

    if (!name) {
      setError(
        "Enter a product name before using AI extraction."
      );
      return;
    }

    const words =
      name.split(/\s+/);

    const generatedCategory =
      form.category.trim() ||
      (words.length > 1
        ? words[0]
        : "General");

    const generatedDescription =
      form.description.trim() ||
      `${name} — product listing prepared for multi-marketplace publishing.`;

    setForm((previous) => ({
      ...previous,
      category:
        generatedCategory,
      description:
        generatedDescription,
    }));

    setNotice(
      "Product details were extracted into editable fields. Review them before continuing."
    );

    setError("");
  }

  function validateStep(
    step = currentStep
  ) {
    setError("");

    if (step === 0) {
      if (!form.name.trim()) {
        setError(
          "Product name is required."
        );
        return false;
      }

      if (!form.category.trim()) {
        setError(
          "Category is required."
        );
        return false;
      }

      if (!form.sku.trim()) {
        setError(
          "SKU is required."
        );
        return false;
      }

      if (
        numberValue(form.stock) < 0
      ) {
        setError(
          "Stock quantity cannot be negative."
        );
        return false;
      }

      if (
        numberValue(
          form.productCost
        ) <= 0
      ) {
        setError(
          "Product cost must be greater than 0."
        );
        return false;
      }
    }

    if (step === 1) {
      const selected =
        MARKETPLACES.filter(
          (marketplace) =>
            form.marketplaces[
              marketplace.id
            ]?.selected
        );

      if (!selected.length) {
        setError(
          "Select at least one connected marketplace."
        );
        return false;
      }
    }

    if (step === 2) {
      const selected =
        MARKETPLACES.filter(
          (marketplace) =>
            form.marketplaces[
              marketplace.id
            ]?.selected
        );

      if (!selected.length) {
        setError(
          "Select at least one marketplace."
        );
        return false;
      }

      for (const marketplace of selected) {
        const data =
          form.marketplaces[
            marketplace.id
          ];

        if (!data) {
          setError(
            `Unable to load pricing data for ${marketplace.name}.`
          );
          return false;
        }

        if (
          numberValue(
            data.totalCost
          ) <= 0
        ) {
          setError(
            `Enter costing information for ${marketplace.name}.`
          );
          return false;
        }

        if (
          numberValue(
            data.sellingPrice
          ) <= 0
        ) {
          setError(
            `Selling price for ${marketplace.name} must be greater than 0.`
          );
          return false;
        }

        if (
          numberValue(
            data.sellingPrice
          ) <=
          numberValue(
            data.totalCost
          )
        ) {
          setError(
            `${marketplace.name}: selling price must be higher than total cost.`
          );
          return false;
        }

        if (
          numberValue(
            data.profitMargin
          ) <
          numberValue(
            form.minimumMargin
          )
        ) {
          setError(
            `${marketplace.name}: profit margin is below your minimum margin. Increase the selling price.`
          );
          return false;
        }
      }
    }

    if (step === 3) {
      if (
        numberValue(
          form.minimumMargin
        ) < 0
      ) {
        setError(
          "Minimum margin cannot be negative."
        );
        return false;
      }

      if (
        numberValue(
          form.minimumMargin
        ) >= 100
      ) {
        setError(
          "Minimum margin must be below 100%."
        );
        return false;
      }

      if (
        numberValue(
          form.targetMargin
        ) >= 100
      ) {
        setError(
          "Target margin must be below 100%."
        );
        return false;
      }

      if (
        numberValue(
          form.targetMargin
        ) <
        numberValue(
          form.minimumMargin
        )
      ) {
        setError(
          "Target margin must be equal to or higher than minimum margin."
        );
        return false;
      }

      if (
        !recommendationMarketplace
      ) {
        setError(
          "Select a marketplace for the AI recommendation."
        );
        return false;
      }

      const recommendation =
        form.marketplaces[
          recommendationMarketplace
        ];

      if (
        !recommendation?.selected
      ) {
        setError(
          "Select the recommendation marketplace first."
        );
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    if (
      !validateStep(
        currentStep
      )
    ) {
      return;
    }

    setCurrentStep(
      (previous) =>
        Math.min(
          previous + 1,
          STEPS.length - 1
        )
    );
  }

  function previousStep() {
    setError("");

    setCurrentStep(
      (previous) =>
        Math.max(
          previous - 1,
          0
        )
    );
  }

  function applyRecommendation() {
    const marketplaceId =
      recommendationMarketplace;

    if (!marketplaceId) {
      setError(
        "Select a marketplace first."
      );
      return;
    }

    const marketplace =
      form.marketplaces[
        marketplaceId
      ];

    if (
      !marketplace?.selected
    ) {
      setError(
        "Select this marketplace first."
      );
      return;
    }

    const recommended =
      calculateRecommendedPrice(
        marketplace.totalCost,
        form.targetMargin
      );

    if (!recommended) {
      setError(
        "Unable to calculate a recommended price."
      );
      return;
    }

    updateMarketplace(
      marketplaceId,
      {
        sellingPrice:
          Math.ceil(
            recommended
          ),
      }
    );

    setNotice(
      `Recommended price applied to ${
        MARKETPLACES.find(
          (item) =>
            item.id ===
            marketplaceId
        )?.name
      }.`
    );

    setError("");
  }

  function keepCurrentPrice() {
    setNotice(
      "Current selling price kept unchanged."
    );
    setError("");
  }

  function buildProductPayload(
    status = "ACTIVE"
  ) {
    return {
      name: form.name.trim(),
      category:
        form.category.trim(),
      sku: form.sku.trim(),
      description:
        form.description.trim(),
      stock: numberValue(
        form.stock
      ),
      productCost:
        numberValue(
          form.productCost
        ),
      status,
    };
  }

  function buildRichProduct(
    status = "ACTIVE",
    backendProduct = {}
  ) {
    const marketplaceData = {};

    MARKETPLACES.forEach(
      (marketplace) => {
        const data =
          form.marketplaces[
            marketplace.id
          ];

        if (data) {
          marketplaceData[
            marketplace.id
          ] = {
            selected:
              Boolean(
                data.selected
              ),
            costs: {
              ...data.costs,
            },
            totalCost:
              numberValue(
                data.totalCost
              ),
            sellingPrice:
              numberValue(
                data.sellingPrice
              ),
            expectedProfit:
              numberValue(
                data.expectedProfit
              ),
            profitMargin:
              numberValue(
                data.profitMargin
              ),
          };
        }
      }
    );

    return normalizeProduct({
      ...backendProduct,

      id:
        backendProduct.id ||
        form.id ||
        `local-${Date.now()}`,

      permanent_product_id:
        backendProduct.permanent_product_id ||
        form.permanent_product_id ||
        null,

      name:
        form.name.trim(),

      category:
        form.category.trim(),

      sku:
        form.sku.trim(),

      description:
        form.description.trim(),

      stock:
        numberValue(
          form.stock
        ),

      productCost:
        numberValue(
          form.productCost
        ),

      images:
        form.images || [],

      marketplaces:
        marketplaceData,

      status,

      minimumMargin:
        numberValue(
          form.minimumMargin
        ),

      targetMargin:
        numberValue(
          form.targetMargin
        ),

      marketplaceListings:
        MARKETPLACES.filter(
          (marketplace) =>
            form.marketplaces[
              marketplace.id
            ]?.selected
        ).map(
          (marketplace) =>
            marketplace.id
        ),

      publishedAt:
        status === "ACTIVE"
          ? new Date().toISOString()
          : null,
    });
  }

  async function saveDraft() {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const draft =
        buildRichProduct(
          "DRAFT"
        );

      const drafts =
        getDrafts();

      const index =
        drafts.findIndex(
          (item) =>
            (item.id &&
              item.id ===
                draft.id) ||
            (item.permanent_product_id &&
              item.permanent_product_id ===
                draft.permanent_product_id)
        );

      if (index >= 0) {
        drafts[index] =
          draft;
      } else {
        drafts.push(
          draft
        );
      }

      saveDrafts(drafts);

      const existingIndex =
        products.findIndex(
          (item) =>
            (draft.id &&
              item.id ===
                draft.id) ||
            (draft.permanent_product_id &&
              item.permanent_product_id ===
                draft.permanent_product_id)
        );

      const nextProducts =
        [...products];

      if (
        existingIndex >= 0
      ) {
        nextProducts[
          existingIndex
        ] = draft;
      } else {
        nextProducts.push(
          draft
        );
      }

      setProducts(
        nextProducts
      );

      saveStoredProducts(
        nextProducts
      );

      setNotice(
        "Draft saved successfully. You can edit it later."
      );

      closeWorkflow();
    } catch (err) {
      setError(
        err.message ||
          "Unable to save draft."
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishProduct() {
  if (!validateStep(0)) {
    setCurrentStep(0);
    return;
  }

  if (!validateStep(1)) {
    setCurrentStep(1);
    return;
  }

  if (!validateStep(2)) {
    setCurrentStep(2);
    return;
  }

  if (!validateStep(3)) {
    setCurrentStep(3);
    return;
  }

  setSaving(true);
  setError("");
  setNotice("");

  try {
    let backendProduct = {};

    /*
     * IMPORTANT:
     *
     * A local product can have an `id`, for example:
     * local-123456789
     *
     * That ID does NOT belong to the C++ backend.
     *
     * The backend identifies products using:
     * permanent_product_id
     *
     * Therefore we ONLY treat the product as an existing
     * backend product when permanent_product_id exists.
     */
    const isBackendProduct =
      Boolean(form.permanent_product_id);

    const basicPayload =
      buildProductPayload("ACTIVE");

    if (
      isBackendProduct &&
      typeof api.products.update === "function"
    ) {
      /*
       * Existing backend product:
       * update using permanent_product_id.
       */
      backendProduct =
        (await api.products.update(
          form.permanent_product_id,
          basicPayload
        )) || {};
    } else {
      /*
       * New product OR local-only draft:
       *
       * Even if form.id exists locally, it does NOT mean
       * the product exists in the backend.
       *
       * Therefore create a new backend product.
       */
      backendProduct =
        (await api.products.create(
          basicPayload
        )) || {};
    }

    /*
     * Backend createProduct() returns:
     *
     * id
     * permanent_product_id
     * name
     * description
     * category
     * sku
     * status
     *
     * Keep the backend permanent_product_id.
     */
    const savedProduct =
      buildRichProduct(
        "ACTIVE",
        backendProduct
      );

    const nextProducts =
      [...products];

    /*
     * Match products primarily by permanent_product_id.
     *
     * Local draft IDs must not be treated as backend IDs.
     */
    const existingIndex =
      nextProducts.findIndex(
        (product) => {
          if (
            savedProduct.permanent_product_id &&
            product.permanent_product_id
          ) {
            return (
              product.permanent_product_id ===
              savedProduct.permanent_product_id
            );
          }

          return (
            product.sku &&
            savedProduct.sku &&
            product.sku === savedProduct.sku
          );
        }
      );

    if (existingIndex >= 0) {
      nextProducts[existingIndex] =
        savedProduct;
    } else {
      nextProducts.unshift(
        savedProduct
      );
    }

    setProducts(nextProducts);

    saveStoredProducts(
      nextProducts
    );

    /*
     * Remove the corresponding local draft.
     *
     * We remove both:
     * - old local draft ID
     * - newly created backend permanent ID
     */
    const drafts =
      getDrafts().filter(
        (draft) => {
          const sameLocalId =
            form.id &&
            draft.id === form.id;

          const sameBackendId =
            form.permanent_product_id &&
            draft.permanent_product_id ===
              form.permanent_product_id;

          const sameSavedBackendId =
            savedProduct.permanent_product_id &&
            draft.permanent_product_id ===
              savedProduct.permanent_product_id;

          return !(
            sameLocalId ||
            sameBackendId ||
            sameSavedBackendId
          );
        }
      );

    saveDrafts(drafts);

    setNotice(
      "Product published successfully."
    );

    closeWorkflow();

  } catch (err) {
    console.error(
      "Product publish error:",
      err
    );

    setError(
      err.message ||
        "Publishing failed. Please check the product details and backend connection."
    );
  } finally {
    setSaving(false);
  }
}

  async function deleteProduct(
    product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed)
      return;

    setError("");
    setNotice("");

    try {
      if (
        typeof api.products
          .delete ===
          "function" &&
        (product.permanent_product_id ||
          product.id)
      ) {
        await api.products.delete(
          product.permanent_product_id ||
            product.id
        );
      }

      const nextProducts =
        products.filter(
          (item) =>
            item !== product &&
            item.id !==
              product.id &&
            item.permanent_product_id !==
              product.permanent_product_id
        );

      setProducts(
        nextProducts
      );

      saveStoredProducts(
        nextProducts
      );

      setNotice(
        "Product deleted successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete product."
      );
    }
  }

  function openView(product) {
    setViewProduct(
      normalizeProduct(product)
    );
  }

  const selectedMarketplaces =
    MARKETPLACES.filter(
      (marketplace) =>
        form.marketplaces[
          marketplace.id
        ]?.selected
    );

  const recommendationData =
    recommendationMarketplace &&
    form.marketplaces[
      recommendationMarketplace
    ];

  const recommendedPrice =
    recommendationData
      ? calculateRecommendedPrice(
          recommendationData.totalCost,
          form.targetMargin
        )
      : 0;

  return (
    <Layout title="Products">
      <div className="products-page">
        <div className="products-hero">
          <div>
            <div className="products-eyebrow">
              CATALOG MANAGEMENT
            </div>

            <h1>Products</h1>

            <p>
              Manage your product identity,
              pricing, marketplace listings
              and lifecycle status.
            </p>
          </div>

          <button
            className="products-primary-btn"
            onClick={openNewProduct}
          >
            + Add Product
          </button>
        </div>

        {notice && (
          <div className="products-alert products-alert--success">
            <span>✓</span>
            {notice}
          </div>
        )}

        {error && (
          <div className="products-alert products-alert--error">
            <span>!</span>
            {error}
          </div>
        )}

        <div className="products-summary-grid">
          <SummaryCard
            label="Total Products"
            value={products.length}
            helper="All catalog records"
          />

          <SummaryCard
            label="Active Listings"
            value={
              activeProducts.length
            }
            helper="Published products"
          />

          <SummaryCard
            label="Low Stock"
            value={
              lowStockProducts.length
            }
            helper="10 units or less"
          />

          <SummaryCard
            label="Marketplace Listings"
            value={
              marketplaceListingCount
            }
            helper="Selected marketplace channels"
          />
        </div>

        <section className="products-panel">
          <div className="products-panel-header">
            <div>
              <h2>
                Product Catalog
              </h2>

              <p>
                Search and manage your
                complete product lifecycle.
              </p>
            </div>

            <span className="products-count-pill">
              {
                filteredProducts.length
              }{" "}
              records
            </span>
          </div>

          <div className="products-toolbar">
            <div className="products-search">
              <span>⌕</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU or category..."
              />
            </div>

            <div className="products-filter-group">
              {[
                "All",
                "Active",
                "Draft",
                "Low Stock",
              ].map((item) => (
                <button
                  key={item}
                  className={
                    filter === item
                      ? "products-filter products-filter--active"
                      : "products-filter"
                  }
                  onClick={() =>
                    setFilter(item)
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length ===
          0 ? (
            <div className="products-empty">
              <div className="products-empty-icon">
                □
              </div>

              <h3>
                No products found
              </h3>

              <p>
                Create your first product
                to start the MERCHANTRA
                catalog workflow.
              </p>

              <button
                className="products-primary-btn"
                onClick={
                  openNewProduct
                }
              >
                + Add Product
              </button>
            </div>
          ) : (
            <div className="products-table-wrap">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>
                      Product
                    </th>
                    <th>SKU</th>
                    <th>
                      Category
                    </th>
                    <th>Cost</th>
                    <th>
                      Selling Price
                    </th>
                    <th>Stock</th>
                    <th>
                      Marketplaces
                    </th>
                    <th>
                      Margin
                    </th>
                    <th>Status</th>
                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => {
                      const selected =
                        MARKETPLACES.filter(
                          (marketplace) =>
                            product
                              .marketplaces?.[
                              marketplace.id
                            ]?.selected
                        );

                      const firstMarketplace =
                        selected[0] ||
                        MARKETPLACES.find(
                          (marketplace) =>
                            product
                              .marketplaces?.[
                              marketplace.id
                            ]
                        );

                      const marketplaceData =
                        firstMarketplace &&
                        product
                          .marketplaces?.[
                          firstMarketplace.id
                        ];

                      return (
                        <tr
                          key={
                            product.id ||
                            product.permanent_product_id ||
                            product.sku
                          }
                        >
                          <td>
                            <div className="products-name-cell">
                              <div className="products-thumb">
                                {product
                                  .images?.[0]
                                  ?.url ? (
                                  <img
                                    src={
                                      product
                                        .images[0]
                                        .url
                                    }
                                    alt={
                                      product.name
                                    }
                                  />
                                ) : (
                                  <span>
                                    {(
                                      product.name ||
                                      "P"
                                    )
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div>
                                <strong>
                                  {product.name ||
                                    "Unnamed Product"}
                                </strong>

                                {product.permanent_product_id && (
                                  <Link
                                    to={`/products/${product.permanent_product_id}`}
                                    className="products-id-link"
                                  >
                                    {
                                      product.permanent_product_id
                                    }
                                  </Link>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="products-mono">
                            {product.sku ||
                              "—"}
                          </td>

                          <td>
                            {product.category ||
                              "—"}
                          </td>

                          <td>
                            {money(
                              product.productCost
                            )}
                          </td>

                          <td>
                            {marketplaceData
                              ? money(
                                  marketplaceData.sellingPrice
                                )
                              : "—"}
                          </td>

                          <td>
                            <span
                              className={
                                numberValue(
                                  product.stock
                                ) <= 10
                                  ? "products-stock products-stock--low"
                                  : "products-stock"
                              }
                            >
                              {numberValue(
                                product.stock
                              )}
                            </span>
                          </td>

                          <td>
                            <div className="products-marketplaces">
                              {selected.length ? (
                                selected.map(
                                  (
                                    marketplace
                                  ) => (
                                    <MarketplaceLogo
                                      key={
                                        marketplace.id
                                      }
                                      marketplace={
                                        marketplace
                                      }
                                    />
                                  )
                                )
                              ) : (
                                <span className="products-muted">
                                  None
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            {marketplaceData
                              ? `${numberValue(
                                  marketplaceData.profitMargin
                                ).toFixed(
                                  1
                                )}%`
                              : "—"}
                          </td>

                          <td>
                            <span
                              className={
                                String(
                                  product.status
                                ).toUpperCase() ===
                                "ACTIVE"
                                  ? "products-status products-status--active"
                                  : "products-status products-status--draft"
                              }
                            >
                              {product.status ||
                                "ACTIVE"}
                            </span>
                          </td>

                          <td>
                            <div className="products-actions">
                              <button
                                onClick={() =>
                                  openView(
                                    product
                                  )
                                }
                              >
                                View
                              </button>

                              <button
                                onClick={() =>
                                  openEdit(
                                    product
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="products-action-delete"
                                onClick={() =>
                                  deleteProduct(
                                    product
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showWorkflow && (
          <div className="products-overlay">
            <div className="products-workflow">
              <div className="products-workflow-header">
                <div>
                  <span className="products-workflow-kicker">
                    PRODUCT WORKFLOW
                  </span>

                  <h2>
                    {form.id ||
                    form.permanent_product_id
                      ? "Edit Product"
                      : "Add Product"}
                  </h2>

                  <p>
                    Build, price and publish
                    your product across
                    connected marketplaces.
                  </p>
                </div>

                <button
                  className="products-close-btn"
                  onClick={
                    closeWorkflow
                  }
                >
                  ×
                </button>
              </div>

              <div className="products-stepper">
                {STEPS.map(
                  (step, index) => (
                    <div
                      key={step}
                      className={
                        index ===
                        currentStep
                          ? "products-step products-step--active"
                          : index <
                            currentStep
                          ? "products-step products-step--done"
                          : "products-step"
                      }
                    >
                      <span>
                        {index + 1}
                      </span>

                      <small>
                        {step}
                      </small>
                    </div>
                  )
                )}
              </div>

              <div className="products-workflow-body">
                {currentStep ===
                  0 && (
                  <section>
                    <div className="products-section-heading">
                      <div>
                        <span>
                          STEP 1
                        </span>

                        <h3>
                          Product Details
                        </h3>

                        <p>
                          Create the core
                          product identity
                          and information.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="products-secondary-btn"
                        onClick={
                          aiExtractProductDetails
                        }
                      >
                        ✦ AI Extract Product
                        Details
                      </button>
                    </div>

                    <div className="products-form-grid">
                      <label className="products-field">
                        <span>
                          Product Name *
                        </span>

                        <input
                          value={
                            form.name
                          }
                          onChange={(
                            event
                          ) =>
                            updateFormField(
                              "name",
                              event.target
                                .value
                            )
                          }
                          placeholder="e.g. Premium Cotton Shirt"
                        />
                      </label>

                      <label className="products-field">
                        <span>
                          Category *
                        </span>

                        <input
                          value={
                            form.category
                          }
                          onChange={(
                            event
                          ) =>
                            updateFormField(
                              "category",
                              event.target
                                .value
                            )
                          }
                          placeholder="e.g. Fashion"
                        />
                      </label>

                      <label className="products-field">
                        <span>
                          SKU *
                        </span>

                        <input
                          value={
                            form.sku
                          }
                          onChange={(
                            event
                          ) =>
                            updateFormField(
                              "sku",
                              event.target
                                .value
                            )
                          }
                          placeholder="e.g. SHIRT-001"
                        />
                      </label>

                      <label className="products-field">
                        <span>
                          Stock Quantity
                        </span>

                        <input
                          type="number"
                          min="0"
                          value={
                            form.stock
                          }
                          onChange={(
                            event
                          ) =>
                            updateFormField(
                              "stock",
                              event.target
                                .value
                            )
                          }
                        />
                      </label>

                      <label className="products-field">
                        <span>
                          Product Cost (₹)
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.productCost
                          }
                          onChange={(
                            event
                          ) =>
                            updateFormField(
                              "productCost",
                              event.target
                                .value
                            )
                          }
                        />
                      </label>

                      <div className="products-field products-field--full">
                        <span>
                          Description
                        </span>

                        <textarea
                          rows="4"
                          value={
                            form.description
                          }
                          onChange={(
                            event
                          ) =>
                            updateFormField(
                              "description",
                              event.target
                                .value
                            )
                          }
                          placeholder="Describe your product..."
                        />
                      </div>
                    </div>

                    <div className="products-image-section">
                      <div>
                        <strong>
                          Product Images
                        </strong>

                        <p>
                          Upload up to 5
                          product images.
                        </p>
                      </div>

                      <label className="products-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={
                            handleImages
                          }
                        />

                        <span>
                          ＋
                        </span>

                        <strong>
                          Upload images
                        </strong>

                        <small>
                          PNG, JPG up to 2 MB
                        </small>
                      </label>

                      {form.images
                        .length >
                        0 && (
                        <div className="products-image-grid">
                          {form.images.map(
                            (
                              image,
                              index
                            ) => (
                              <div
                                key={`${image.name}-${index}`}
                                className="products-image-preview"
                              >
                                <img
                                  src={
                                    image.url
                                  }
                                  alt={
                                    image.name
                                  }
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeImage(
                                      index
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {currentStep ===
                  1 && (
                  <section>
                    <div className="products-section-heading">
                      <div>
                        <span>
                          STEP 2
                        </span>

                        <h3>
                          Marketplaces
                        </h3>

                        <p>
                          Select the connected
                          marketplaces where
                          this product should
                          be published.
                        </p>
                      </div>
                    </div>

                    <div className="products-marketplace-grid">
                      {MARKETPLACES.map(
                        (
                          marketplace
                        ) => {
                          const connected =
                            connectedMarketplaces.includes(
                              marketplace.id
                            );

                          const selected =
                            form
                              .marketplaces[
                              marketplace.id
                            ]?.selected;

                          return (
                            <button
                              type="button"
                              key={
                                marketplace.id
                              }
                              disabled={
                                !connected
                              }
                              className={
                                selected
                                  ? "products-marketplace-card products-marketplace-card--selected"
                                  : "products-marketplace-card"
                              }
                              onClick={() =>
                                toggleMarketplace(
                                  marketplace.id
                                )
                              }
                            >
                              <MarketplaceLogo
                                marketplace={
                                  marketplace
                                }
                              />

                              <div>
                                <strong>
                                  {
                                    marketplace.name
                                  }
                                </strong>

                                <span>
                                  {connected
                                    ? selected
                                      ? "Selected"
                                      : "Connected"
                                    : "Not connected"}
                                </span>
                              </div>

                              <div className="products-marketplace-check">
                                {selected
                                  ? "✓"
                                  : ""}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="products-info-box">
                      <strong>
                        Marketplace
                        selection
                      </strong>

                      <p>
                        Only connected
                        marketplaces can
                        be selected. At
                        least one
                        marketplace is
                        required before
                        continuing.
                      </p>
                    </div>
                  </section>
                )}

                {currentStep ===
                  2 && (
                  <section>
                    <div className="products-section-heading">
                      <div>
                        <span>
                          STEP 3
                        </span>

                        <h3>
                          Costing & Pricing
                        </h3>

                        <p>
                          Calculate
                          marketplace-specific
                          costs and
                          profitability before
                          publishing.
                        </p>
                      </div>
                    </div>

                    <div className="products-costing-list">
                      {selectedMarketplaces.map(
                        (
                          marketplace
                        ) => {
                          const data =
                            form
                              .marketplaces[
                              marketplace.id
                            ];

                          return (
                            <div
                              className="products-costing-card"
                              key={
                                marketplace.id
                              }
                            >
                              <div className="products-costing-header">
                                <div>
                                  <MarketplaceLogo
                                    marketplace={
                                      marketplace
                                    }
                                  />

                                  <div>
                                    <strong>
                                      {
                                        marketplace.name
                                      }
                                    </strong>

                                    <span>
                                      Marketplace-specific
                                      pricing
                                    </span>
                                  </div>
                                </div>

                                <div className="products-total-cost">
                                  <small>
                                    TOTAL COST
                                  </small>

                                  <strong>
                                    {money(
                                      data.totalCost
                                    )}
                                  </strong>
                                </div>
                              </div>

                              <div className="products-cost-grid">
                                <CostInput
                                  label="Product Cost"
                                  value={
                                    data.costs
                                      .product
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateMarketplaceCost(
                                      marketplace.id,
                                      "product",
                                      value
                                    )
                                  }
                                />

                                <CostInput
                                  label="Packaging Cost"
                                  value={
                                    data.costs
                                      .packaging
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateMarketplaceCost(
                                      marketplace.id,
                                      "packaging",
                                      value
                                    )
                                  }
                                />

                                <CostInput
                                  label="Shipping / Logistics"
                                  value={
                                    data.costs
                                      .shipping
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateMarketplaceCost(
                                      marketplace.id,
                                      "shipping",
                                      value
                                    )
                                  }
                                />

                                <CostInput
                                  label="Marketplace Fee"
                                  value={
                                    data.costs
                                      .marketplaceFee
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateMarketplaceCost(
                                      marketplace.id,
                                      "marketplaceFee",
                                      value
                                    )
                                  }
                                />

                                <CostInput
                                  label="Payment / Transaction"
                                  value={
                                    data.costs
                                      .paymentFee
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateMarketplaceCost(
                                      marketplace.id,
                                      "paymentFee",
                                      value
                                    )
                                  }
                                />

                                <CostInput
                                  label="Advertising Cost"
                                  value={
                                    data.costs
                                      .advertising
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateMarketplaceCost(
                                      marketplace.id,
                                      "advertising",
                                      value
                                    )
                                  }
                                />

                                <CostInput
                                  label="Other Charges"
                                  value={
                                    data.costs
                                      .other
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateMarketplaceCost(
                                      marketplace.id,
                                      "other",
                                      value
                                    )
                                  }
                                />

                                <label className="products-field products-price-field">
                                  <span>
                                    Selling
                                    Price (₹)
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      data.sellingPrice
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateMarketplace(
                                        marketplace.id,
                                        {
                                          sellingPrice:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                  />
                                </label>
                              </div>

                              <div className="products-profit-row">
                                <div>
                                  <span>
                                    Expected
                                    Profit
                                  </span>

                                  <strong>
                                    {money(
                                      data.expectedProfit
                                    )}
                                  </strong>
                                </div>

                                <div>
                                  <span>
                                    Profit
                                    Margin
                                  </span>

                                  <strong
                                    className={
                                      data.profitMargin >=
                                      numberValue(
                                        form.minimumMargin
                                      )
                                        ? "products-profit-good"
                                        : "products-profit-warning"
                                    }
                                  >
                                    {numberValue(
                                      data.profitMargin
                                    ).toFixed(
                                      2
                                    )}
                                    %
                                  </strong>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>
                )}

                {currentStep ===
                  3 && (
                  <section>
                    <div className="products-section-heading">
                      <div>
                        <span>
                          STEP 4
                        </span>

                        <h3>
                          AI Pricing
                          Recommendation
                        </h3>

                        <p>
                          Use your marketplace
                          costs and target
                          margin to calculate a
                          recommended selling
                          price.
                        </p>
                      </div>
                    </div>

                    <div className="products-ai-panel">
                      <div className="products-ai-panel-top">
                        <div className="products-ai-icon">
                          ✦
                        </div>

                        <div>
                          <strong>
                            MERCHANTRA PRICING
                            ENGINE
                          </strong>

                          <p>
                            Recommendation based
                            on your target margin
                            and marketplace-specific
                            costs.
                          </p>
                        </div>
                      </div>

                      <div className="products-form-grid products-form-grid--three">
                        <label className="products-field">
                          <span>
                            Recommendation
                            Marketplace
                          </span>

                          <select
                            value={
                              recommendationMarketplace
                            }
                            onChange={(
                              event
                            ) =>
                              setRecommendationMarketplace(
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select marketplace
                            </option>

                            {selectedMarketplaces.map(
                              (
                                marketplace
                              ) => (
                                <option
                                  key={
                                    marketplace.id
                                  }
                                  value={
                                    marketplace.id
                                  }
                                >
                                  {
                                    marketplace.name
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label className="products-field">
                          <span>
                            Minimum Margin
                            (%)
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="0.1"
                            value={
                              form.minimumMargin
                            }
                            onChange={(
                              event
                            ) =>
                              updateFormField(
                                "minimumMargin",
                                event.target
                                  .value
                              )
                            }
                          />
                        </label>

                        <label className="products-field">
                          <span>
                            Target Margin
                            (%)
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="0.1"
                            value={
                              form.targetMargin
                            }
                            onChange={(
                              event
                            ) =>
                              updateFormField(
                                "targetMargin",
                                event.target
                                  .value
                              )
                            }
                          />
                        </label>
                      </div>

                      {recommendationData && (
                        <>
                          <div className="products-recommendation-grid">
                            <div>
                              <span>
                                Recommended
                                Price
                              </span>

                              <strong>
                                {money(
                                  recommendedPrice
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Current Selling
                                Price
                              </span>

                              <strong>
                                {money(
                                  recommendationData.sellingPrice
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Expected Profit
                              </span>

                              <strong>
                                {money(
                                  calculateProfit(
                                    recommendationData.sellingPrice,
                                    recommendationData.totalCost
                                  )
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Expected Margin
                              </span>

                              <strong>
                                {numberValue(
                                  calculateMargin(
                                    recommendationData.sellingPrice,
                                    recommendationData.totalCost
                                  )
                                ).toFixed(
                                  2
                                )}
                                %
                              </strong>
                            </div>
                          </div>

                          <div className="products-recommendation-explanation">
                            Recommended based
                            on your target
                            margin and
                            marketplace-specific
                            costs.
                          </div>

                          <div className="products-ai-actions">
                            <button
                              type="button"
                              className="products-primary-btn"
                              onClick={
                                applyRecommendation
                              }
                            >
                              Apply
                              Recommendation
                            </button>

                            <button
                              type="button"
                              className="products-secondary-btn"
                              onClick={
                                keepCurrentPrice
                              }
                            >
                              Keep Current
                              Price
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                )}

                {currentStep ===
                  4 && (
                  <section>
                    <div className="products-section-heading">
                      <div>
                        <span>
                          STEP 5
                        </span>

                        <h3>
                          Review & Publish
                        </h3>

                        <p>
                          Review the complete
                          product configuration
                          before publishing.
                        </p>
                      </div>
                    </div>

                    <div className="products-review-grid">
                      <div className="products-review-card">
                        <span>
                          PRODUCT
                        </span>

                        <div className="products-review-product">
                          <div className="products-thumb products-thumb--large">
                            {form.images?.[0]
                              ?.url ? (
                              <img
                                src={
                                  form
                                    .images[0]
                                    .url
                                }
                                alt={
                                  form.name
                                }
                              />
                            ) : (
                              <span>
                                {(
                                  form.name ||
                                  "P"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div>
                            <strong>
                              {
                                form.name
                              }
                            </strong>

                            <span>
                              {
                                form.sku
                              }
                            </span>

                            <span>
                              {
                                form.category
                              }
                            </span>
                          </div>
                        </div>

                        <div className="products-review-details">
                          <div>
                            <span>
                              Stock
                            </span>

                            <strong>
                              {numberValue(
                                form.stock
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Product Cost
                            </span>

                            <strong>
                              {money(
                                form.productCost
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="products-review-card">
                        <span>
                          MARKETPLACES
                        </span>

                        <div className="products-review-marketplaces">
                          {selectedMarketplaces.map(
                            (
                              marketplace
                            ) => (
                              <div
                                key={
                                  marketplace.id
                                }
                                className="products-review-marketplace"
                              >
                                <MarketplaceLogo
                                  marketplace={
                                    marketplace
                                  }
                                />

                                <div>
                                  <strong>
                                    {
                                      marketplace.name
                                    }
                                  </strong>

                                  <span>
                                    Connected
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="products-review-pricing">
                      <div className="products-review-pricing-header">
                        <div>
                          <strong>
                            Marketplace
                            Pricing
                          </strong>

                          <span>
                            Final pricing
                            and
                            profitability
                          </span>
                        </div>
                      </div>

                      {selectedMarketplaces.map(
                        (
                          marketplace
                        ) => {
                          const data =
                            form
                              .marketplaces[
                              marketplace.id
                            ];

                          return (
                            <div
                              className="products-review-price-row"
                              key={
                                marketplace.id
                              }
                            >
                              <div className="products-review-marketplace">
                                <MarketplaceLogo
                                  marketplace={
                                    marketplace
                                  }
                                />

                                <strong>
                                  {
                                    marketplace.name
                                  }
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Selling
                                  Price
                                </span>

                                <strong>
                                  {money(
                                    data.sellingPrice
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Total Cost
                                </span>

                                <strong>
                                  {money(
                                    data.totalCost
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Expected
                                  Profit
                                </span>

                                <strong>
                                  {money(
                                    data.expectedProfit
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Margin
                                </span>

                                <strong>
                                  {numberValue(
                                    data.profitMargin
                                  ).toFixed(
                                    2
                                  )}
                                  %
                                </strong>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div className="products-publish-note">
                      <strong>
                        Publishing status
                      </strong>

                      <p>
                        This workflow saves
                        the product in
                        MERCHANTRA and
                        records the selected
                        marketplace listings
                        locally unless a real
                        marketplace API is
                        connected.
                      </p>
                    </div>
                  </section>
                )}
              </div>

              <div className="products-workflow-footer">
                <button
                  type="button"
                  className="products-secondary-btn"
                  onClick={
                    previousStep
                  }
                  disabled={
                    currentStep === 0
                  }
                >
                  ← Back
                </button>

                <div>
                  <button
                    type="button"
                    className="products-secondary-btn"
                    onClick={
                      saveDraft
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save Draft"}
                  </button>

                  {currentStep <
                  STEPS.length - 1 ? (
                    <button
                      type="button"
                      className="products-primary-btn"
                      onClick={
                        nextStep
                      }
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="products-primary-btn"
                      onClick={
                        publishProduct
                      }
                      disabled={
                        saving
                      }
                    >
                      {saving
                        ? "Publishing..."
                        : "Publish to Selected Marketplaces"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewProduct && (
          <div className="products-overlay">
            <div className="products-view-modal">
              <div className="products-workflow-header">
                <div>
                  <span className="products-workflow-kicker">
                    PRODUCT DETAILS
                  </span>

                  <h2>
                    {
                      viewProduct.name
                    }
                  </h2>

                  <p>
                    {viewProduct.sku ||
                      "No SKU"}
                  </p>
                </div>

                <button
                  className="products-close-btn"
                  onClick={() =>
                    setViewProduct(
                      null
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="products-view-content">
                <div className="products-view-top">
                  <div className="products-thumb products-thumb--hero">
                    {viewProduct
                      .images?.[0]
                      ?.url ? (
                      <img
                        src={
                          viewProduct
                            .images[0]
                            .url
                        }
                        alt={
                          viewProduct.name
                        }
                      />
                    ) : (
                      <span>
                        {(
                          viewProduct.name ||
                          "P"
                        )
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="products-view-info">
                    <span>
                      Permanent Product
                      ID
                    </span>

                    <strong>
                      {viewProduct.permanent_product_id ||
                        "Local product"}
                    </strong>

                    <span>
                      Category
                    </span>

                    <strong>
                      {viewProduct.category ||
                        "—"}
                    </strong>

                    <span>
                      Status
                    </span>

                    <strong>
                      {
                        viewProduct.status
                      }
                    </strong>
                  </div>
                </div>

                <div className="products-view-marketplaces">
                  {MARKETPLACES.map(
                    (
                      marketplace
                    ) => {
                      const data =
                        viewProduct
                          .marketplaces?.[
                          marketplace.id
                        ];

                      if (
                        !data?.selected
                      ) {
                        return null;
                      }

                      return (
                        <div
                          className="products-view-marketplace"
                          key={
                            marketplace.id
                          }
                        >
                          <MarketplaceLogo
                            marketplace={
                              marketplace
                            }
                          />

                          <div>
                            <strong>
                              {
                                marketplace.name
                              }
                            </strong>

                            <span>
                              Selling Price:{" "}
                              {money(
                                data.sellingPrice
                              )}
                            </span>

                            <span>
                              Profit:{" "}
                              {money(
                                data.expectedProfit
                              )}
                            </span>

                            <span>
                              Margin:{" "}
                              {numberValue(
                                data.profitMargin
                              ).toFixed(
                                2
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="products-workflow-footer">
                <button
                  className="products-secondary-btn"
                  onClick={() =>
                    setViewProduct(
                      null
                    )
                  }
                >
                  Close
                </button>

                <button
                  className="products-primary-btn"
                  onClick={() =>
                    openEdit(
                      viewProduct
                    )
                  }
                >
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}