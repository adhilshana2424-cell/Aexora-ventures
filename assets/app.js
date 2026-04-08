const products = [
  { sku: "AX-101", name: "Aureline Console Tray", category: "Home & Kitchen", price: 129, popularity: 98, rating: 4.9, short: "Brushed gold accents and matte detailing for elevated everyday organization.", details: "A sculptural tray designed to anchor keys, fragrances, and ritual objects with quiet elegance.", offer: "Complimentary gift wrap" },
  { sku: "AX-102", name: "Noir Ember Lamp", category: "Lighting", price: 189, popularity: 94, rating: 4.8, short: "A warm ambient lamp with gallery-inspired form and calming glow.", details: "Balances soft mood lighting with understated architectural presence in living and work spaces.", offer: "Free shipping worldwide" },
  { sku: "AX-103", name: "Ivory Ritual Cup Set", category: "Dining", price: 88, popularity: 90, rating: 4.7, short: "Minimal ceramic pieces shaped for tea, coffee, and intentional pauses.", details: "A tactile set that brings warmth and refinement to daily moments without visual noise.", offer: "Bundle savings applied" },
  { sku: "AX-104", name: "Beige Form Throw", category: "Living", price: 146, popularity: 91, rating: 4.8, short: "Soft woven comfort with tonal depth and premium drape.", details: "Designed to soften spaces while keeping the overall visual language sophisticated and calm.", offer: "Members save 10%" },
  { sku: "AX-105", name: "Atlas Desk Sculpture", category: "Workspace", price: 164, popularity: 87, rating: 4.6, short: "A statement object that adds focus, balance, and a luxury editorial feel.", details: "Crafted for shelves, desks, and creative studios where detail matters more than excess.", offer: "Limited edition finish" },
  { sku: "AX-106", name: "Solis Storage Canister", category: "Home & Kitchen", price: 72, popularity: 86, rating: 4.7, short: "Countertop storage with soft matte texture and subtle gold ring detail.", details: "An elegant utility piece built to keep ingredients or essentials neatly stored in plain sight.", offer: "Best seller" },
];

const storageKeys = { theme: "aexora-theme", cart: "aexora-cart", recent: "aexora-recent-views" };
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const state = { cart: JSON.parse(localStorage.getItem(storageKeys.cart) || "[]"), theme: localStorage.getItem(storageKeys.theme) || "light" };
const body = document.body;
const overlay = document.querySelector("[data-overlay]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const checkoutModal = document.querySelector("[data-checkout-modal]");

applyTheme();
setupNavigation();
setupThemeToggle();
setupCart();
renderFeaturedProducts();
renderRecommendations();
renderShopPage();
renderProductPage();
setupForms();

function applyTheme() { body.dataset.theme = state.theme; }

function setupNavigation() {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!navToggle || !nav) return;
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function setupThemeToggle() {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem(storageKeys.theme, state.theme);
      applyTheme();
    });
  });
}

function setupCart() {
  document.querySelectorAll("[data-cart-open]").forEach((button) => button.addEventListener("click", openCart));
  document.querySelectorAll("[data-cart-close]").forEach((button) => button.addEventListener("click", closePanels));
  document.querySelectorAll("[data-checkout-open]").forEach((button) => button.addEventListener("click", openCheckout));
  document.querySelectorAll("[data-checkout-close]").forEach((button) => button.addEventListener("click", closePanels));
  overlay?.addEventListener("click", closePanels);
  renderCart();
}

function openCart() {
  cartDrawer?.classList.add("is-open");
  overlay?.classList.add("is-visible");
  cartDrawer?.setAttribute("aria-hidden", "false");
}

function openCheckout() {
  if (!state.cart.length) return;
  openCart();
  checkoutModal?.classList.add("is-open");
  checkoutModal?.setAttribute("aria-hidden", "false");
}

