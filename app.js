const STORAGE_KEY = "gestionCommandesState_v1";
const ORDER_PREFIX = "CMD";

const elements = {
  productsList: document.querySelector("#productsList"),
  productCardTemplate: document.querySelector("#productCardTemplate"),
  cartToggle: document.querySelector("#cartToggle"),
  cartPanel: document.querySelector("#cartPanel"),
  cartOverlay: document.querySelector("#cartOverlay"),
  cartClose: document.querySelector("#cartClose"),
  cartContent: document.querySelector("#cartContent"),
  cartCount: document.querySelector("#cartCount"),
  cartTotal: document.querySelector("#cartTotal"),
  checkoutBtn: document.querySelector("#checkoutBtn"),
  checkoutModal: document.querySelector("#checkoutModal"),
  checkoutClose: document.querySelector("#checkoutClose"),
  checkoutCancel: document.querySelector("#checkoutCancel"),
  checkoutForm: document.querySelector("#checkoutForm"),
  confirmationModal: document.querySelector("#confirmationModal"),
  confirmationContent: document.querySelector("#confirmationContent"),
  confirmationClose: document.querySelector("#confirmationClose"),
  confirmationOk: document.querySelector("#confirmationOk"),
};

const state = {
  products: [],
  cart: [],
};

function loadState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    state.products = parsed.products ?? [];
  } catch (error) {
    console.error("Impossible de charger les produits :", error);
  }
}

function saveOrders(newOrder) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const payload = stored ? JSON.parse(stored) : { products: [], orders: [] };
    if (!Array.isArray(payload.orders)) {
      payload.orders = [];
    }
    payload.orders.push(newOrder);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Impossible d'enregistrer la commande :", error);
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function renderProducts() {
  elements.productsList.innerHTML = "";
  if (!state.products.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent =
      "Aucun produit disponible pour le moment. Revenez plus tard ou contactez la boutique.";
    elements.productsList.appendChild(empty);
    return;
  }
  state.products
    .filter((product) => product.stock > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .forEach((product) => {
      const card = elements.productCardTemplate.content.cloneNode(true);
      card.querySelector(".product-title").textContent = product.name;
      card.querySelector(".product-description").textContent =
        product.description || "Pas de description";
      card.querySelector(".product-price").textContent = formatCurrency(product.price);
      card.querySelector(
        ".product-stock",
      ).textContent = `${product.stock} disponibles pour retrait`;
      const image = card.querySelector(".product-image");
      const placeholder = card.querySelector(".product-placeholder");
      placeholder.textContent = product.name.charAt(0).toUpperCase();
      if (product.image?.dataUrl) {
        image.src = product.image.dataUrl;
        image.alt = product.image.name || product.name;
        image.style.display = "block";
        placeholder.style.display = "none";
      }
      card.querySelector(".add-to-cart").addEventListener("click", () => addToCart(product));
      elements.productsList.appendChild(card);
    });
}

function addToCart(product) {
  const existing = state.cart.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, product.stock);
  } else {
    state.cart.push({ product, quantity: 1 });
  }
  renderCart();
  toggleCart(true);
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.product.id !== productId);
  renderCart();
}

function updateQuantity(productId, delta) {
  state.cart = state.cart.map((item) => {
    if (item.product.id === productId) {
      const newQuantity = Math.min(
        Math.max(item.quantity + delta, 1),
        item.product.stock,
      );
      return { ...item, quantity: newQuantity };
    }
    return item;
  });
  renderCart();
}

function renderCart() {
  elements.cartContent.innerHTML = "";
  if (!state.cart.length) {
    elements.cartContent.innerHTML =
      '<p class="cart-empty">Votre panier est vide. Ajoutez des produits pour continuer.</p>';
    elements.cartCount.textContent = "0";
    elements.cartTotal.textContent = formatCurrency(0);
    return;
  }

  const fragment = document.createDocumentFragment();
  let total = 0;

  state.cart.forEach((item) => {
    const container = document.createElement("div");
    container.className = "cart-item";
    container.innerHTML = `
      <div class="cart-item-header">
        <span>${item.product.name}</span>
        <button class="icon-button remove">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
      <div class="cart-item-details">
        <div class="cart-quantity">
          <button class="quantity-minus" type="button">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-plus" type="button">+</button>
        </div>
        <strong>${formatCurrency(item.product.price * item.quantity)}</strong>
      </div>
    `;

    container.querySelector(".remove").addEventListener("click", () => {
      removeFromCart(item.product.id);
    });
    container.querySelector(".quantity-minus").addEventListener("click", () => {
      updateQuantity(item.product.id, -1);
    });
    container.querySelector(".quantity-plus").addEventListener("click", () => {
      updateQuantity(item.product.id, 1);
    });

    total += item.product.price * item.quantity;
    fragment.appendChild(container);
  });

  elements.cartContent.appendChild(fragment);
  elements.cartCount.textContent = state.cart.length.toString();
  elements.cartTotal.textContent = formatCurrency(total);
}

