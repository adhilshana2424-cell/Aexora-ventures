const STORAGE_KEY = "owner-admin-dashboard-v1";
const SESSION_KEY = "owner-admin-session";
const PUBLIC_PRODUCTS_KEY = "aexora-public-products";
const ORDERS_KEY = "aexora-orders";
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3000/api"
  : "https://api.aexoraventures.in/api";
const RUPEE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const CONFIG = {
  username: "aexoraventures@gmail.com",
  passwordHash: "fa8c3048f235f5204b65d9ba04f62ade4a7303fbc5e89b94dcbf7d0dd96280a8"
};

const defaultState = {
  owner: {
    name: "Adhil",
    role: "Founder / Owner",
    email: "owner@yourbrand.com",
    phone: "+91 98765 43210",
    image: "../img123.jpeg",
    bio: "Use this private dashboard to manage your personal products, sales reporting, owner notes, and image-driven product details."
  },
  report: {
    monthlySales: 550000,
    monthlyExpenses: 185000,
    netMargin: 24,
    topChannel: "Website Orders",
    note: "Focus on high-margin products, restock top sellers, and review new campaign creatives every Monday."
  },
  monthlyTrend: [
    { month: "Jan", sales: 320000 },
    { month: "Feb", sales: 360000 },
    { month: "Mar", sales: 410000 },
    { month: "Apr", sales: 470000 },
    { month: "May", sales: 520000 },
    { month: "Jun", sales: 550000 }
  ],
  orders: [],
  products: [],
  reminders: [
    "Update weekly sales every Sunday evening.",
    "Review owner bio and profile image before sharing dashboard screenshots.",
    "Track low-stock products and schedule restocking early.",
    "Check if net margin is improving after marketing campaigns."
  ]
};

const sampleProducts = [
  {
    id: crypto.randomUUID(),
    name: "Executive Travel Organizer",
    category: "Travel",
    price: 2499,
    unitsSold: 135,
    stock: 42,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    description: "Premium organizer with multi-pocket structure, tech accessory space, and owner-branded packaging."
  },
  {
    id: crypto.randomUUID(),
    name: "Signature Desk Lamp",
    category: "Home",
    price: 4299,
    unitsSold: 82,
    stock: 19,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    description: "Minimal lighting piece with warm tone output, aluminum finish, and premium presentation for high-value customers."
  },
  {
    id: crypto.randomUUID(),
    name: "Wireless Focus Speaker",
    category: "Tech",
    price: 5999,
    unitsSold: 64,
    stock: 28,
    image: "https://images.unsplash.com/photo-1512446816042-444d64126727?auto=format&fit=crop&w=900&q=80",
    description: "Portable speaker for workspace and travel customers, designed to increase average order value."
  }
];

const loginScreen = document.getElementById("loginScreen");
const dashboardApp = document.getElementById("dashboardApp");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const ownerForm = document.getElementById("ownerForm");
const reportForm = document.getElementById("reportForm");
const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");
const summaryCards = document.getElementById("summaryCards");
const reportCards = document.getElementById("reportCards");
const salesChart = document.getElementById("salesChart");
const ownerChecklist = document.getElementById("ownerChecklist");

let state = loadState();

loginForm.addEventListener("submit", handleLogin);
ownerForm.addEventListener("submit", handleOwnerSave);
reportForm.addEventListener("submit", handleReportSave);
productForm.addEventListener("submit", handleProductSave);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("loadSampleDataBtn").addEventListener("click", loadSampleData);

boot();

function boot() {
  if (sessionStorage.getItem(SESSION_KEY) === "true") {
    showDashboard();
    return;
  }

  loginScreen.classList.remove("hidden");
  dashboardApp.classList.add("hidden");
}

async function handleLogin(event) {
  event.preventDefault();

  const username = normalizeUsername(document.getElementById("username").value);
  const password = document.getElementById("password").value;
  const passwordHash = await hashText(password);

  if (username === CONFIG.username && passwordHash === CONFIG.passwordHash) {
    sessionStorage.setItem(SESSION_KEY, "true");
    loginForm.reset();
    loginError.textContent = "";
    showDashboard();
    return;
  }

  loginError.textContent = "Wrong Gmail ID or password. Use your updated private admin login.";
}

