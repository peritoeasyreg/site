// === EasyReg Shop (cookie-based cart) ===
// Cart persisted ONLY in cookie (shared across subdomains).
// Domain: .easyreg.com.br, SameSite=Lax, Secure

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/* ======================
   Cart persistence via Cookie
   (armazenado como { [id]: qty })
====================== */
const CART_COOKIE = 'er_cart_v2';
const COOKIE_DOMAIN = '.easyreg.com.br';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 1 dia

function setCookie(name, value, maxAgeSec) {
  document.cookie = `${name}=${value}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax; Secure`;
}
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-[\\]/{}()*+?.\\\\^$|]/g,'\\$&') + '=([^;]*)'));
  return m ? m[1] : null;
}
function encodeObj(obj) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch { return ''; }
}
function decodeObj(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
}

function migrateFromLocalStorageIfAny() {
  try {
    const legacyIds = localStorage.getItem('cart_ids');
    const legacyMap = localStorage.getItem('cart_map_v2');
    let map = null;
    if (legacyMap) {
      map = JSON.parse(legacyMap || '{}');
    } else if (legacyIds) {
      const arr = JSON.parse(legacyIds || '[]');
      map = {};
      if (Array.isArray(arr)) {
        arr.forEach(id => { if (id) map[id] = (map[id] || 0) + 1; });
      }
    }
    if (map && typeof map === 'object') {
      setCookie(CART_COOKIE, encodeObj(map), COOKIE_MAX_AGE);
      localStorage.removeItem('cart_ids');
      localStorage.removeItem('cart_map_v2');
    }
  } catch {}
}

function loadCartMap() {
  const c = getCookie(CART_COOKIE);
  if (!c) {
    migrateFromLocalStorageIfAny();
    const after = getCookie(CART_COOKIE);
    if (!after) return {};
    const obj = decodeObj(after);
    return (obj && typeof obj === 'object') ? obj : {};
  }
  const obj = decodeObj(c);
  return (obj && typeof obj === 'object') ? obj : {};
}
function saveCartMap(map) {
  setCookie(CART_COOKIE, encodeObj(map || {}), COOKIE_MAX_AGE);
}

let cartMap = loadCartMap();
window.cartMap = () => ({ ...cartMap }); // debug/helper

/* =======================
   Util: imagens (data:)
======================= */
function normalizeImageSrc(src) {
  if (!src) return '';
  if (/^data:/i.test(src)) return src;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('https://')) return src;
  if (/^[A-Za-z0-9+/=]+$/.test(src) && src.length > 100) return 'data:image/jpeg;base64,' + src;
  return src;
}

function handleImgError(img, parentClass = 'media') {
  if (!img) return;
  const box = img.closest('.' + parentClass);
  if (box) box.classList.add('noimg');
  img.style.display = 'none';
}

/* =======================
   Toast/Banner
======================= */
function showBanner(message = 'ok') {
  let el = document.getElementById('cartBanner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cartBanner';
    el.setAttribute('role', 'status');
    Object.assign(el.style, {
      position: 'fixed', top: '16px', right: '16px', zIndex: '9999',
      padding: '12px 16px', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,.2)',
      background: 'linear-gradient(135deg, rgba(24,138,226,1) 0%, rgba(14,115,196,1) 100%)',
      color: '#fff', font: '600 14px/1.2 Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      opacity: '0', transform: 'translateY(-8px)', transition: 'opacity .2s ease, transform .2s ease'
    });
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-8px)'; }, 1600);
}

