const STORAGE_KEY = "gestionCommandesState_v1";
const CLIENT_SESSION_KEY = "clickCollectClient_v1";

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
  authModal: document.querySelector("#authModal"),
  authForm: document.querySelector("#authForm"),
  authClose: document.querySelector("#authClose"),
  authCancel: document.querySelector("#authCancel"),
  accountToggle: document.querySelector("#accountToggle"),
  accountLabel: document.querySelector("#accountLabel"),
  accountModal: document.querySelector("#accountModal"),
  accountClose: document.querySelector("#accountClose"),
  accountSubtitle: document.querySelector("#accountSubtitle"),
  accountBody: document.querySelector("#accountBody"),
  accountEmpty: document.querySelector("#accountEmpty"),
  accountOrders: document.querySelector("#accountOrders"),
  logoutBtn: document.querySelector("#logoutBtn"),
  homeNav: document.querySelector("#homeNav"),
  heroShopBtn: document.querySelector("#heroShopBtn"),
  heroAccountBtn: document.querySelector("#heroAccountBtn"),
};

const state = {
  products: [],
  cart: [],
};

let clientSession = null;
let pendingCheckout = false;

function loadState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    state.products = Array.isArray(parsed.products) ? parsed.products : [];
  } catch (error) {
    console.error("Impossible de charger les produits :", error);
  }
}

function loadOrders() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch (error) {
    console.error("Impossible de charger les commandes :", error);
    return [];
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

function loadClientSession() {
  try {
    const stored = window.localStorage.getItem(CLIENT_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveClientSession(session) {
  clientSession = session;
  try {
    window.localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Impossible d'enregistrer la session client :", error);
  }
  updateSessionUI();
}

function clearClientSession() {
  clientSession = null;
  window.localStorage.removeItem(CLIENT_SESSION_KEY);
  updateSessionUI();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value,
  );
}

function updateSessionUI() {
  if (clientSession) {
    elements.accountLabel.textContent = `Bonjour, ${clientSession.name.split(" ")[0] ?? clientSession.name
      }`;
    elements.logoutBtn?.classList.remove("hidden");
    elements.accountToggle?.classList.add("active");
    if (elements.accountSubtitle) {
      elements.accountSubtitle.textContent = `Connecté comme ${clientSession.name} (${clientSession.email})`;
    }
  } else {
    elements.accountLabel.textContent = "Mon compte";
    elements.logoutBtn?.classList.add("hidden");
    elements.accountToggle?.classList.remove("active");
    if (elements.accountSubtitle) {
      elements.accountSubtitle.textContent = "Connectez-vous pour suivre vos commandes.";
    }
  }
}

function renderProducts() {
  elements.productsList.innerHTML = "";
  if (!state.products.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Aucun produit disponible pour le moment.";
    elements.productsList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.products
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .forEach((product) => {
      if (product.hidden) return;
      const card = elements.productCardTemplate.content.cloneNode(true);
      card.querySelector(".product-title").textContent = product.name;
      card.querySelector(".product-description").textContent =
        product.description || "Pas de description";
      card.querySelector(".product-price").textContent = formatCurrency(product.price);
      card.querySelector(
        ".product-stock",
      ).textContent = `${product.stock} en stock pour retrait`;
      const image = card.querySelector(".product-image");
      const placeholder = card.querySelector(".product-placeholder");
      placeholder.textContent = product.name.charAt(0).toUpperCase();
      if (product.image?.dataUrl) {
        image.src = product.image.dataUrl;
        image.alt = product.image.name || product.name;
        image.style.display = "block";
        placeholder.style.display = "none";
      }
      const button = card.querySelector(".add-to-cart");
      if (!product.stock || product.stock <= 0) {
        button.disabled = true;
        button.textContent = "Indisponible";
        button.classList.add("disabled");
      } else {
        button.addEventListener("click", () => addToCart(product));
      }
      fragment.appendChild(card);
    });

  elements.productsList.appendChild(fragment);
}

function addToCart(product) {
  const existing = state.cart.find((item) => item.product.id === product.id);
  if (existing) {
    if (existing.quantity >= product.stock) {
      alert("Stock maximal atteint pour ce produit.");
      return;
    }
    existing.quantity += 1;
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
        <button class="icon-button remove" title="Retirer">
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

function ensureSession(options = { focusCheckout: false }) {
  if (clientSession) return true;
  pendingCheckout = !!options.focusCheckout;
  openModal(elements.authModal);
  return false;
}

function getOrderItemsFromCart() {
  return state.cart.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    productSku: item.product.sku,
    quantity: item.quantity,
    unitPrice: item.product.price,
  }));
}

function getOrderItems(order) {
  if (Array.isArray(order?.items) && order.items.length) {
    return order.items;
  }
  return [
    {
      productId: order.productId,
      productName: order.productName,
      productSku: order.productSku,
      quantity: order.quantity ?? 0,
      unitPrice: order.unitPrice ?? 0,
    },
  ];
}

function generatePickupCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const digits = Math.floor(Math.random() * 9000 + 1000);
  return `CMD-${random}-${digits}`;
}

function createOrderPayload({ customer, email, notes }) {
  const items = getOrderItemsFromCart();
  const total = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 0),
    0,
  );
  const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const reference = generatePickupCode();

  const order = {
    id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    reference,
    customer,
    email,
    notes,
    status: "En attente",
    createdAt: Date.now(),
    productId: items[0]?.productId ?? null,
    productSku: items[0]?.productSku ?? "",
    productName: items[0]?.productName ?? "",
    quantity,
    items,
    total,
    history: [
      {
        status: "En attente",
        date: Date.now(),
        note: "Commande créée depuis le site client.",
      },
    ],
  };

  return { order, reference, total };
}