async function showDashboard() {
  syncStateWithPublicData();
  await refreshRemoteData();
  loginScreen.classList.add("hidden");
  dashboardApp.classList.remove("hidden");
  hydrateForms();
  renderDashboard();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  dashboardApp.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

function hydrateForms() {
  ownerForm.elements.name.value = state.owner.name;
  ownerForm.elements.role.value = state.owner.role;
  ownerForm.elements.email.value = state.owner.email;
  ownerForm.elements.phone.value = state.owner.phone;
  ownerForm.elements.image.value = state.owner.image;
  ownerForm.elements.bio.value = state.owner.bio;

  reportForm.elements.monthlySales.value = state.report.monthlySales;
  reportForm.elements.monthlyExpenses.value = state.report.monthlyExpenses;
  reportForm.elements.netMargin.value = state.report.netMargin;
  reportForm.elements.topChannel.value = state.report.topChannel;
  reportForm.elements.note.value = state.report.note;
}

async function handleOwnerSave(event) {
  event.preventDefault();

  state.owner = {
    name: ownerForm.elements.name.value.trim(),
    role: ownerForm.elements.role.value.trim(),
    email: ownerForm.elements.email.value.trim(),
    phone: ownerForm.elements.phone.value.trim(),
    image: ownerForm.elements.image.value.trim() || "../img123.jpeg",
    bio: ownerForm.elements.bio.value.trim()
  };

  saveState();
  renderDashboard();
}

async function handleReportSave(event) {
  event.preventDefault();

  state.report = {
    monthlySales: toNumber(reportForm.elements.monthlySales.value),
    monthlyExpenses: toNumber(reportForm.elements.monthlyExpenses.value),
    netMargin: toNumber(reportForm.elements.netMargin.value),
    topChannel: reportForm.elements.topChannel.value.trim(),
    note: reportForm.elements.note.value.trim()
  };

  state.monthlyTrend = [
    ...state.monthlyTrend.slice(1),
    { month: "Now", sales: state.report.monthlySales }
  ];

  if (state.reminders[0] !== state.report.note && state.report.note) {
    state.reminders[0] = state.report.note;
  }

  saveState();
  renderDashboard();
}

async function handleProductSave(event) {
  event.preventDefault();

  const product = {
    id: crypto.randomUUID(),
    name: productForm.elements.name.value.trim(),
    category: productForm.elements.category.value.trim(),
    price: toNumber(productForm.elements.price.value),
    unitsSold: toNumber(productForm.elements.unitsSold.value),
    stock: toNumber(productForm.elements.stock.value),
    image: productForm.elements.image.value.trim(),
    description: productForm.elements.description.value.trim()
  };

  state.products.unshift(product);
  saveState();
  await syncProductsToApi();
  await refreshRemoteData();
  productForm.reset();
  renderDashboard();
}

async function deleteProduct(id) {
  state.products = state.products.filter((product) => product.id !== id);
  saveState();
  await syncProductsToApi();
  await refreshRemoteData();
  renderDashboard();
}

async function loadSampleData() {
  state.products = [...sampleProducts];
  saveState();
  await syncProductsToApi();
  await refreshRemoteData();
  renderDashboard();
}

function renderDashboard() {
  syncStateWithPublicData();
  renderOwnerProfile();
  renderSummaryCards();
  renderReportCards();
  renderChart();
  renderProducts();
  renderChecklist();
}

function renderOwnerProfile() {
  document.getElementById("ownerPreview").src = state.owner.image || "../img123.jpeg";
  document.getElementById("ownerPreview").alt = state.owner.name || "Owner preview";
  document.getElementById("ownerNameDisplay").textContent = state.owner.name || "Your Name";
  document.getElementById("ownerRoleDisplay").textContent = state.owner.role || "Founder / Owner";
  document.getElementById("ownerBioDisplay").textContent = state.owner.bio || "Add your profile summary and brand story here.";
  document.getElementById("ownerEmailDisplay").textContent = state.owner.email || "yourname@email.com";
  document.getElementById("ownerPhoneDisplay").textContent = state.owner.phone || "+91 00000 00000";
}

function renderSummaryCards() {
  const metrics = deriveMetrics();
  const totalRevenue = metrics.totalRevenue;
  const stockValue = state.products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  const estimatedProfit = metrics.netProfit;

  const cards = [
    { label: "Products", value: state.products.length.toString() },
    { label: "Orders Today", value: metrics.todayOrders.toString() },
    { label: "Revenue", value: formatCurrency(totalRevenue) },
    { label: "Net Profit", value: formatCurrency(estimatedProfit) },
    { label: "Stock Value", value: formatCurrency(stockValue) }
  ];

  summaryCards.innerHTML = cards.map((card) => `
    <article class="summary-card">
      <p>${card.label}</p>
      <strong>${card.value}</strong>
    </article>
  `).join("");
}

function renderReportCards() {
  const metrics = deriveMetrics();

  const cards = [
    { label: "Today Sales", value: formatCurrency(metrics.todaySales) },
    { label: "Weekly Sales", value: formatCurrency(metrics.weekSales) },
    { label: "Monthly Sales", value: formatCurrency(metrics.monthSales) },
    { label: "Yearly Sales", value: formatCurrency(metrics.yearSales) },
    { label: "Expenses", value: formatCurrency(state.report.monthlyExpenses) },
    { label: "Net Margin", value: `${state.report.netMargin}%` },
    { label: "Top Channel", value: state.report.topChannel || "Not set" },
    { label: "Net Profit", value: formatCurrency(metrics.netProfit) },
    { label: "Orders This Week", value: metrics.weekOrders.toString() },
    { label: "Orders This Month", value: metrics.monthOrders.toString() },
    { label: "Avg Order Value", value: formatCurrency(metrics.averageTicket) },
    { label: "Owner", value: state.owner.name || "Your Name" }
  ];

  reportCards.innerHTML = cards.map((card) => `
    <article class="report-card">
      <p>${card.label}</p>
      <strong>${card.value}</strong>
    </article>
  `).join("");
}

function renderChart() {
  const trend = deriveMonthlyTrend();
  const highestSale = Math.max(...trend.map((entry) => entry.sales), 1);

  salesChart.innerHTML = trend.map((entry) => {
    const percentage = Math.max(12, Math.round((entry.sales / highestSale) * 100));

    return `
      <div class="bar-wrap">
        <div class="bar" style="height:${percentage}%"></div>
        <div class="bar-value">${formatCurrency(entry.sales)}</div>
        <div class="bar-label">${entry.month}</div>
      </div>
    `;
  }).join("");
}

function renderChecklist() {
  ownerChecklist.innerHTML = state.reminders.map((item) => `<li>${item}</li>`).join("");
}

function renderProducts() {
  if (!state.products.length) {
    productList.innerHTML = '<div class="empty-state">No products added yet. Add your first product or load demo data to preview the dashboard.</div>';
    return;
  }

  productList.innerHTML = state.products.map((product) => `
    <article class="product-card">
      <div class="product-image">
        ${product.image ? `<img src="${product.image}" alt="${product.name}">` : ""}
      </div>
      <div class="product-body">
        <div>
          <h3>${product.name}</h3>
          <div class="product-meta">
            <span>${product.category}</span>
            <span>${formatCurrency(product.price)}</span>
          </div>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-stats">
          <span>Sold: ${product.unitsSold}</span>
          <span>Stock: ${product.stock}</span>
          <span>Revenue: ${formatCurrency(product.price * product.unitsSold)}</span>
        </div>
        <button class="danger-button" type="button" data-delete-product="${product.id}">Delete Product</button>
      </div>
    </article>
  `).join("");

  productList.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct));
  });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const syncedProducts = loadPublicProducts();
  const syncedOrders = loadOrders();
  if (!saved) {
    return {
      ...structuredClone(defaultState),
      products: syncedProducts,
      orders: syncedOrders
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      owner: { ...defaultState.owner, ...parsed.owner },
      report: { ...defaultState.report, ...parsed.report },
      monthlyTrend: Array.isArray(parsed.monthlyTrend) && parsed.monthlyTrend.length ? parsed.monthlyTrend : defaultState.monthlyTrend,
      orders: syncedOrders.length ? syncedOrders : (Array.isArray(parsed.orders) ? parsed.orders : []),
      products: syncedProducts.length ? syncedProducts : (Array.isArray(parsed.products) ? parsed.products : []),
      reminders: Array.isArray(parsed.reminders) && parsed.reminders.length ? parsed.reminders : defaultState.reminders
    };
  } catch (error) {
    return {
      ...structuredClone(defaultState),
      products: syncedProducts,
      orders: syncedOrders
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  savePublicProducts(state.products);
  saveOrders(state.orders);
}

function toNumber(value) {
  return Number(value) || 0;
}

function formatCurrency(value) {
  return RUPEE.format(value || 0);
}

function normalizeUsername(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function syncStateWithPublicData() {
  const syncedProducts = loadPublicProducts();
  const syncedOrders = loadOrders();

  if (syncedProducts.length) {
    state.products = syncedProducts;
  }

  if (syncedOrders.length || !state.orders.length) {
    state.orders = syncedOrders;
  }
}

function loadPublicProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(PUBLIC_PRODUCTS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function savePublicProducts(products) {
  localStorage.setItem(PUBLIC_PRODUCTS_KEY, JSON.stringify(products));
}

function loadOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

async function refreshRemoteData() {
  try {
    const [products, orders] = await Promise.all([
      fetchJson(`${API_BASE}/products`),
      fetchJson(`${API_BASE}/orders`)
    ]);

    if (Array.isArray(products) && (products.length || !state.products.length)) {
      state.products = products;
      savePublicProducts(products);
    }

    if (Array.isArray(orders) && (orders.length || !state.orders.length)) {
      state.orders = orders;
      saveOrders(orders);
    }

    saveState();
  } catch {
    syncStateWithPublicData();
  }
}

async function syncProductsToApi() {
  try {
    await fetchJson(`${API_BASE}/sync-products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: state.products })
    });
  } catch {
    // Keep local data available even if the backend is offline.
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function deriveMetrics() {
  const now = new Date();
  const marginRate = state.report.netMargin / 100;
  const orders = Array.isArray(state.orders) ? state.orders : [];

  const totals = orders.reduce((accumulator, order) => {
    const createdAt = new Date(order.createdAt || order.date || Date.now());
    const amount = toNumber(order.amount || order.price);

    accumulator.totalRevenue += amount;
    accumulator.netProfit += amount * marginRate;

    if (isSameDay(createdAt, now)) {
      accumulator.todaySales += amount;
      accumulator.todayOrders += 1;
    }

    if (isWithinDays(createdAt, now, 7)) {
      accumulator.weekSales += amount;
      accumulator.weekOrders += 1;
    }

    if (createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth()) {
      accumulator.monthSales += amount;
      accumulator.monthOrders += 1;
    }

    if (createdAt.getFullYear() === now.getFullYear()) {
      accumulator.yearSales += amount;
      accumulator.yearOrders += 1;
    }

    return accumulator;
  }, {
    totalRevenue: 0,
    netProfit: 0,
    todaySales: 0,
    todayOrders: 0,
    weekSales: 0,
    weekOrders: 0,
    monthSales: 0,
    monthOrders: 0,
    yearSales: 0,
    yearOrders: 0
  });

  totals.averageTicket = orders.length ? totals.totalRevenue / orders.length : 0;
  return totals;
}

function deriveMonthlyTrend() {
  const orders = Array.isArray(state.orders) ? state.orders : [];
  if (!orders.length) {
    return state.monthlyTrend;
  }

  const now = new Date();
  const buckets = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleString("en-IN", { month: "short" }),
      sales: 0
    });
  }

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt || order.date || Date.now());
    const amount = toNumber(order.amount || order.price);
    const bucket = buckets.find((item) => item.year === createdAt.getFullYear() && item.month === createdAt.getMonth());
    if (bucket) {
      bucket.sales += amount;
    }
  });

  return buckets.map((bucket) => ({ month: bucket.label, sales: bucket.sales }));
}

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isWithinDays(date, now, days) {
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

async function hashText(text) {
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}



