// Demo Shop — single-page app with hash routing.
// State lives in sessionStorage so each browser context (each test) starts clean.
// Bug switches come from /features.json — see README "Break the build".

const USERS = { demo: { password: 'demo123', name: 'Demo User' } };
const PROMO_CODES = { SAVE10: 0.1 };
const PRODUCTS = [
  { id: 'p1', name: 'Wireless Mouse', price: 25.0 },
  { id: 'p2', name: 'Mechanical Keyboard', price: 89.9 },
  { id: 'p3', name: 'USB-C Hub', price: 39.5 },
  { id: 'p4', name: '27" Monitor', price: 249.0 },
  { id: 'p5', name: 'Laptop Stand', price: 34.0 },
  { id: 'p6', name: 'Noise-Cancelling Headphones', price: 179.0 },
];

let bugs = {};

// ── State ──────────────────────────────────────────────────────────────────

const store = {
  get(key, fallback) {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },
  set(key, value) { sessionStorage.setItem(key, JSON.stringify(value)); },
  clear() { sessionStorage.clear(); },
};

const currentUser = () => store.get('user', null);
const getCart = () => store.get('cart', {});
const setCart = (cart) => { store.set('cart', cart); renderNav(); };

function cartLines() {
  const cart = getCart();
  return PRODUCTS.filter(p => cart[p.id]).map(p => ({ ...p, qty: cart[p.id] }));
}

function cartTotals() {
  const subtotal = cartLines().reduce((s, l) => s + l.price * l.qty, 0);
  const promo = store.get('promo', null);
  let rate = promo ? PROMO_CODES[promo] ?? 0 : 0;
  if (bugs.promoCode && rate) rate = rate / 10; // BUG: applies 1% instead of 10%
  const discount = round(subtotal * rate);
  return { subtotal: round(subtotal), discount, total: round(subtotal - discount) };
}