function closePanels() {
  cartDrawer?.classList.remove("is-open");
  checkoutModal?.classList.remove("is-open");
  overlay?.classList.remove("is-visible");
  cartDrawer?.setAttribute("aria-hidden", "true");
  checkoutModal?.setAttribute("aria-hidden", "true");
}

function addToCart(sku) {
  const existing = state.cart.find((item) => item.sku === sku);
  if (existing) existing.quantity += 1;
  else state.cart.push({ sku, quantity: 1 });
  persistCart();
  renderCart();
  openCart();
}

function removeFromCart(sku) {
  state.cart = state.cart.filter((item) => item.sku !== sku);
  persistCart();
  renderCart();
}

function persistCart() { localStorage.setItem(storageKeys.cart, JSON.stringify(state.cart)); }

function renderCart() {
  const countEls = document.querySelectorAll("[data-cart-count]");
  const cartItemsEl = document.querySelector("[data-cart-items]");
  const subtotalEl = document.querySelector("[data-cart-subtotal]");
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  countEls.forEach((el) => (el.textContent = String(cartCount)));
  if (!cartItemsEl || !subtotalEl) return;
  if (!state.cart.length) {
    cartItemsEl.innerHTML = `<div class="empty-state">Your cart is empty. Explore the collection to begin.</div>`;
    subtotalEl.textContent = currency.format(0);
    return;
  }

  const cartProducts = state.cart.map((item) => ({ ...products.find((entry) => entry.sku === item.sku), quantity: item.quantity }));
  const subtotal = cartProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  subtotalEl.textContent = currency.format(subtotal);
  cartItemsEl.innerHTML = cartProducts.map((item) => `
    <article class="cart-item">
      <div class="cart-item-visual" aria-hidden="true"></div>
      <div><strong>${item.name}</strong><p>${item.quantity} × ${currency.format(item.price)}</p></div>
      <button class="icon-button" type="button" data-remove-sku="${item.sku}">Remove</button>
    </article>
  `).join("");
  cartItemsEl.querySelectorAll("[data-remove-sku]").forEach((button) => button.addEventListener("click", () => removeFromCart(button.dataset.removeSku)));
}

function productCard(product) {
  return `
    <article class="product-card">
      <div class="product-visual" aria-hidden="true"></div>
      <span class="product-category">${product.category}</span>
      <div class="product-meta"><div><strong>${product.name}</strong><p>${product.short}</p></div><div class="rating">★ ${product.rating}</div></div>
      <div class="product-meta"><strong class="product-price">${currency.format(product.price)}</strong><span>${product.offer}</span></div>
      <div class="product-actions">
        <a class="button button-secondary" href="product.html?sku=${product.sku}">Details</a>
        <button class="button button-primary" type="button" data-add-sku="${product.sku}">Add to Cart</button>
      </div>
    </article>
  `;
}

function wireAddToCart(root = document) {
  root.querySelectorAll("[data-add-sku]").forEach((button) => button.addEventListener("click", () => addToCart(button.dataset.addSku)));
}

function renderFeaturedProducts() {
  const target = document.querySelector("[data-featured-products]");
  if (!target) return;
  target.innerHTML = products.slice(0, 3).map(productCard).join("");
  wireAddToCart(target);
}

function renderRecommendations() {
  const target = document.querySelector("[data-recommended-products]");
  if (!target) return;
  const recent = JSON.parse(localStorage.getItem(storageKeys.recent) || "[]");
  const recentProduct = products.find((item) => item.sku === recent[0]);
  const recommended = recentProduct ? products.filter((item) => item.category === recentProduct.category && item.sku !== recentProduct.sku) : products.slice(3, 6);
  target.innerHTML = recommended.slice(0, 3).map(productCard).join("");
  wireAddToCart(target);
}