/* =========================
   Fetch util (arrays JSON)
========================= */
async function fetchJsonArray(endpoint) {
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ===================================
   Modal de Produto (65% da viewport)
=================================== */
let __MODAL_ROOT = null;
function ensureModalRoot() {
  if (!__MODAL_ROOT) {
    __MODAL_ROOT = document.createElement('div');
    __MODAL_ROOT.id = 'product-modal-root';
    document.body.appendChild(__MODAL_ROOT);
  }
}
function lockBodyScroll(lock) {
  if (lock) {
    const sb = window.innerWidth - document.documentElement.clientWidth;
    document.body.dataset._scrollLock = '1';
    document.body.style.overflow = 'hidden';
    if (sb > 0) document.body.style.paddingRight = sb + 'px';
  } else {
    if (document.body.dataset._scrollLock) {
      delete document.body.dataset._scrollLock;
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }
}
function escapeHtml(s) {
  return s.replace(/[&<>\"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
function buildImagesArray(p) {
  const cover = p?.image ? [p.image] : [];
  const extra = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
  const all = [...cover, ...extra].filter(Boolean);
  return all.length ? all : [''];
}

function injectGlobalStylesOnce() {
  if (injectGlobalStylesOnce._done) return;
  injectGlobalStylesOnce._done = true;
  const css = `
  /* Modal */
  .pe-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9998;padding:2vw;}
  .pe-modal{width:min(65vw,1100px);max-width:95vw;max-height:92vh;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;position:relative;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
  .pe-close{position:absolute;top:10px;right:12px;width:36px;height:36px;border-radius:999px;border:none;background:#f1f5f9;color:#0b1f3a;font-size:22px;line-height:1;cursor:pointer;z-index:2}
  .pe-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:18px}
  .pe-gallery{background:#fff;border:1px solid #e5eef7;border-radius:14px;padding:10px}
  .pe-viewport{position:relative;overflow:hidden;border-radius:12px;background:#f8fafc;height:340px;display:flex;align-items:center}
  .pe-track{display:flex;transition:transform .35s ease;width:100%;height:100%}
  .pe-slide{flex:0 0 100%;display:flex;align-items:center;justify-content:center;overflow:hidden;height:100%}
  .pe-slide img{max-width:100%;max-height:100%;object-fit:contain;display:block}
  .pe-nav{position:absolute;top:50%;transform:translateY(-50%);border:none;background:rgba(0,0,0,.35);color:#fff;width:36px;height:36px;border-radius:999px;cursor:pointer}
  .pe-prev{left:8px} .pe-next{right:8px}
  .pe-dots{display:flex;gap:6px;justify-content:center;margin-top:10px}
  .pe-dots button{width:8px;height:8px;border-radius:999px;border:none;background:#cfe3f8;cursor:pointer}
  .pe-dots button[aria-current="true"]{background:#188ae2}
  .pe-details{display:flex;flex-direction:column;gap:8px}
  .pe-title{font-size:22px;margin:0}
  .pe-sub{margin:0;color:#475569}
  .pe-code{font-family:ui-monospace, SFMono-Regular, Menlo, monospace}
  .pe-price{font-weight:800;font-size:20px;color:#0b1f3a;margin:6px 0 10px}
  .pe-dl{display:flex;flex-direction:column;gap:4px}
  .pe-row{display:flex;gap:10px;font-size:14px;color:#334155}
  .pe-row dt{width:84px;font-weight:600;color:#1f2937}
  .pe-desc{margin-top:8px}
  .pe-desc h2{font-size:15px;margin:0 0 6px}
  .pe-desc p{font-size:14px;line-height:1.5;color:#374151}
  .pe-actions{display:flex;align-items:center;gap:8px;margin-top:auto;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1px solid #cfe3f8;background:#f5faff;text-decoration:none;color:#0c3b66;cursor:pointer}
  .btn.primary{background:#188ae2;border-color:#188ae2;color:#fff}
  .btn.success{background:#16a34a;border-color:#16a34a;color:#fff}
  .btn.muted{background:#eef4fb;border-color:#dbe8f8;color:#334155}
  .qtybox{display:inline-flex;align-items:center;border:1px solid #cfe3f8;border-radius:10px;overflow:hidden}
  .qtybox button{border:none;background:#f1f5f9;padding:8px 10px;cursor:pointer}
  .qtybox input{width:44px;text-align:center;border:none;outline:none;padding:8px 0}

  /* Botões dos cards */
  .product .actions .btn.success{background:#16a34a;border-color:#16a34a;color:#fff}

  /* Painel de carrinho */
  .cart-panel{position:fixed;right:18px;bottom:18px;z-index:9997;max-width:min(92vw,420px)}
  .cart-card{background:#ffffff;border:1px solid rgba(0,0,0,.08);border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,.15);overflow:hidden}
  .cart-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:linear-gradient(180deg,#f8fbff,#f2f7fd)}
  .cart-head h3{margin:0;font:600 14px/1 Inter,system-ui,sans-serif;color:#0b1f3a}
  .cart-body{max-height:45vh;overflow:auto}
  .cart-item{display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid #eef2f7}
  .cart-item img{width:48px;height:48px;object-fit:cover;border-radius:10px;background:#f3f6fb}
  .ci-title{font:500 13px/1.2 Inter,sans-serif;color:#0b1f3a;margin-bottom:4px}
  .ci-meta{font:500 12px/1 Inter,sans-serif;color:#475569}
  .ci-qty{display:flex;align-items:center;gap:6px}
  .ci-qty .qtybox input{width:36px;padding:6px 0}
  .ci-actions{display:flex;align-items:center;gap:6px}
  .cart-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-top:1px solid #e9eef6;background:#fbfdff}
  .cart-total{font:700 14px/1 Inter,sans-serif;color:#0b1f3a}
  .cart-empty{padding:12px 14px;font:500 13px/1.2 Inter,sans-serif;color:#475569}
  .btn-checkout{display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;border:1px solid #188ae2;background:#188ae2;color:#fff;text-decoration:none}
  @media (max-width: 640px){
    .cart-item{grid-template-columns:40px 1fr auto}
    .cart-body{max-height:42vh}
  }
  `;
  const tag = document.createElement('style');
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ===================================
   Helpers de Produtos / Estoque
=================================== */
let __ALL_PRODUCTS = [];
let __ALL_SHOWCASE = [];

function findProductById(id) {
  if (!id) return null;
  return (__ALL_PRODUCTS.find(p => (p.id ?? '') === id) ||
          __ALL_SHOWCASE.find(p => (p.id ?? '') === id)) || null;
}
function getStockFor(id) {
  const p = findProductById(id);
  return (p && typeof p.stock === 'number') ? p.stock : Infinity;
}
function getPriceFor(id) {
  const p = findProductById(id);
  return (p && typeof p.price === 'number') ? p.price : 0;
}
function getCoverFor(id) {
  const p = findProductById(id);
  const src = p?.image || (Array.isArray(p?.images) ? p.images[0] : '');
  return normalizeImageSrc(src || '');
}
function getTitleFor(id) {
  const p = findProductById(id);
  return p?.title || 'Item';
}

/* ===================================
   Operações de Carrinho (com limite)
=================================== */
function addOne(id) {
  if (!id) return false;
  const stock = getStockFor(id);
  const cur = cartMap[id] || 0;
  if (cur >= stock) { showBanner('quantidade máxima em estoque atingida'); return false; }
  cartMap[id] = cur + 1;
  saveCartMap(cartMap);
  syncUiAfterCartChange([id]);
  return true;
}
function subOne(id) {
  if (!id || !cartMap[id]) return;
  cartMap[id] = Math.max(0, cartMap[id] - 1);
  if (cartMap[id] === 0) delete cartMap[id];
  saveCartMap(cartMap);
  syncUiAfterCartChange([id]);
}
function removeAll(id) {
  if (!id) return;
  if (cartMap[id]) delete cartMap[id];
  saveCartMap(cartMap);
  syncUiAfterCartChange([id]);
}
function setQty(id, qty) {
  const stock = getStockFor(id);
  let q = Math.max(0, Math.min(stock, Number(qty) || 0));
  if (q === 0) delete cartMap[id];
  else cartMap[id] = q;
  saveCartMap(cartMap);
  syncUiAfterCartChange([id]);
}
function cartTotal() {
  let total = 0;
  Object.keys(cartMap).forEach(id => { total += (getPriceFor(id) * cartMap[id]); });
  return total;
}
function cartCount() {
  let n = 0;
  Object.values(cartMap).forEach(q => { n += q; });
  return n;
}

/* ===================================
   UI: Painel de Carrinho (rodapé)
=================================== */
const DISABLE_CART_PANEL = (window.IS_CHECKOUT === true) || /\/checkout\.(?:html?|php)(?:\?|$)/i.test(location.pathname);
let __CART_ROOT = null;

function ensureCartRoot() {
  if (typeof DISABLE_CART_PANEL !== 'undefined' && DISABLE_CART_PANEL) return;
  if (__CART_ROOT) return;
  __CART_ROOT = document.createElement('div');
  __CART_ROOT.className = 'cart-panel';
  document.body.appendChild(__CART_ROOT);
}

function renderCartPanel() {
  if (typeof DISABLE_CART_PANEL !== 'undefined' && DISABLE_CART_PANEL) return;
  ensureCartRoot();
  const ids = Object.keys(cartMap);
  if (!ids.length) {
    __CART_ROOT.innerHTML = '';
    return;
  }
  const itemsHtml = ids.map(id => {
    const title = escapeHtml(getTitleFor(id));
    const img = getCoverFor(id);
    const qty = cartMap[id] || 0;
    const price = getPriceFor(id);
    const subtotal = BRL.format(price * qty);
    return `
      <div class="cart-item" data-id="${id}">
        <img src="${img || ''}" alt="">
        <div>
          <div class="ci-title">${title}</div>
          <div class="ci-meta">${BRL.format(price)} &middot; Subtotal: ${subtotal}</div>
        </div>
        <div class="ci-actions">
          <div class="qtybox">
            <button class="ci-sub" aria-label="Diminuir">−</button>
            <input class="ci-input" type="number" min="0" step="1" value="${qty}">
            <button class="ci-add" aria-label="Aumentar">+</button>
          </div>
          <button class="btn muted ci-rem">Remover</button>
        </div>
      </div>
    `;
  }).join('');

  __CART_ROOT.innerHTML = `
    <div class="cart-card">
      <div class="cart-head">
        <h3>Seu Carrinho (${cartCount()} itens)</h3>
        <button class="btn muted" id="cart-clear">Limpar</button>
      </div>
      <div class="cart-body">
        ${itemsHtml || '<div class="cart-empty">Nenhum item adicionado.</div>'}
      </div>
      <div class="cart-foot">
        <div class="cart-total">Total: ${BRL.format(cartTotal())}</div>
        <a class="btn-checkout" href="/checkout.html">Checkout</a>
      </div>
    </div>
  `;

  __CART_ROOT.querySelectorAll('.cart-item').forEach(row => {
    const id = row.getAttribute('data-id');
    row.querySelector('.ci-add')?.addEventListener('click', () => addOne(id));
    row.querySelector('.ci-sub')?.addEventListener('click', () => subOne(id));
    row.querySelector('.ci-rem')?.addEventListener('click', () => removeAll(id));
    const input = row.querySelector('.ci-input');
    input?.addEventListener('change', () => setQty(id, input.value));
  });

  __CART_ROOT.querySelector('#cart-clear')?.addEventListener('click', () => {
    cartMap = {};
    saveCartMap(cartMap);
    syncUiAfterCartChange();
  });
}

/* ===================================
   UI: Sincronização de botões (grid e modal)
=================================== */
function updateBuyButton(btn, id) {
  if (!btn || !id) return;
  const q = cartMap[id] || 0;
  if (q > 0) {
    btn.classList.remove('primary');
    btn.classList.add('success');
    btn.innerHTML = `Adicionar (${q})`;
  } else {
    btn.classList.remove('success');
    btn.classList.add('primary');
    btn.innerHTML = `<i class="fa-solid fa-cart-plus"></i> Adicionar`;
  }
}
function updateAllGridButtonsFor(id) {
  document.querySelectorAll(`.product[data-id="${id}"] .actions .buy`).forEach(btn => updateBuyButton(btn, id));
}
function updateModalControls(root, id) {
  if (!root) return;
  const addBtn = root.querySelector('.pe-add');
  const input = root.querySelector('.pe-qty-input');
  const q = cartMap[id] || 0;

  updateBuyButton(addBtn, id);
  if (addBtn) {
    if (q > 0) {
      addBtn.classList.remove('primary');
      addBtn.classList.add('success');
      addBtn.innerHTML = `<i class="fa-solid fa-check"></i> Adicionar`;
    } else {
      addBtn.classList.remove('success');
      addBtn.classList.add('primary');
      addBtn.innerHTML = `<i class="fa-solid fa-cart-plus"></i> Adicionar`;
    }
  }
  if (input) input.value = q;
}

/* ===================================
   Modal (template + controle)
=================================== */
function modalTemplate(p, images) {
  const priceStr = p?.currency === 'BRL' ? BRL.format(+p?.price || 0) : (p?.price ?? '');
  const title = p?.title || 'Produto';
  const brand = p?.brand || '';
  const stock = (typeof p?.stock === 'number') ? p.stock : null;
  const id = p?.id ?? '';
  const sku = p?.sku ?? '';
  const description = (p?.description || '').toString();

  return `
  <div class="pe-modal-overlay" role="dialog" aria-modal="true" aria-label="${title}">
    <div class="pe-modal">
      <button class="pe-close" aria-label="Fechar modal">&times;</button>
      <div class="pe-modal-grid">
        <div class="pe-gallery">
          <div class="pe-viewport">
            <div class="pe-track">
              ${images.map((src, i) => `
                <div class="pe-slide${src ? '' : ' noimg'}">
                  ${src ? `<img src="${normalizeImageSrc(src)}" alt="${title} - ${i+1}" onerror="this.closest('.pe-slide').classList.add('noimg');this.style.display='none'">` : ''}
                </div>
              `).join('')}
            </div>
            <button class="pe-nav pe-prev" aria-label="Anterior">&#10094;</button>
            <button class="pe-nav pe-next" aria-label="Próximo">&#10095;</button>
          </div>
          <div class="pe-dots" role="tablist" aria-label="Navegação de imagens"></div>
        </div>

        <div class="pe-details" data-id="${id}">
          <h1 class="pe-title">${title}</h1>
          ${sku ? `<p class="pe-sub">SKU: <span class="pe-code">${sku}</span></p>` : (id ? `<p class="pe-sub">ID: <span class="pe-code">${id}</span></p>` : '')}
          ${priceStr ? `<p class="pe-price">${priceStr}</p>` : ''}

          <dl class="pe-dl">
            ${brand ? `<div class="pe-row"><dt>Marca:</dt><dd>${brand}</dd></div>` : ''}
            ${stock !== null ? `<div class="pe-row"><dt>Estoque:</dt><dd>${stock > 0 ? `${stock} un.` : 'Indisponível'}</dd></div>` : ''}
          </dl>

          ${description ? `<div class="pe-desc"><h2>Descrição</h2><p>${escapeHtml(description).replace(/\\n/g, '<br>')}</p></div>` : ''}

          <div class="pe-actions">
            <div class="qtybox">
              <button class="pe-sub" aria-label="Diminuir">−</button>
              <input class="pe-qty-input" type="number" min="0" step="1" value="0">
              <button class="pe-add1" aria-label="Aumentar">+</button>
            </div>
            <button class="btn primary pe-add">Adicionar</button>
            <button class="btn muted pe-remall">Remover item do Carrinho</button>
            <button class="btn muted pe-close-inline">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

function openProductModal(p) {
  ensureModalRoot();
  injectGlobalStylesOnce();

  const images = buildImagesArray(p);
  __MODAL_ROOT.innerHTML = modalTemplate(p, images);
  
  __MODAL_ROOT.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.pe-sub'))   { subOne(id); return; }
    if (t.closest('.pe-remall')){ removeAll(id); return; }
    if (t.closest('.pe-close') || t.closest('.pe-close-inline')) { close(); return; }
  });

  const overlay = __MODAL_ROOT.querySelector('.pe-modal-overlay');
  const btnClose = __MODAL_ROOT.querySelector('.pe-close');
  const details = __MODAL_ROOT.querySelector('.pe-details');
  const id = details?.getAttribute('data-id') || p?.id || '';

  const track = __MODAL_ROOT.querySelector('.pe-track');
  const dotsWrap = __MODAL_ROOT.querySelector('.pe-dots');
  const prev = __MODAL_ROOT.querySelector('.pe-prev');
  const next = __MODAL_ROOT.querySelector('.pe-next');
  let index = 0;
  const total = images.length;
  function updateCarousel() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dotsWrap.querySelectorAll('button').forEach((b, i) =>
      b.setAttribute('aria-current', i === index ? 'true' : 'false'));
  }
  function go(i) { index = (i + total) % total; updateCarousel(); }
  dotsWrap.innerHTML = images.map((_, i) => `<button aria-label="Ir para imagem ${i + 1}"></button>`).join('');
  dotsWrap.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => go(i)));
  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  const viewport = __MODAL_ROOT.querySelector('.pe-viewport');
  let sx = 0, dx = 0;
  viewport.addEventListener('touchstart', e => { sx = e.touches[0].clientX; dx = 0; }, { passive: true });
  viewport.addEventListener('touchmove', e => { dx = e.touches[0].clientX - sx; }, { passive: true });
  viewport.addEventListener('touchend', () => { if (Math.abs(dx) > 40) { dx < 0 ? go(index + 1) : go(index - 1); } });

  const btnAdd = __MODAL_ROOT.querySelector('.pe-add');
  const btnAdd1 = __MODAL_ROOT.querySelector('.pe-add1');
  const btnSub1 = __MODAL_ROOT.querySelector('.pe-sub');
  const btnRemAll = __MODAL_ROOT.querySelector('.pe-remall');
  const input = __MODAL_ROOT.querySelector('.pe-qty-input');
  input.addEventListener('change', () => setQty(id, input.value));

  btnAdd.addEventListener('click', () => addOne(id));
  btnAdd1.addEventListener('click', () => addOne(id));
  btnSub1.addEventListener('click', () => subOne(id));
  btnRemAll.addEventListener('click', () => removeAll(id));
  input.addEventListener('change', () => setQty(id, input.value));

  function close() {
    lockBodyScroll(false);
    if (overlay && overlay.parentNode) overlay.parentNode.innerHTML = '';
  }
  btnClose.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function onEsc(ev) {
    if (ev.key === 'Escape') { document.removeEventListener('keydown', onEsc); close(); }
  });

  lockBodyScroll(true);
  setTimeout(() => btnClose?.focus?.(), 0);
  updateCarousel();
  updateModalControls(__MODAL_ROOT, id);
}

/* ===================================
   Grid de produtos (cards)
=================================== */
function productCard(p) {
  const id = p?.id ?? '';
  const title = p?.title ?? 'Produto';
  const brand = p?.brand ?? '';
  const price = typeof p?.price === 'number' ? p.price : 0;
  const currency = p?.currency ?? 'BRL';
  const stock = typeof p?.stock === 'number' ? p.stock : 0;
  const image = p?.image ?? '';
  const url = p?.url ?? '#';
  const imgSrc = normalizeImageSrc(image);
  const priceStr = currency === 'BRL' ? BRL.format(price) : `${price}`;

  return `
    <article class="product" data-id="${id}">
      <div class="media" role="button" tabindex="0" aria-label="Abrir ${title}">
        ${imgSrc ? `<img src="${imgSrc}" alt="${title}" onerror="handleImgError(this)">` : `<img src="" alt="" onerror="handleImgError(this)" />`}
      </div>
      <div class="info">
        <h3>${title}</h3>
        <div class="brand-stock">
          ${brand ? `<small class="brand">${brand}</small>` : ''}
          ${stock > 0 ? `<small class="stock">Em estoque: ${stock} un.</small>` : `<small class="stock oos">Sem estoque</small>`}
        </div>
        <div class="price">${priceStr}</div>
        <div class="actions">
          <a class="btn see" href="${url}" aria-label="Ver detalhes de ${title}"><i class="fa-solid fa-eye"></i>Detalhes</a>
          <button class="btn primary buy" type="button" aria-label="Adicionar ${title}"><i class="fa-solid fa-cart-plus"></i> Adicionar</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(items, container) {
  if (!Array.isArray(items) || !container) return;
  container.innerHTML = items.map(productCard).join('');

  container.querySelectorAll('button.buy').forEach(btn => {
    const card = btn.closest('.product');
    const id = card?.dataset?.id;
    updateBuyButton(btn, id);
    btn.addEventListener('click', () => addOne(id));
  });

  function findProductFromTarget(target) {
    const card = target.closest('.product');
    if (!card) return null;
    const id = card.dataset.id;
    return __ALL_PRODUCTS.find(p => (p.id ?? '') === id) || null;
  }

  container.querySelectorAll('.product .media, .product .actions .see').forEach(el => {
    const isLink = el.tagName === 'A';
    if (isLink) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const p = findProductFromTarget(e.currentTarget);
        if (p) openProductModal(p);
      });
    } else {
      el.addEventListener('click', (e) => {
        const p = findProductFromTarget(e.currentTarget);
        if (p) openProductModal(p);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const p = findProductFromTarget(e.currentTarget);
          if (p) openProductModal(p);
        }
      });
    }
  });
}

/* ===================================
   Vitrine (carrossel)
=================================== */
function slideTemplate(item) {
  const priceStr = item?.currency === 'BRL' ? BRL.format(+item?.price || 0) : `${item?.price ?? ''}`;
  const raw = item?.image || '';
  const imgSrc = normalizeImageSrc(raw);
  const alt = item?.title || 'Vitrine';
  const title = item?.title || '';
  const idAttr = item?.id ? ` data-id="${item.id}"` : '';

  return `
    <div class="slide${imgSrc ? '' : ' noimg'}" role="button" tabindex="0" aria-label="Abrir ${title}"${idAttr}>
      ${imgSrc ? `<img src="${imgSrc}" alt="${alt}" onerror="this.closest('.slide').classList.add('noimg'); this.style.display='none'">` : ''}
      <span class="badge-price"><span class="bp-title">${title}</span> ${priceStr}</span>
    </div>
  `;
}

function initShowcaseCarousel(items) {
  const track = document.getElementById('showcaseTrack');
  if (!track || !Array.isArray(items) || items.length === 0) return;

  track.innerHTML = items.map(slideTemplate).join('');

  let index = 0;
  const total = items.length;
  function stepTo(i) {
    index = (i + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  const prev = document.getElementById('showcasePrev');
  const next = document.getElementById('showcaseNext');
  prev?.addEventListener('click', () => stepTo(index - 1));
  next?.addEventListener('click', () => stepTo(index + 1));

  let timer = setInterval(() => stepTo(index + 1), 2000);
  const pause = () => { clearInterval(timer); };
  const resume = () => { clearInterval(timer); timer = setInterval(() => stepTo(index + 1), 2000); };
  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', resume);
  prev?.addEventListener('mouseenter', pause);
  next?.addEventListener('mouseenter', pause);
  prev?.addEventListener('mouseleave', resume);
  next?.addEventListener('mouseleave', resume);

  function findShowcaseItemFromEl(el) {
    const id = el.getAttribute('data-id');
    if (id) return __ALL_SHOWCASE.find(s => (s.id ?? '') === id) || null;
    const tt = el.querySelector('.bp-title')?.textContent?.trim();
    if (!tt) return null;
    return __ALL_SHOWCASE.find(s => (s.title ?? '').trim() === tt) || null;
  }
  track.querySelectorAll('.slide').forEach(slide => {
    slide.addEventListener('click', () => {
      const p = findShowcaseItemFromEl(slide);
      if (p) openProductModal(p);
    });
    slide.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const p = findShowcaseItemFromEl(slide);
        if (p) openProductModal(p);
      }
    });
  });

  stepTo(0);
}

/* ===================================
   Sync global após alterações
=================================== */
function syncUiAfterCartChange(idsToRefresh) {
  if (Array.isArray(idsToRefresh)) idsToRefresh.forEach(updateAllGridButtonsFor);
  else {
    document.querySelectorAll('.product').forEach(card => {
      const id = card.getAttribute('data-id');
      updateAllGridButtonsFor(id);
    });
  }
  const details = document.querySelector('#product-modal-root .pe-details');
  if (details) {
    const id = details.getAttribute('data-id');
    updateModalControls(document.getElementById('product-modal-root'), id);
  }
  renderCartPanel();
}

/* ===================================
   Bootstrap da loja
=================================== */
async function initShop() {
  injectGlobalStylesOnce();

  const productsGrid = document.getElementById('productsGrid') || document.querySelector('.featured .grid');
  if (productsGrid) {
    __ALL_PRODUCTS = await fetchJsonArray('https://checkout.easyreg.com.br/products.php');
    if (__ALL_PRODUCTS.length) renderProducts(__ALL_PRODUCTS, productsGrid);
  }

  const showcaseEl = document.getElementById('showcaseTrack');
  if (showcaseEl) {
    __ALL_SHOWCASE = await fetchJsonArray('https://checkout.easyreg.com.br/showcase.php');
    if (__ALL_SHOWCASE.length) initShowcaseCarousel(__ALL_SHOWCASE);
  }

  renderCartPanel();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initShop);
else initShop();

window.handleImgError = handleImgError;
