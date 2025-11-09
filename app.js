const STORAGE_KEY = "gestionCommandesState_v1";
const CLIENT_STATE_KEY = "gestionCommandesClient_v1";

const elements = {
  productsGrid: document.getElementById("productsGrid"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  cartPanel: document.getElementById("cartPanel"),
  cartItems: document.getElementById("cartItems"),
  cartCount: document.getElementById("cartCount"),
  cartSubtotal: document.getElementById("cartSubtotal"),
  cartDiscount: document.getElementById("cartDiscount"),
  cartTotal: document.getElementById("cartTotal"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  closeCart: document.getElementById("closeCart"),
  openCartShortcut: document.getElementById("openCartShortcut"),
  openTrackingShortcut: document.getElementById("openTrackingShortcut"),
  scrollToCatalog: document.getElementById("scrollToCatalog"),
  catalogSection: document.getElementById("catalog"),
  storeMetricProducts: document.getElementById("storeMetricProducts"),
  storeMetricCart: document.getElementById("storeMetricCart"),
  storeMetricTotal: document.getElementById("storeMetricTotal"),
  checkoutModal: document.getElementById("checkoutModal"),
  checkoutClose: document.getElementById("checkoutClose"),
  checkoutCancel: document.getElementById("checkoutCancel"),
  checkoutForm: document.getElementById("checkoutForm"),
  modalTotal: document.getElementById("modalTotal"),
  modalItems: document.getElementById("modalItems"),
  confirmationModal: document.getElementById("confirmationModal"),
  confirmationClose: document.getElementById("confirmationClose"),
  confirmationDone: document.getElementById("confirmationDone"),
  confirmationTrack: document.getElementById("confirmationTrack"),
  confirmationCode: document.getElementById("confirmationCode"),
  confirmationEmail: document.getElementById("confirmationEmail"),
  confirmationList: document.getElementById("confirmationList"),
  trackingModal: document.getElementById("trackingModal"),
  trackingForm: document.getElementById("trackingForm"),
  trackingClose: document.getElementById("trackingClose"),
  trackingCancel: document.getElementById("trackingCancel"),
  trackingResult: document.getElementById("trackingResult"),
};

const DEFAULT_PRODUCTS = [
  {
    id: "prd-basket-nasa",
    name: "basket nasa",
    description: "Sneakers édition orbitale, semelle mémoire de forme.",
    price: 40,
    stock: 5,
    sku: "BASKET-NASA-001",
  },
  {
    id: "prd-boite-bombom",
    name: "boite bombom",
    description: "Assortiment premium de douceurs artisanales.",
    price: 5,
    stock: 4,
    sku: "BOITE-BOMBOM-002",
  },
  {
    id: "prd-lingette",
    name: "lingetteplastique",
    description: "Lot de lingettes nettoyantes recyclées.",
    price: 10,
    stock: 42,
    sku: "LINGETTE-PLASTIQUE-003",
  },
  {
    id: "prd-livre-menage",
    name: "livre la femme de menage 4",
    description: "Roman à suspense best-seller.",
    price: 22,
    stock: 17,
    sku: "LIVRE-MENAGE4-004",
  },
  {
    id: "prd-livre-vlase",
    name: "livre la vlase des ame",
    description: "Saga dramatique inspirée de faits réels.",
    price: 22.9,
    stock: 55,
    sku: "LIVRE-VLASE-005",
  },
  {
    id: "prd-livre-musso",
    name: "livre musso",
    description: "Dernier roman de Guillaume Musso.",
    price: 22.9,
    stock: 51,
    sku: "LIVRE-MUSSO-006",
  },
  {
    id: "prd-orange-lot",
    name: "orange lot",
    description: "Lot de fruits vitaminés sélectionnés chaque matin.",
    price: 8,
    stock: 50,
    sku: "ORANGE-LOT-007",
  },
  {
    id: "prd-tableau",
    name: "tableau",
    description: "Toile minimaliste inspirée du cosmos.",
    price: 23,
    stock: 52,
    sku: "TABLEAU-007",
  },
  {
    id: "prd-veste-ski",
    name: "veste ski enfant",
    description: "Veste technique enfant, isolation thermique renforcée.",
    price: 20,
    stock: 50,
    sku: "VESTE-SKI-008",
  },
];

const state = {
  products: [],
  cart: [],
  discountRate: 0,
  totals: {
    subtotal: 0,
    discount: 0,
    total: 0,
  },
  orders: [],
};

function renderOrdersBoard() {
  if (!elements.ordersBoardList) return;
  const orders = state.orders.slice(0, 6);
  if (!orders.length) {
    if (elements.ordersBoardEmpty && !elements.ordersBoardList.contains(elements.ordersBoardEmpty)) {
      elements.ordersBoardList.innerHTML = "";
      elements.ordersBoardList.appendChild(elements.ordersBoardEmpty);
    }
    elements.ordersBoardEmpty?.classList.remove("hidden");
    return;
  }

  elements.ordersBoardEmpty?.classList.add("hidden");
  const fragment = document.createDocumentFragment();
  orders.forEach((order) => {
    const card = document.createElement("article");
    card.className = "orders-board-card";

    const header = document.createElement("header");
    const code = document.createElement("span");
    code.textContent = order.reference;
    const status = document.createElement("span");
    status.className = "orders-board-status";
    status.textContent = formatStatus(order.status || "En préparation");
    header.append(code, status);

    const meta = document.createElement("div");
    meta.className = "orders-board-meta";
    const total = document.createElement("span");
    total.textContent = formatCurrency(order.total ?? 0);
    const date = document.createElement("span");
    date.textContent = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(order.updatedAt ?? order.createdAt ?? Date.now());
    meta.append(total, date);

    card.append(header, meta);
    fragment.appendChild(card);
  });

  elements.ordersBoardList.innerHTML = "";
  elements.ordersBoardList.appendChild(fragment);
}

function loadAdminProducts() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PRODUCTS;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.products) || !parsed.products.length) {
      return DEFAULT_PRODUCTS;
    }
    return parsed.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "Pas de description",
      price: product.price ?? 0,
      stock: product.stock ?? 0,
      sku: product.sku || product.id,
      image: product.image?.dataUrl || null,
    }));
  } catch (error) {
    console.error("Impossible de charger les produits admin :", error);
    return DEFAULT_PRODUCTS;
  }
}