function toggleCart(forceOpen = null) {
  const shouldOpen = forceOpen ?? !elements.cartPanel.classList.contains("open");
  elements.cartPanel.classList.toggle("open", shouldOpen);
  elements.cartOverlay.classList.toggle("visible", shouldOpen);
}

function openModal(modal) {
  modal?.classList.add("visible");
}

function closeModal(modal) {
  modal?.classList.remove("visible");
}

function generatePickupCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const digits = Math.floor(Math.random() * 9000 + 1000);
  return `${ORDER_PREFIX}-${random}-${digits}`;
}

function createOrderPayload({ customer, email, notes }) {
  const products = state.cart.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    productSku: item.product.sku,
    quantity: item.quantity,
    unitPrice: item.product.price,
  }));

  const total = products.reduce(
    (sum, product) => sum + product.unitPrice * product.quantity,
    0,
  );

  const pickupCode = generatePickupCode();
  const order = {
    id: `${ORDER_PREFIX.toLowerCase()}-${Date.now().toString(36)}`,
    reference: pickupCode,
    productId: products[0]?.productId ?? null,
    productSku: products[0]?.productSku ?? "",
    productName: products[0]?.productName ?? "",
    items: products,
    quantity: products.reduce((sum, product) => sum + product.quantity, 0),
    customer,
    email,
    notes,
    status: "En attente",
    createdAt: Date.now(),
    history: [
      {
        status: "En attente",
        date: Date.now(),
        note: "Commande créée par le client sur la boutique click & collect",
      },
    ],
    total,
  };

  return { order, pickupCode, total };
}

function showConfirmation({ pickupCode, total, customer }) {
  elements.confirmationContent.innerHTML = `
    <div class="confirmation-code">
      <span>Code de retrait</span>
      <strong>${pickupCode}</strong>
    </div>
    <p><strong>${customer}</strong>, merci pour votre commande !</p>
    <p>Présentez ce code au comptoir pour récupérer vos produits.</p>
    <ul class="confirmation-list">
      ${state.cart
        .map(
          (item) => `<li>
            <span>${item.quantity} × ${item.product.name}</span>
            <strong>${formatCurrency(item.product.price * item.quantity)}</strong>
          </li>`,
        )
        .join("")}
    </ul>
    <p><strong>Total estimé :</strong> ${formatCurrency(total)}</p>
  `;
  openModal(elements.confirmationModal);
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  if (!state.cart.length) {
    alert("Votre panier est vide.");
    return;
  }
  const formData = new FormData(event.target);
  const customer = formData.get("customer").trim();
  const email = formData.get("email").trim();
  const notes = formData.get("notes").trim();
  if (!customer || !email) {
    alert("Merci de remplir vos coordonnées.");
    return;
  }

  const { order, pickupCode, total } = createOrderPayload({ customer, email, notes });
  saveOrders(order);
  showConfirmation({ pickupCode, total, customer });
  state.cart = [];
  renderCart();
  closeModal(elements.checkoutModal);
}

function attachEventListeners() {
  elements.cartToggle?.addEventListener("click", () => toggleCart());
  elements.cartClose?.addEventListener("click", () => toggleCart(false));
  elements.cartOverlay?.addEventListener("click", () => toggleCart(false));
  elements.checkoutBtn?.addEventListener("click", () => {
    if (!state.cart.length) {
      alert("Votre panier est vide.");
      return;
    }
    openModal(elements.checkoutModal);
  });
  elements.checkoutClose?.addEventListener("click", () => closeModal(elements.checkoutModal));
  elements.checkoutCancel?.addEventListener("click", () => closeModal(elements.checkoutModal));
  elements.checkoutForm?.addEventListener("submit", handleCheckoutSubmit);

  [elements.confirmationClose, elements.confirmationOk]?.forEach((button) => {
    button?.addEventListener("click", () => {
      closeModal(elements.confirmationModal);
      toggleCart(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleCart(false);
      closeModal(elements.checkoutModal);
      closeModal(elements.confirmationModal);
    }
  });
}

function init() {
  loadState();
  renderProducts();
  renderCart();
  attachEventListeners();
}

init();