function renderShopPage() {
  const target = document.querySelector("[data-shop-products]");
  if (!target) return;
  const categorySelect = document.querySelector("[data-filter-category]");
  const priceInput = document.querySelector("[data-filter-price]");
  const priceLabel = document.querySelector("[data-filter-price-label]");
  const sortSelect = document.querySelector("[data-sort]");
  const resultsCount = document.querySelector("[data-results-count]");
  const categories = [...new Set(products.map((item) => item.category))];
  categorySelect.innerHTML += categories.map((category) => `<option value="${category}">${category}</option>`).join("");

  const render = () => {
    const maxPrice = Number(priceInput.value);
    const category = categorySelect.value;
    const sort = sortSelect.value;
    priceLabel.textContent = `Up to ${currency.format(maxPrice)}`;
    let filtered = products.filter((item) => item.price <= maxPrice);
    if (category !== "all") filtered = filtered.filter((item) => item.category === category);
    filtered = [...filtered].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : sort === "rating" ? b.rating - a.rating : b.popularity - a.popularity);
    resultsCount.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;
    target.innerHTML = filtered.map(productCard).join("");
    wireAddToCart(target);
  };

  [categorySelect, priceInput, sortSelect].forEach((input) => input.addEventListener("input", render));
  render();
}

function renderProductPage() {
  const target = document.querySelector("[data-product-detail]");
  if (!target) return;
  const params = new URLSearchParams(window.location.search);
  const sku = params.get("sku") || "AX-101";
  const product = products.find((item) => item.sku === sku) || products[0];
  localStorage.setItem(storageKeys.recent, JSON.stringify([product.sku]));
  target.innerHTML = `
    <div class="product-gallery">
      <div class="product-image-main" aria-hidden="true"></div>
      <div class="product-thumbs"><div class="product-thumb" aria-hidden="true"></div><div class="product-thumb" aria-hidden="true"></div><div class="product-thumb" aria-hidden="true"></div></div>
    </div>
    <div class="product-info">
      <span class="product-category">${product.category}</span>
      <h1>${product.name}</h1>
      <p class="lead">${product.short}</p>
      <div class="product-price-row"><span class="product-price">${currency.format(product.price)}</span><span class="offer-pill">${product.offer}</span></div>
      <p class="rating">★ ${product.rating} customer rating</p>
      <p>${product.details}</p>
      <div class="product-actions"><button class="button button-primary" type="button" data-add-sku="${product.sku}">Add to Cart</button><button class="button button-secondary" type="button" data-buy-now="${product.sku}">Buy Now</button></div>
      <div class="accordion">
        <details open><summary>Product Details</summary><p>Premium finish, durable construction, and a design language intended to remain elegant for decades.</p></details>
        <details><summary>Shipping & Care</summary><p>Dispatched within 48 hours. Includes care guidance and refined packaging suitable for gifting.</p></details>
        <details><summary>Why Customers Love It</summary><p>Minimal profile, tactile materials, and a premium presence that works across interiors and routines.</p></details>
      </div>
    </div>
  `;
  wireAddToCart(target);
  target.querySelector("[data-buy-now]")?.addEventListener("click", () => { addToCart(product.sku); openCheckout(); });
  const relatedTarget = document.querySelector("[data-related-products]");
  if (!relatedTarget) return;
  const related = products.filter((item) => item.category === product.category && item.sku !== product.sku);
  relatedTarget.innerHTML = related.slice(0, 3).map(productCard).join("");
  wireAddToCart(relatedTarget);
}

function setupForms() {
  const checkoutForm = document.querySelector("[data-checkout-form]");
  checkoutForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.cart = [];
    persistCart();
    renderCart();
    if (!checkoutForm.querySelector(".success-banner")) checkoutForm.insertAdjacentHTML("beforeend", `<div class="success-banner">Order placed. Connect this form to your payment gateway and backend to go live.</div>`);
    closePanels();
  });

  const contactForm = document.querySelector("[data-contact-form]");
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.querySelector(".success-banner")) contactForm.insertAdjacentHTML("beforeend", `<div class="success-banner">Thanks for reaching out. This form is ready to connect to email or CRM automation.</div>`);
    contactForm.reset();
  });
}