function loadClientState() {
  try {
    const stored = window.localStorage.getItem(CLIENT_STATE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    state.cart = Array.isArray(parsed.cart) ? parsed.cart : [];
    state.orders = Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch (error) {
    console.warn("Impossible de charger l'état client :", error);
  }
}

function saveClientState() {
  const payload = {
    cart: state.cart,
    orders: state.orders,
  };
  window.localStorage.setItem(CLIENT_STATE_KEY, JSON.stringify(payload));
}

function classifyStock(stock) {
  if (stock <= 0) return "stock-low";
  if (stock <= 10) return "stock-medium";
  return "stock-high";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function computeTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.min(subtotal, (subtotal * state.discountRate) / 100);
  const total = subtotal - discount;
  state.totals = {
    subtotal,
    discount,
    total,
  };
  return state.totals;
}

function updateMetrics() {
  if (elements.storeMetricProducts) {
    elements.storeMetricProducts.textContent = state.products.length.toString();
  }
  if (elements.storeMetricCart) {
    const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.storeMetricCart.textContent = cartCount.toString();
  }
  if (elements.storeMetricTotal) {
    elements.storeMetricTotal.textContent = formatCurrency(state.totals.total);
  }
}

function renderProducts() {
  if (!elements.productsGrid) return;
  const query = elements.searchInput?.value.trim().toLowerCase() ?? "";
  const sort = elements.sortSelect?.value ?? "featured";

  let products = state.products.slice();

  if (query) {
    products = products.filter((product) => {
      const haystack = `${product.name} ${product.description} ${product.sku}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  products.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "stock-desc":
        return (b.stock ?? 0) - (a.stock ?? 0);
      default:
        return 0;
    }
  });

  elements.productsGrid.innerHTML = "";
  if (!products.length) {
    elements.productsGrid.innerHTML = `<p class="catalog-empty">Aucun produit ne correspond à votre recherche.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const article = document.createElement("article");
    article.className = "product-card";

    const header = document.createElement("div");
    header.className = "product-header";
    const avatar = document.createElement("div");
    avatar.className = "product-avatar";
    if (product.image) {
      const img = document.createElement("img");
      img.src = product.image;
      img.alt = product.name;
      avatar.appendChild(img);
    } else {
      avatar.textContent = product.name.charAt(0).toUpperCase();
    }
    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "product-name";
    title.textContent = product.name;
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description || "Pas de description";
    heading.append(title, description);
    header.append(avatar, heading);

    const meta = document.createElement("div");
    meta.className = "product-meta";
    const stockBadge = document.createElement("span");
    stockBadge.className = `badge ${classifyStock(product.stock)}`;
    stockBadge.textContent =
      product.stock > 0 ? `${product.stock} en stock` : "Rupture temporaire";
    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = formatCurrency(product.price);
    meta.append(stockBadge, price);

    const footer = document.createElement("div");
    footer.className = "product-actions";

    const skuLabel = document.createElement("span");
    skuLabel.className = "badge sku";
    skuLabel.textContent = product.sku;

    const addButton = document.createElement("button");
    addButton.className = "btn primary add-to-cart";
    addButton.dataset.id = product.id;
    addButton.disabled = product.stock <= 0;
    addButton.innerHTML = `
      Ajouter
      <span class="material-icons-outlined">add_shopping_cart</span>
    `;
    addButton.addEventListener("click", (event) => {
      event.preventDefault();
      addToCart(product.id);
    });

    footer.append(skuLabel, addButton);

    article.append(header, meta, footer);
    fragment.appendChild(article);
  });

  elements.productsGrid.appendChild(fragment);
}

function renderCart() {
  if (!elements.cartItems) return;
  const fragment = document.createDocumentFragment();

  if (!state.cart.length) {
    elements.cartItems.innerHTML =
      '<p class="cart-empty">Votre panier est vide. Ajoutez un article pour commencer.</p>';
  } else {
    state.cart.forEach((item) => {
      const product = state.products.find((product) => product.id === item.productId);
      const article = document.createElement("article");
      article.className = "cart-item";
      article.dataset.id = item.productId;

      const header = document.createElement("header");
      const name = document.createElement("span");
      name.textContent = product?.name ?? "Produit";
      const remove = document.createElement("button");
      remove.className = "cart-remove";
      remove.dataset.action = "remove";
      remove.dataset.id = item.productId;
      remove.title = "Supprimer";
      remove.innerHTML = '<span class="material-icons-outlined">close</span>';
      header.append(name, remove);

      const footer = document.createElement("footer");
      const quantity = document.createElement("div");
      quantity.className = "cart-quantity";

      const minus = document.createElement("button");
      minus.dataset.action = "decrease";
      minus.dataset.id = item.productId;
      minus.textContent = "−";
      const qty = document.createElement("span");
      qty.textContent = item.quantity.toString();
      const plus = document.createElement("button");
      plus.dataset.action = "increase";
      plus.dataset.id = item.productId;
      plus.textContent = "+";
      if (product && item.quantity >= product.stock) {
        plus.disabled = true;
      }

      quantity.append(minus, qty, plus);

      const price = document.createElement("span");
      price.className = "cart-price";
      price.textContent = formatCurrency(item.price * item.quantity);

      footer.append(quantity, price);
      article.append(header, footer);
      fragment.appendChild(article);
    });
    elements.cartItems.innerHTML = "";
    elements.cartItems.appendChild(fragment);
  }

  const totals = computeTotals();
  elements.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0).toString();
  elements.cartSubtotal.textContent = formatCurrency(totals.subtotal);
  elements.cartDiscount.textContent = `- ${formatCurrency(totals.discount)}`;
  elements.cartTotal.textContent = formatCurrency(totals.total);
  elements.checkoutBtn.disabled = !state.cart.length;
  updateMetrics();
  renderOrdersBoard();
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  if (product.stock <= 0) {
    alert("Ce produit n'est plus en stock.");
    return;
  }
  const line = state.cart.find((item) => item.productId === productId);
  if (line) {
    if (line.quantity >= product.stock) {
      alert("Quantité maximale disponible atteinte.");
      return;
    }
    line.quantity += 1;
  } else {
    state.cart.push({
      productId,
      price: product.price,
      quantity: 1,
      name: product.name,
    });
  }
  saveClientState();
  renderCart();
  openCart();
}

function setCartQuantity(productId, quantity) {
  const line = state.cart.find((item) => item.productId === productId);
  const product = state.products.find((item) => item.id === productId);
  if (!line || !product) return;
  const safeQuantity = Math.max(0, Math.min(product.stock, quantity));
  if (safeQuantity === 0) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
  } else {
    line.quantity = safeQuantity;
  }
  saveClientState();
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.productId !== productId);
  saveClientState();
  renderCart();
}