function showConfirmation({ reference, total, customer }) {
  elements.confirmationContent.innerHTML = `
    <div class="confirmation-code">
      <span>Code de retrait</span>
      <strong>${reference}</strong>
    </div>
    <p><strong>${customer}</strong>, merci pour votre commande !</p>
    <p>Présentez ce code au comptoir pour récupérer vos produits.</p>
    <ul class="confirmation-list">
      ${state.cart
        .map(
          (item) => `
            <li>
              <span>${item.quantity} × ${item.product.name}</span>
              <strong>${formatCurrency(item.product.price * item.quantity)}</strong>
            </li>
          `,
        )
        .join("")}
    </ul>
    <p><strong>Total estimé :</strong> ${formatCurrency(total)}</p>
  `;
  openModal(elements.confirmationModal);
}

function getClientOrders() {
  if (!clientSession) return [];
  return loadOrders()
    .filter((order) => order.email && order.email.toLowerCase() === clientSession.email.toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt);
}

function renderAccountOrders() {
  const orders = getClientOrders();
  if (!orders.length) {
    elements.accountEmpty.classList.remove("hidden");
    elements.accountOrders.classList.add("hidden");
    return;
  }

  elements.accountEmpty.classList.add("hidden");
  elements.accountOrders.classList.remove("hidden");
  elements.accountOrders.innerHTML = orders
    .map((order) => {
      const items = getOrderItems(order);
      const itemsList = items
        .map(
          (item) =>
            `<li>${item.quantity ?? 0} × ${item.productName ?? "Produit"} — ${formatCurrency(
              (item.unitPrice ?? 0) * (item.quantity ?? 0),
            )}</li>`,
        )
        .join("");
      const timeline = Array.isArray(order.history)
        ? order.history
            .slice()
            .sort((a, b) => b.date - a.date)
            .map(
              (entry) => `
              <li>
                <span>${entry.status}</span>
                <small>${new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(entry.date)}</small>
                <p>${entry.note || ""}</p>
              </li>
            `,
            )
            .join("")
        : "";

      return `
        <article class="account-order">
          <header>
            <div>
              <strong>${order.reference}</strong>
              <p>${new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(order.createdAt)}</p>
            </div>
            <span class="order-status">${order.status}</span>
          </header>
          <div>
            <p><strong>Montant :</strong> ${formatCurrency(order.total ?? 0)}</p>
            <p><strong>Notes :</strong> ${order.notes || "—"}</p>
          </div>
          <ul class="confirmation-list">${itemsList}</ul>
          ${
            timeline
              ? `<ul class="status-history">
                  ${timeline}
                 </ul>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function openAccountModal() {
  if (!clientSession) {
    openModal(elements.authModal);
    return;
  }
  renderAccountOrders();
  elements.accountEmpty.classList.toggle("hidden", !!getClientOrders().length);
  elements.accountOrders.classList.toggle("hidden", !getClientOrders().length);
  elements.accountSubtitle.textContent = `Connecté comme ${clientSession.name} (${clientSession.email})`;
  openModal(elements.accountModal);
}

function closeAllModals() {
  [
    elements.authModal,
    elements.checkoutModal,
    elements.confirmationModal,
    elements.accountModal,
  ].forEach(closeModal);
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const name = formData.get("name").trim();
  const email = formData.get("email").trim().toLowerCase();
  if (!name || !email) return;
  saveClientSession({ name, email });
  closeModal(elements.authModal);
  if (pendingCheckout) {
    openCheckoutModal();
    pendingCheckout = false;
  } else {
    openAccountModal();
  }
}

function openCheckoutModal() {
  if (!state.cart.length) {
    alert("Votre panier est vide.");
    return;
  }
  if (!ensureSession({ focusCheckout: true })) {
    return;
  }
  elements.checkoutForm.customer.value = clientSession?.name ?? "";
  elements.checkoutForm.email.value = clientSession?.email ?? "";
  elements.checkoutForm.notes.value = "";
  openModal(elements.checkoutModal);
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  if (!state.cart.length) {
    alert("Votre panier est vide.");
    return;
  }
  const formData = new FormData(event.target);
  const customer = formData.get("customer").trim();
  const email = formData.get("email").trim().toLowerCase();
  const notes = formData.get("notes").trim();
  if (!customer || !email) {
    alert("Merci de renseigner vos informations.");
    return;
  }

  saveClientSession({ name: customer, email });

  const { order, reference, total } = createOrderPayload({ customer, email, notes });
  saveOrders(order);
  showConfirmation({ reference, total, customer });
  state.cart = [];
  renderCart();
  closeModal(elements.checkoutModal);
  toggleCart(false);
  renderAccountOrders();
}

function attachEventListeners() {
  elements.cartToggle?.addEventListener("click", () => toggleCart());
  elements.cartClose?.addEventListener("click", () => toggleCart(false));
  elements.cartOverlay?.addEventListener("click", () => toggleCart(false));
  elements.checkoutBtn?.addEventListener("click", openCheckoutModal);
  elements.checkoutClose?.addEventListener("click", () => closeModal(elements.checkoutModal));
  elements.checkoutCancel?.addEventListener("click", () => closeModal(elements.checkoutModal));
  elements.checkoutForm?.addEventListener("submit", handleCheckoutSubmit);

  elements.confirmationClose?.addEventListener("click", () => closeModal(elements.confirmationModal));
  elements.confirmationOk?.addEventListener("click", () => closeModal(elements.confirmationModal));

  elements.accountToggle?.addEventListener("click", openAccountModal);
  elements.accountClose?.addEventListener("click", () => closeModal(elements.accountModal));
  elements.logoutBtn?.addEventListener("click", () => {
    clearClientSession();
    closeModal(elements.accountModal);
  });

  elements.authForm?.addEventListener("submit", handleAuthSubmit);
  elements.authClose?.addEventListener("click", () => {
    closeModal(elements.authModal);
    pendingCheckout = false;
  });
  elements.authCancel?.addEventListener("click", () => {
    closeModal(elements.authModal);
    pendingCheckout = false;
  });

  elements.homeNav?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  elements.heroShopBtn?.addEventListener("click", () => {
    const top = elements.productsList?.offsetTop ?? 0;
    window.scrollTo({ top: top - 40, behavior: "smooth" });
  });
  elements.heroAccountBtn?.addEventListener("click", openAccountModal);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
      toggleCart(false);
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      loadState();
      renderProducts();
      renderAccountOrders();
    }
  });
}

function init() {
  clientSession = loadClientSession();
  updateSessionUI();
  loadState();
  renderProducts();
  renderCart();
  if (clientSession) {
    renderAccountOrders();
  }
  attachEventListeners();
}

init();