const round = (n) => Math.round(n * 100) / 100;
const money = (n) => `$${n.toFixed(2)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// ── Rendering ──────────────────────────────────────────────────────────────

const view = () => document.getElementById('view');

function renderNav() {
  const user = currentUser();
  const nav = document.getElementById('nav');
  nav.hidden = !user;
  if (!user) return;
  nav.querySelector('[data-testid="welcome"]').textContent = `Hello, ${user.name}`;
  const count = Object.values(getCart()).reduce((s, q) => s + q, 0);
  // BUG: badge counts distinct products instead of total quantity
  nav.querySelector('[data-testid="cart-badge"]').textContent =
    String(bugs.cartBadge ? Object.keys(getCart()).length : count);
}

function renderLogin(message) {
  view().innerHTML = `
    <div class="card" style="max-width:380px;margin:auto">
      <h1>Sign in</h1>
      <form data-testid="login-form" novalidate>
        <label for="username">Username</label>
        <input id="username" name="username" data-testid="username" autocomplete="username" />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" data-testid="password" autocomplete="current-password" />
        <div class="row"><button type="submit" data-testid="login-submit">Sign in</button></div>
        ${message ? `<p class="error" data-testid="login-error">${esc(message)}</p>` : ''}
      </form>
    </div>`;
  view().querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    const user = USERS[username];
    if (user && user.password === password) {
      store.set('user', { username, name: user.name });
      location.hash = '#/products';
    } else {
      // BUG: silently ignores bad credentials
      renderLogin(bugs.loginError ? '' : 'Invalid username or password');
    }
  });
}

function renderProducts() {
  const q = (store.get('search', '') || '').toLowerCase();
  const items = PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
  view().innerHTML = `
    <h1>Products</h1>
    <input data-testid="search" placeholder="Search products" value="${esc(store.get('search', ''))}" />
    <div class="grid" style="margin-top:16px">
      ${items.map(p => `
        <div class="card" data-testid="product-card">
          <h3 data-testid="product-name">${esc(p.name)}</h3>
          <p data-testid="product-price">${money(p.price)}</p>
          <button data-testid="add-${p.id}" data-id="${p.id}">Add to cart</button>
        </div>`).join('')}
    </div>
    ${items.length === 0 ? '<p data-testid="no-results">No products match your search.</p>' : ''}`;

  const search = view().querySelector('[data-testid="search"]');
  search.addEventListener('input', (e) => {
    store.set('search', e.target.value);
    renderProducts();
    const again = view().querySelector('[data-testid="search"]');
    again.focus();
    again.setSelectionRange(again.value.length, again.value.length);
  });
  view().querySelectorAll('button[data-id]').forEach(btn => btn.addEventListener('click', () => {
    const cart = getCart();
    cart[btn.dataset.id] = (cart[btn.dataset.id] || 0) + 1;
    setCart(cart);
  }));
}

function renderCart(promoMessage) {
  const lines = cartLines();
  if (lines.length === 0) {
    view().innerHTML = `<h1>Your cart</h1><p data-testid="cart-empty">Your cart is empty.</p>
      <a href="#/products">Continue shopping</a>`;
    return;
  }
  const t = cartTotals();
  view().innerHTML = `
    <h1>Your cart</h1>
    <div class="card">
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th></th></tr></thead>
        <tbody>
          ${lines.map(l => `
            <tr data-testid="cart-line-${l.id}">
              <td>${esc(l.name)}</td>
              <td>
                <button class="secondary" data-testid="dec-${l.id}" data-act="dec" data-id="${l.id}">−</button>
                <span data-testid="qty-${l.id}">${l.qty}</span>
                <button class="secondary" data-testid="inc-${l.id}" data-act="inc" data-id="${l.id}">+</button>
              </td>
              <td>${money(l.price * l.qty)}</td>
              <td><button class="secondary" data-testid="remove-${l.id}" data-act="remove" data-id="${l.id}">Remove</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="row">
        <input data-testid="promo-input" placeholder="Promo code" style="max-width:200px" />
        <button class="secondary" data-testid="promo-apply">Apply</button>
      </div>
      ${promoMessage ? `<p class="${promoMessage.ok ? 'success' : 'error'}" data-testid="promo-message">${esc(promoMessage.text)}</p>` : ''}
      <p>Subtotal: <strong data-testid="subtotal">${money(t.subtotal)}</strong></p>
      <p>Discount: <strong data-testid="discount">${money(t.discount)}</strong></p>
      <p>Total: <strong data-testid="total">${money(t.total)}</strong></p>
      <button data-testid="checkout">Proceed to checkout</button>
    </div>`;

  view().querySelectorAll('button[data-act]').forEach(btn => btn.addEventListener('click', () => {
    const cart = getCart();
    const id = btn.dataset.id;
    if (btn.dataset.act === 'inc') cart[id] += 1;
    if (btn.dataset.act === 'dec') cart[id] -= 1;
    if (btn.dataset.act === 'remove' || cart[id] <= 0) delete cart[id];
    setCart(cart);
    renderCart();
  }));
  view().querySelector('[data-testid="promo-apply"]').addEventListener('click', () => {
    const code = view().querySelector('[data-testid="promo-input"]').value.trim().toUpperCase();
    if (PROMO_CODES[code] !== undefined) {
      store.set('promo', code);
      renderCart({ ok: true, text: `Promo code ${code} applied` });
    } else {
      renderCart({ ok: false, text: 'Invalid promo code' });
    }
  });
  view().querySelector('[data-testid="checkout"]').addEventListener('click', () => { location.hash = '#/checkout'; });
}

function renderCheckout() {
  if (cartLines().length === 0) { location.hash = '#/cart'; return; }
  const t = cartTotals();
  view().innerHTML = `
    <h1>Checkout</h1>
    <form class="card" data-testid="checkout-form" novalidate>
      <label for="fullName">Full name</label>
      <input id="fullName" name="fullName" data-testid="full-name" />
      <label for="email">Email</label>
      <input id="email" name="email" data-testid="email" />
      <label for="address">Shipping address</label>
      <input id="address" name="address" data-testid="address" />
      <p>Amount to pay: <strong data-testid="checkout-total">${money(t.total)}</strong></p>
      <div class="row"><button type="submit" data-testid="place-order">Place order</button></div>
      <div data-testid="checkout-errors"></div>
    </form>`;

  view().querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const errors = [];
    if (!f.fullName.value.trim()) errors.push('Full name is required');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim())) errors.push('A valid email is required');
    if (!f.address.value.trim()) errors.push('Shipping address is required');

    // BUG: validation result is ignored, so an empty form places an order
    if (errors.length && !bugs.checkoutValidation) {
      view().querySelector('[data-testid="checkout-errors"]').innerHTML =
        errors.map(m => `<p class="error" data-testid="checkout-error">${esc(m)}</p>`).join('');
      return;
    }
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    store.set('lastOrder', { id: orderId, total: t.total });
    store.set('cart', {});
    store.set('promo', null);
    location.hash = '#/confirmation';
  });
}

function renderConfirmation() {
  const order = store.get('lastOrder', null);
  if (!order) { location.hash = '#/products'; return; }
  view().innerHTML = `
    <div class="card">
      <h1 data-testid="confirmation-title">Thank you for your order!</h1>
      <p>Order number: <strong data-testid="order-id">${esc(order.id)}</strong></p>
      <p>Total paid: <strong data-testid="order-total">${money(order.total)}</strong></p>
      <a href="#/products">Back to products</a>
    </div>`;
}

// ── Router ─────────────────────────────────────────────────────────────────

const ROUTES = {
  '#/login': renderLogin,
  '#/products': renderProducts,
  '#/cart': renderCart,
  '#/checkout': renderCheckout,
  '#/confirmation': renderConfirmation,
};

function route() {
  const hash = location.hash || '#/products';
  if (!currentUser() && hash !== '#/login') { location.hash = '#/login'; return; }
  if (currentUser() && hash === '#/login') { location.hash = '#/products'; return; }
  renderNav();
  (ROUTES[hash] ?? renderProducts)();
}

document.querySelector('[data-testid="logout"]').addEventListener('click', () => {
  store.clear();
  location.hash = '#/login';
});

window.addEventListener('hashchange', route);

fetch('/features.json')
  .then(r => r.json())
  .then(f => { bugs = f.bugs ?? {}; })
  .catch(() => { bugs = {}; })
  .finally(route);