function openCart() {
  elements.cartPanel?.classList.add("open");
}

function closeCart() {
  elements.cartPanel?.classList.remove("open");
}

function openModal(modal) {
  modal?.classList.remove("hidden");
}

function closeModal(modal) {
  modal?.classList.add("hidden");
}

function generateCode() {
  return `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 5)}`
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/I/g, "1");
}

function formatStatus(status) {
  const dictionary = {
    "En préparation": "En préparation",
    "En attente": "En attente",
    "En cours de livraison": "En cours de livraison",
    "Prêt pour retrait": "Prêt pour retrait",
    "Remis au client": "Retrait effectué",
    Livré: "Livré",
    Annulé: "Annulée",
  };
  return dictionary[status] || status;
}

function renderTrackingResult(order) {
  if (!elements.trackingResult) return;
  if (!order) {
    elements.trackingResult.innerHTML =
      '<p class="tracking-empty">Aucune commande trouvée pour ce code et cet e-mail.</p>';
    elements.trackingResult.classList.remove("hidden");
    renderOrdersBoard();
    return;
  }

  const itemsList = order.items
    ?.map(
      (item) =>
        `<li>${item.quantity ?? 0} × ${item.productName ?? "Produit"} (${formatCurrency(
          (item.unitPrice ?? 0) * (item.quantity ?? 0),
        )})</li>`,
    )
    .join("") ?? "";

  const history =
    order.history
      ?.slice()
      .sort((a, b) => b.date - a.date)
      .map(
        (entry) => `
          <li>
            <div class="tracking-step">
              <span class="tracking-status">${formatStatus(entry.status)}</span>
              <span class="tracking-date">${new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(entry.date)}</span>
            </div>
            <p>${entry.note || ""}</p>
          </li>
        `,
      )
      .join("") ?? "";

  elements.trackingResult.innerHTML = `
    <div class="tracking-summary">
      <div>
        <span>Code retrait</span>
        <strong>${order.reference}</strong>
      </div>
      <div>
        <span>Statut actuel</span>
        <strong>${formatStatus(order.status)}</strong>
      </div>
      <div>
        <span>Total</span>
        <strong>${formatCurrency(order.total ?? 0)}</strong>
      </div>
    </div>
    <h4>Articles</h4>
    <ul class="tracking-items">${itemsList}</ul>
    <h4>Historique</h4>
    <ul class="tracking-history">${history || "<li>Aucun suivi supplémentaire.</li>"}</ul>
  `;
  elements.trackingResult.classList.remove("hidden");
  renderOrdersBoard();
}

