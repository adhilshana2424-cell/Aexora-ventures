const API = "/api";

// 🛒 LOAD PRODUCTS (shop page)
function loadProducts() {
  fetch(API + "/products")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("products");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(p => {
      container.innerHTML += `
        <div>
          <img src="${p.image}" width="100">
          <h3>${p.title}</h3>
          <p>₹${p.price}</p>
        </div>
      `;
    });
  });
}

// 🔐 LOGIN
function login() {
  fetch(API + "/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      username: user.value,
      password: pass.value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem("admin", "true");
      window.location = "/admin/dashboard.html";
    } else {
      alert("Wrong login");
    }
  });
}

// ➕ ADD PRODUCT
function addProduct() {
  fetch(API + "/add-product", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      title: title.value,
      price: price.value,
      image: image.value
    })
  })
  .then(() => alert("Added"));
}