function findAdminOrder(reference, email) {
  try {
    const adminRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!adminRaw) return null;
    const adminState = JSON.parse(adminRaw);
    const orders = Array.isArray(adminState.orders) ? adminState.orders : [];
    const match = orders
      .slice()
      .reverse()
      .find(
        (order) =>
          (order.reference === reference || order.id === reference) &&
          (!email || order.email?.toLowerCase() === email.toLowerCase()),
      );
    if (match) {
      const existing = state.orders.find((item) => item.reference === match.reference);
      if (existing) {
        existing.status = match.status;
        existing.total = match.total;
        existing.updatedAt = Date.now();
      } else {
        state.orders.unshift({
          reference: match.reference,
          email: match.email,
          name: match.customer,
          status: match.status,
          total: match.total,
          createdAt: match.createdAt,
          updatedAt: Date.now(),
        });
      }
      saveClientState();
    }
    return match;
  } catch (error) {
    console.warn("Erreur lors de la lecture des commandes admin :", error);
    return null;
  }
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.checkoutForm);
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  if (!name || !email) {
    alert("Renseignez au minimum votre nom et votre e-mail.");
    return;
  }

  const code = generateCode();
  elements.confirmationCode.textContent = code;
  elements.confirmationEmail.textContent = email;
  const list = state.cart
    .map((line) => {
      const product = state.products.find((item) => item.id === line.productId);
      return `<li>${line.quantity} × ${product?.name ?? "Produit"} (${formatCurrency(
        line.price * line.quantity,
      )})</li>`;
    })
    .join("");
  elements.confirmationList.innerHTML = list;

  closeModal(elements.checkoutModal);
  openModal(elements.confirmationModal);

  state.orders.unshift({
    reference: code,
    email,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    total: state.totals.total,
    status: "En préparation",
  });

  saveClientState();
  renderOrdersBoard();

  // Persist order in admin localStorage
  try {
    const adminStateRaw = window.localStorage.getItem(STORAGE_KEY);
    if (adminStateRaw) {
      const adminState = JSON.parse(adminStateRaw);
      const order = {
        id: `ord-${Date.now().toString(36)}`,
        reference: code,
        customer: name,
        email,
        status: "En préparation",
        createdAt: Date.now(),
        notes: formData.get("notes")?.toString().trim() || "",
        items: state.cart.map((line) => ({
          productId: line.productId,
          productName: state.products.find((item) => item.id === line.productId)?.name ?? "",
          productSku: state.products.find((item) => item.id === line.productId)?.sku ?? "",
          quantity: line.quantity,
          unitPrice: line.price,
        })),
        total: state.totals.total,
        history: [
          {
            status: "En préparation",
            date: Date.now(),
            note: "Commande réservée via site client.",
          },
        ],
      };
      adminState.orders = adminState.orders || [];
      adminState.orders.push(order);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(adminState));
    }
  } catch (error) {
    console.warn("Impossible de synchroniser la commande avec l'interface admin :", error);
  }

  state.cart = [];
  saveClientState();
  renderCart();
}

function attachEventListeners() {
  elements.productsGrid?.addEventListener("click", (event) => {
    const button = event.target.closest(".add-to-cart");
    if (!button) return;
    addToCart(button.dataset.id);
  });

  elements.cartItems?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const productId = button.dataset.id;
    switch (button.dataset.action) {
      case "increase":
        setCartQuantity(productId, (state.cart.find((item) => item.productId === productId)?.quantity ?? 0) + 1);
        break;
      case "decrease":
        setCartQuantity(productId, (state.cart.find((item) => item.productId === productId)?.quantity ?? 0) - 1);
        break;
      case "remove":
        removeFromCart(productId);
        break;
      default:
        break;
    }
  });

  elements.searchInput?.addEventListener("input", renderProducts);
  elements.sortSelect?.addEventListener("change", renderProducts);
  elements.checkoutBtn?.addEventListener("click", () => {
    const totals = computeTotals();
    elements.modalTotal.textContent = formatCurrency(totals.total);
    elements.modalItems.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    openModal(elements.checkoutModal);
  });

  elements.checkoutClose?.addEventListener("click", () => closeModal(elements.checkoutModal));
  elements.checkoutCancel?.addEventListener("click", () => closeModal(elements.checkoutModal));
  elements.checkoutForm?.addEventListener("submit", handleCheckoutSubmit);

  elements.confirmationClose?.addEventListener("click", () => closeModal(elements.confirmationModal));
  elements.confirmationDone?.addEventListener("click", () => closeModal(elements.confirmationModal));

  elements.closeCart?.addEventListener("click", closeCart);
  elements.openCartShortcut?.addEventListener("click", openCart);
  elements.openTrackingShortcut?.addEventListener("click", () => {
    if (elements.trackingResult) {
      elements.trackingResult.classList.add("hidden");
      elements.trackingResult.innerHTML = "";
    }
    elements.trackingForm.reset();
    openModal(elements.trackingModal);
  });
  elements.scrollToCatalog?.addEventListener("click", () =>
    elements.catalogSection?.scrollIntoView({ behavior: "smooth" }),
  );

  elements.checkoutModal?.addEventListener("click", (event) => {
    if (event.target === elements.checkoutModal) closeModal(elements.checkoutModal);
  });
  elements.confirmationModal?.addEventListener("click", (event) => {
    if (event.target === elements.confirmationModal) closeModal(elements.confirmationModal);
  });
  elements.trackingModal?.addEventListener("click", (event) => {
    if (event.target === elements.trackingModal) closeModal(elements.trackingModal);
  });

  elements.trackingClose?.addEventListener("click", () => closeModal(elements.trackingModal));
  elements.trackingCancel?.addEventListener("click", () => closeModal(elements.trackingModal));
  elements.trackingForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = elements.trackingForm.code.value.trim().toUpperCase();
    const email = elements.trackingForm.email.value.trim();
    const order = findAdminOrder(code, email);
    renderTrackingResult(order);
  });

  elements.confirmationTrack?.addEventListener("click", () => {
    closeModal(elements.confirmationModal);
    if (elements.trackingResult) {
      elements.trackingResult.classList.add("hidden");
      elements.trackingResult.innerHTML = "";
    }
    elements.trackingForm.code.value = elements.confirmationCode.textContent;
    elements.trackingForm.email.value = elements.confirmationEmail.textContent;
    openModal(elements.trackingModal);
  });

  elements.ordersRefresh?.addEventListener("click", () => {
    renderOrdersBoard();
  });

  elements.ordersOpenTracking?.addEventListener("click", () => {
    if (elements.trackingResult) {
      elements.trackingResult.classList.add("hidden");
      elements.trackingResult.innerHTML = "";
    }
    elements.trackingForm.reset();
    openModal(elements.trackingModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal(elements.checkoutModal);
      closeModal(elements.confirmationModal);
      closeModal(elements.trackingModal);
      closeCart();
    }
  });
}

function init() {
  state.products = loadAdminProducts();
  loadClientState();
  renderProducts();
  renderCart();
  renderOrdersBoard();
  attachEventListeners();
}

init();

