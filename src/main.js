import productsData from './products.json';
import {
  formatPrice,
  buildWhatsAppUrl,
  filterProducts,
  escapeHtml,
  isSizeSelected,
  getProductImages,
  normalizeProduct,
  MEASUREMENT_CONFIG,
  convertMeasurement,
  validateMeasurement,
  validateMeasurementsStep,
  buildMeasurementsMessage,
  buildWhatsAppMeasurementsUrl
} from './utils.js';
import { fetchStorefrontProducts } from './supabase.js';
import { initAdmin } from './admin.js';

export { getProductImages };

// SVG Icons (clean, high-legibility strokes)
const ICONS = {
  menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  close: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  arrowRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  tape: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="2"></rect><line x1="6" y1="7" x2="6" y2="11"></line><line x1="10" y1="7" x2="10" y2="11"></line><line x1="14" y1="7" x2="14" y2="11"></line><line x1="18" y1="7" x2="18" y2="11"></line></svg>`,
  edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  clear: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  heartOutline: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  heartFilled: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  shop: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
  whatsapp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.782-.879-2.057-.98-.276-.1-.477-.15-.678.15-.201.301-.778.98-.954 1.18-.176.2-.352.226-.653.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.785-1.676-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.1-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.237-.245-.588-.493-.508-.678-.518l-.578-.01c-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.124 3.244 5.146 4.549.719.31 1.28.496 1.718.636.722.229 1.378.197 1.898.119.579-.088 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zm-5.467 7.426h-.005a9.882 9.882 0 0 1-5.034-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 0 1-1.514-5.26c0-5.46 4.444-9.904 9.909-9.904 2.646 0 5.132 1.031 7.001 2.903a9.839 9.839 0 0 1 2.899 7.003c-.002 5.462-4.447 9.906-9.914 9.906zM20.52 3.484C18.257 1.22 15.245 0 12.005 0 5.44 0 .092 5.347.09 11.913a11.85 11.85 0 0 0 1.815 6.275L0 24l5.986-1.57a11.89 11.89 0 0 0 5.998 1.62h.005c6.564 0 11.913-5.348 11.915-11.915 0-3.182-1.24-6.195-3.384-8.651z"/></svg>`
};

const CATEGORIES = ['All', 'Kaftans', 'Agbada', 'Senator', 'Accessories'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Custom'];
const WHATSAPP_PHONE = '2347065086445';
const STORAGE_KEY_MEASUREMENTS = 'apparel_saved_measurements';

function getInitialWishlist() {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('apparel_wishlist') || '[]');
  } catch {
    return [];
  }
}

function getSavedMeasurements() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEASUREMENTS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSavedMeasurements(data) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MEASUREMENTS, JSON.stringify(data));
  } catch {}
}

// App State
const state = {
  products: productsData.map(normalizeProduct),
  currentCategory: 'All',
  searchQuery: '',
  isMenuOpen: false,
  wishlist: new Set(getInitialWishlist()),
  detail: {
    productId: null,
    selectedImageIndex: 0,
    selectedSize: null,
    sizeError: false
  },
  measure: {
    productId: null,
    size: 'Custom',
    step: 1, // 1: Upper body, 2: Lower body, 3: Fit & details, 4: Review
    unit: 'in', // 'in' or 'cm'
    measurements: {
      chest: '',
      shoulder: '',
      sleeve: '',
      neck: '',
      waist: '',
      hip: '',
      trouserLength: '',
      kaftanLength: '',
      height: ''
    },
    fitPreference: 'Regular',
    notes: '',
    clientName: '',
    clientPhone: '',
    skippedMeasurements: false,
    errors: {}
  }
};

// Asynchronously fetch live products from Supabase (with automatic fallback to bundled JSON)
if (typeof window !== 'undefined') {
  fetchStorefrontProducts().then((fetched) => {
    if (fetched && fetched.length > 0) {
      state.products = fetched;
      const hash = window.location.hash || '';
      if (!hash.startsWith('#/admin') && !hash.startsWith('#admin')) {
        render();
      }
    }
  });
}

function saveWishlist() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('apparel_wishlist', JSON.stringify([...state.wishlist]));
}

function toggleWishlist(productId) {
  if (state.wishlist.has(productId)) {
    state.wishlist.delete(productId);
  } else {
    state.wishlist.add(productId);
  }
  saveWishlist();
  updateWishlistUI();
}

function updateWishlistUI() {
  document.querySelectorAll('[data-wishlist-id]').forEach((btn) => {
    const id = btn.dataset.wishlistId;
    const isSaved = state.wishlist.has(id);
    btn.innerHTML = isSaved ? ICONS.heartFilled : ICONS.heartOutline;
    btn.setAttribute('aria-label', isSaved ? 'Remove from wishlist' : 'Add to wishlist');
    btn.classList.toggle('active', isSaved);
  });
}

// -----------------------------------------------------------------------------
// VIEWS
// -----------------------------------------------------------------------------

function renderDrawer() {
  return `
    <div class="drawer-backdrop ${state.isMenuOpen ? 'open' : ''}" id="drawer-backdrop" role="dialog" aria-modal="true" aria-label="Store navigation menu">
      <div class="drawer-panel">
        <div class="drawer-header">
          <span class="drawer-brand">APPAREL BY EZEKIEL</span>
          <button class="icon-button" id="close-menu-btn" aria-label="Close navigation menu">
            ${ICONS.close}
          </button>
        </div>
        <nav class="drawer-nav" aria-label="Drawer Categories">
          ${CATEGORIES.map(
            (cat) => `
            <a href="#shop" class="drawer-link ${state.currentCategory === cat ? 'active' : ''}" data-category-select="${escapeHtml(cat)}">
              ${escapeHtml(cat)}
            </a>
          `
          ).join('')}
        </nav>
        <div class="drawer-footer">
          <p class="drawer-footer-text">
            <strong>Apparel by Ezekiel</strong><br />
            Modern bespoke Nigerian tailoring & luxury ready-to-wear garments. Lagos & worldwide delivery.
          </p>
          <div style="margin-top: 14px;">
            <a
              href="${escapeHtml(
                buildWhatsAppUrl(WHATSAPP_PHONE, {
                  product: 'bespoke tailoring inquiry'
                })
              )}"
              target="_blank"
              rel="noopener noreferrer"
              class="drawer-whatsapp-btn"
            >
              ${ICONS.whatsapp}
              <span>Chat on WhatsApp</span>
            </a>
          </div>
          <div class="drawer-admin-row">
            <a href="#/admin" class="drawer-admin-link">Owner Login</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProductCards(products) {
  return products
    .map((product) => {
      const isSaved = state.wishlist.has(product.id);
      const productImages = getProductImages(product);
      const firstImage = productImages[0] || '';
      return `
        <article class="product-card" data-product-id="${escapeHtml(product.id)}">
          <div class="product-image-container">
            <a href="#product/${escapeHtml(product.id)}" class="product-image-link" aria-label="View details for ${escapeHtml(product.name)}">
              <img
                src="${escapeHtml(firstImage)}"
                alt="${escapeHtml(product.name)}"
                class="product-image"
                loading="lazy"
              />
            </a>
            <button
              type="button"
              class="wishlist-btn ${isSaved ? 'active' : ''}"
              data-wishlist-id="${escapeHtml(product.id)}"
              aria-label="${isSaved ? 'Remove from wishlist' : 'Add to wishlist'}"
            >
              ${isSaved ? ICONS.heartFilled : ICONS.heartOutline}
            </button>
          </div>
          <div class="product-info">
            <span class="product-category">${escapeHtml(product.category)}</span>
            <h2 class="product-title">
              <a href="#product/${escapeHtml(product.id)}" class="product-title-link">
                ${escapeHtml(product.name)}
              </a>
            </h2>
            <div class="product-price-row">
              <span class="product-price">${escapeHtml(formatPrice(product.price))}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderHome() {
  const filtered = filterProducts(state.products, {
    category: state.currentCategory,
    search: state.searchQuery
  });

  return `
    ${renderDrawer()}

    <!-- Top Bar: APPAREL BY EZEKIEL wordmark and menu icon -->
    <header class="top-bar">
      <div class="top-bar-inner">
        <button class="icon-button" id="open-menu-btn" aria-label="Open navigation menu">
          ${ICONS.menu}
        </button>
        <a href="#shop" class="top-bar-brand">APPAREL BY EZEKIEL</a>
        <div class="top-bar-spacer" aria-hidden="true"></div>
      </div>
    </header>

    <main class="page-container" id="main-content">
      <!-- Search Input Section -->
      <section class="search-section" aria-label="Search garments">
        <div class="search-input-wrapper">
          <span class="search-icon-left">${ICONS.search}</span>
          <input
            type="search"
            class="search-input"
            id="product-search-input"
            placeholder="Search kaftans, agbada, senator..."
            value="${escapeHtml(state.searchQuery)}"
            aria-label="Search kaftans, agbada, senator garments"
            autocomplete="off"
          />
          ${
            state.searchQuery
              ? `<button type="button" class="search-clear-btn" id="clear-search-btn" aria-label="Clear search input">${ICONS.clear}</button>`
              : ''
          }
        </div>
      </section>

      <!-- Category Chips: horizontal-scroll, active chip black with white text -->
      <nav class="categories-section" aria-label="Product categories">
        <ul class="categories-list">
          ${CATEGORIES.map(
            (cat) => `
            <li>
              <button
                type="button"
                class="category-chip ${state.currentCategory === cat ? 'active' : ''}"
                data-category="${escapeHtml(cat)}"
                aria-pressed="${state.currentCategory === cat}"
              >
                ${escapeHtml(cat)}
              </button>
            </li>
          `
          ).join('')}
        </ul>
      </nav>

      <!-- Product Grid Section: New Arrivals heading and 2-column grid -->
      <section class="products-section" aria-label="Catalog">
        <div class="section-header">
          <h1 class="section-title">New Arrivals</h1>
          <span class="section-count">${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}</span>
        </div>

        ${
          filtered.length === 0
            ? `
          <div class="empty-state">
            <h3>No garments found</h3>
            <p>We couldn't find any piece matching "${escapeHtml(
              state.searchQuery || state.currentCategory
            )}".</p>
            <button type="button" class="btn-primary" id="reset-filters-btn">View All Collections</button>
          </div>
        `
            : `
          <div class="product-grid" id="product-grid">
            ${renderProductCards(filtered)}
          </div>
        `
        }
      </section>

      <!-- Storefront Footer with Owner Login -->
      <footer class="store-footer">
        <div class="store-footer-inner">
          <p class="store-footer-copy">© 2026 Apparel by Ezekiel. Handcrafted luxury in Lagos, Nigeria.</p>
          <a href="#/admin" class="store-footer-admin-link">Owner Login</a>
        </div>
      </footer>
    </main>

    <!-- Bottom Navigation: just Home and Shop -->
    <nav class="bottom-nav" aria-label="Bottom Navigation">
      <div class="bottom-nav-inner">
        <a href="#shop" class="bottom-nav-item active" id="nav-item-home" aria-current="page">
          ${ICONS.home}
          <span>Home</span>
        </a>
        <a href="#shop" class="bottom-nav-item" id="nav-item-shop">
          ${ICONS.shop}
          <span>Shop</span>
        </a>
      </div>
    </nav>
  `;
}

function renderNotFound() {
  return `
    <!-- Top Bar -->
    <header class="detail-top-bar">
      <div class="detail-top-bar-inner">
        <a href="#shop" class="icon-button" id="not-found-back-top-btn" aria-label="Back to store">
          ${ICONS.back}
        </a>
        <span class="detail-top-bar-brand">APPAREL BY EZEKIEL</span>
        <div class="top-bar-spacer" aria-hidden="true"></div>
      </div>
    </header>

    <main class="page-container not-found-page" id="main-content">
      <div class="not-found-card">
        <span class="not-found-badge">Collection Item</span>
        <h1 class="not-found-title">Garment Not Found</h1>
        <p class="not-found-text">
          We couldn't locate this piece in our active catalog. It may have been archived or is part of a bespoke archive.
        </p>
        <a href="#shop" class="btn-primary" id="not-found-back-btn">Back to Collection</a>
      </div>
    </main>
  `;
}

function renderDetail(product) {
  const isSaved = state.wishlist.has(product.id);
  const images = getProductImages(product);
  const selectedIdx = Math.min(
    state.detail.selectedImageIndex,
    Math.max(0, images.length - 1)
  );
  const activeImage = images[selectedIdx] || '';

  // Related products from the same category
  const relatedProducts = state.products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return `
    <!-- Top Bar: Back button, brand/details title, heart toggle -->
    <header class="detail-top-bar">
      <div class="detail-top-bar-inner">
        <a href="#shop" class="icon-button" id="detail-back-btn" aria-label="Back to store">
          ${ICONS.back}
        </a>
        <span class="detail-top-bar-title">Details</span>
        <button
          type="button"
          class="icon-button detail-wishlist-btn ${isSaved ? 'active' : ''}"
          data-wishlist-id="${escapeHtml(product.id)}"
          aria-label="${isSaved ? 'Remove from wishlist' : 'Add to wishlist'}"
        >
          ${isSaved ? ICONS.heartFilled : ICONS.heartOutline}
        </button>
      </div>
    </header>

    <main class="page-container detail-page-container" id="main-content">
      <div class="detail-layout">
        <!-- Left: Image Gallery (Main photo + thumbnails) -->
        <section class="detail-gallery" aria-label="Garment image gallery">
          <div class="detail-main-image-card">
            <img
              id="detail-main-image"
              src="${escapeHtml(activeImage)}"
              alt="${escapeHtml(product.name)} - view ${selectedIdx + 1}"
              class="detail-main-image"
            />
          </div>

          ${
            images.length > 1
              ? `
            <div class="detail-thumbnails-row" role="region" aria-label="Garment photo thumbnails">
              ${images
                .map(
                  (img, idx) => `
                <button
                  type="button"
                  class="detail-thumb-btn ${selectedIdx === idx ? 'active' : ''}"
                  data-thumb-index="${idx}"
                  aria-label="View photo ${idx + 1} of ${images.length}"
                  aria-pressed="${selectedIdx === idx}"
                >
                  <img src="${escapeHtml(img)}" alt="" class="detail-thumb-img" loading="lazy" />
                </button>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
        </section>

        <!-- Right: Info, Sizes, CTA, Craftsmanship -->
        <section class="detail-content" aria-label="Garment details and ordering">
          <div class="detail-header-row">
            <div class="detail-header-left">
              <span class="detail-category">${escapeHtml(product.category)}</span>
              <h1 class="detail-title">${escapeHtml(product.name)}</h1>
            </div>
            <div class="detail-header-right">
              <span class="detail-price">${escapeHtml(formatPrice(product.price))}</span>
            </div>
          </div>

          <!-- Size Selector Row (Placed above description for immediate mobile visibility) -->
          <div class="detail-size-section" id="detail-size-section">
            <div class="detail-size-header">
              <h2 class="detail-subsection-title">Select Size</h2>
              <span class="detail-size-note-hint">Standard & Bespoke Fit</span>
            </div>

            <div class="size-pill-group" role="radiogroup" aria-label="Select garment size">
              ${SIZES.map(
                (sz) => `
                <button
                  type="button"
                  class="size-pill ${state.detail.selectedSize === sz ? 'active' : ''}"
                  data-size="${escapeHtml(sz)}"
                  aria-pressed="${state.detail.selectedSize === sz}"
                  role="radio"
                  aria-checked="${state.detail.selectedSize === sz}"
                >
                  ${escapeHtml(sz)}
                </button>
              `
              ).join('')}
            </div>

            <!-- Custom Size One-Line Note -->
            <div
              class="custom-size-note"
              id="custom-size-note"
              ${state.detail.selectedSize === 'Custom' ? '' : 'hidden'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>We'll take your measurements on WhatsApp</span>
            </div>

            <!-- Size Required Inline Error Prompt -->
            <div
              class="size-error-message"
              id="size-error-message"
              role="alert"
              ${state.detail.sizeError ? '' : 'hidden'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Please select a size to proceed with your order</span>
            </div>
          </div>

          <!-- Desktop Inline CTA Button -->
          <div class="detail-desktop-cta">
            <button
              type="button"
              class="order-whatsapp-btn"
              id="desktop-order-btn"
              aria-label="Continue to measurements for ${escapeHtml(product.name)}"
            >
              <span>Continue</span>
              ${ICONS.arrowRight}
            </button>
            <p class="cta-guarantee-note">Direct concierge with Master Tailor Ezekiel • Fast delivery in Nigeria & abroad</p>
          </div>

          <p class="detail-description">${escapeHtml(product.description)}</p>

          ${
            product.details
              ? `
            <div class="detail-craftsmanship-card">
              <h2 class="detail-subsection-title">Craftsmanship & Fabric</h2>
              <p class="detail-craftsmanship-text">${escapeHtml(product.details)}</p>
            </div>
          `
              : ''
          }
        </section>
      </div>

      <!-- You May Also Like Section -->
      ${
        relatedProducts.length > 0
          ? `
        <section class="related-section" aria-label="You may also like">
          <div class="section-header">
            <h2 class="section-title">You May Also Like</h2>
            <span class="section-count">${relatedProducts.length} ${
              relatedProducts.length === 1 ? 'piece' : 'pieces'
            }</span>
          </div>
          <div class="related-grid">
            ${renderProductCards(relatedProducts)}
          </div>
        </section>
      `
          : ''
      }
    </main>

    <!-- Mobile Sticky Bottom CTA Bar (Only bottom bar on detail page) -->
    <aside class="detail-mobile-cta-bar" aria-label="Order bar">
      <div class="detail-mobile-cta-inner">
        <button
          type="button"
          class="order-whatsapp-btn full-width"
          id="mobile-order-btn"
          aria-label="Continue to measurements for ${escapeHtml(product.name)}"
        >
          <span>Continue</span>
          ${ICONS.arrowRight}
        </button>
      </div>
    </aside>
  `;
}

// -----------------------------------------------------------------------------
// EVENT BINDINGS
// -----------------------------------------------------------------------------

function bindWishlistClicks() {
  document.querySelectorAll('[data-wishlist-id]').forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.wishlistId;
      toggleWishlist(id);
    };
  });
}

function updateGrid() {
  const filtered = filterProducts(state.products, {
    category: state.currentCategory,
    search: state.searchQuery
  });

  const section = document.querySelector('.products-section');
  if (!section) return;

  const countEl = section.querySelector('.section-count');
  if (countEl) {
    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}`;
  }

  let gridContainer = section.querySelector('.product-grid');
  let emptyState = section.querySelector('.empty-state');

  if (filtered.length === 0) {
    if (gridContainer) gridContainer.remove();
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      section.appendChild(emptyState);
    }
    emptyState.innerHTML = `
      <h3>No garments found</h3>
      <p>We couldn't find any piece matching "${escapeHtml(
        state.searchQuery || state.currentCategory
      )}".</p>
      <button type="button" class="btn-primary" id="reset-filters-btn">View All Collections</button>
    `;
    const resetBtn = emptyState.querySelector('#reset-filters-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        state.currentCategory = 'All';
        state.searchQuery = '';
        const searchInput = document.querySelector('#product-search-input');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('[data-category]').forEach((c) => {
          const isActive = c.dataset.category === 'All';
          c.classList.toggle('active', isActive);
          c.setAttribute('aria-pressed', isActive);
        });
        updateGrid();
      };
    }
  } else {
    if (emptyState) emptyState.remove();
    if (!gridContainer) {
      gridContainer = document.createElement('div');
      gridContainer.className = 'product-grid';
      gridContainer.id = 'product-grid';
      section.appendChild(gridContainer);
    }
    gridContainer.innerHTML = renderProductCards(filtered);
    bindWishlistClicks();
  }

  // Update clear button
  const searchWrapper = document.querySelector('.search-input-wrapper');
  let clearBtn = document.querySelector('#clear-search-btn');
  if (state.searchQuery) {
    if (!clearBtn && searchWrapper) {
      clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'search-clear-btn';
      clearBtn.id = 'clear-search-btn';
      clearBtn.setAttribute('aria-label', 'Clear search input');
      clearBtn.innerHTML = ICONS.clear;
      clearBtn.onclick = () => {
        state.searchQuery = '';
        const input = document.querySelector('#product-search-input');
        if (input) input.value = '';
        updateGrid();
        if (clearBtn) clearBtn.remove();
      };
      searchWrapper.appendChild(clearBtn);
    }
  } else if (clearBtn) {
    clearBtn.remove();
  }
}

function bindHomeEvents() {
  // Drawer open / close
  const openMenuBtn = document.querySelector('#open-menu-btn');
  const closeMenuBtn = document.querySelector('#close-menu-btn');
  const drawerBackdrop = document.querySelector('#drawer-backdrop');

  if (openMenuBtn) {
    openMenuBtn.onclick = () => {
      state.isMenuOpen = true;
      const drawer = document.querySelector('#drawer-backdrop');
      if (drawer) drawer.classList.add('open');
    };
  }

  if (closeMenuBtn) {
    closeMenuBtn.onclick = () => {
      state.isMenuOpen = false;
      const drawer = document.querySelector('#drawer-backdrop');
      if (drawer) drawer.classList.remove('open');
    };
  }

  if (drawerBackdrop) {
    drawerBackdrop.onclick = (e) => {
      if (e.target === drawerBackdrop) {
        state.isMenuOpen = false;
        drawerBackdrop.classList.remove('open');
      }
    };
  }

  // Drawer category links
  document.querySelectorAll('[data-category-select]').forEach((link) => {
    link.onclick = (e) => {
      state.currentCategory = e.currentTarget.dataset.categorySelect;
      state.isMenuOpen = false;
      const drawer = document.querySelector('#drawer-backdrop');
      if (drawer) drawer.classList.remove('open');
      document.querySelectorAll('[data-category]').forEach((c) => {
        const isActive = c.dataset.category === state.currentCategory;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-pressed', isActive);
      });
      updateGrid();
    };
  });

  // Search input
  const searchInput = document.querySelector('#product-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      state.searchQuery = e.target.value;
      updateGrid();
    };
  }

  const clearSearchBtn = document.querySelector('#clear-search-btn');
  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      state.searchQuery = '';
      const input = document.querySelector('#product-search-input');
      if (input) input.value = '';
      updateGrid();
      clearSearchBtn.remove();
    };
  }

  // Category chips
  document.querySelectorAll('[data-category]').forEach((chip) => {
    chip.onclick = (e) => {
      state.currentCategory = e.currentTarget.dataset.category;
      document.querySelectorAll('[data-category]').forEach((c) => {
        const isActive = c.dataset.category === state.currentCategory;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-pressed', isActive);
      });
      updateGrid();
    };
  });

  // Reset filters button
  const resetBtn = document.querySelector('#reset-filters-btn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      state.currentCategory = 'All';
      state.searchQuery = '';
      const input = document.querySelector('#product-search-input');
      if (input) input.value = '';
      document.querySelectorAll('[data-category]').forEach((c) => {
        const isActive = c.dataset.category === 'All';
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-pressed', isActive);
      });
      updateGrid();
    };
  }

  // Wishlist clicks
  bindWishlistClicks();

  // Bottom nav
  const navShop = document.querySelector('#nav-item-shop');
  const navHome = document.querySelector('#nav-item-home');

  if (navShop) {
    navShop.onclick = (e) => {
      e.preventDefault();
      const input = document.querySelector('#product-search-input');
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
  }

  if (navHome) {
    navHome.onclick = (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }
}

function selectDetailImage(index, product) {
  const images = getProductImages(product);
  if (index < 0 || index >= images.length) return;
  state.detail.selectedImageIndex = index;

  const mainImg = document.querySelector('#detail-main-image');
  if (mainImg) {
    mainImg.src = images[index];
    mainImg.alt = `${product.name} - view ${index + 1}`;
  }

  document.querySelectorAll('.detail-thumb-btn').forEach((btn) => {
    const btnIdx = Number(btn.dataset.thumbIndex);
    const isActive = btnIdx === index;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function selectSize(sz, product) {
  state.detail.selectedSize = sz;
  state.detail.sizeError = false;
  updateSizeSectionUI();

  if (sz === 'Custom' && product) {
    window.location.hash = `#measure/${product.id}?size=Custom`;
  }
}

function updateSizeSectionUI() {
  document.querySelectorAll('.size-pill').forEach((pill) => {
    const sz = pill.dataset.size;
    const isActive = sz === state.detail.selectedSize;
    pill.classList.toggle('active', isActive);
    pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    pill.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });

  const customNote = document.querySelector('#custom-size-note');
  if (customNote) {
    if (state.detail.selectedSize === 'Custom') {
      customNote.removeAttribute('hidden');
    } else {
      customNote.setAttribute('hidden', '');
    }
  }

  const errorEl = document.querySelector('#size-error-message');
  if (errorEl) {
    if (state.detail.sizeError) {
      errorEl.removeAttribute('hidden');
    } else {
      errorEl.setAttribute('hidden', '');
    }
  }
}

function handleOrderClick(product) {
  if (!isSizeSelected(state.detail.selectedSize)) {
    state.detail.sizeError = true;
    updateSizeSectionUI();
    const errorEl = document.querySelector('#size-error-message');
    if (errorEl) {
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return;
  }

  window.location.hash = `#measure/${product.id}?size=${encodeURIComponent(
    state.detail.selectedSize
  )}`;
}

function bindDetailEvents(product) {
  // Back button in detail top bar
  const backBtn = document.querySelector('#detail-back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      window.location.hash = '#shop';
    };
  }

  // Back button on not-found page
  const notFoundBackBtn = document.querySelector('#not-found-back-btn');
  if (notFoundBackBtn) {
    notFoundBackBtn.onclick = (e) => {
      e.preventDefault();
      window.location.hash = '#shop';
    };
  }
  const notFoundTopBackBtn = document.querySelector('#not-found-back-top-btn');
  if (notFoundTopBackBtn) {
    notFoundTopBackBtn.onclick = (e) => {
      e.preventDefault();
      window.location.hash = '#shop';
    };
  }

  // Wishlist toggle on top bar
  const wishlistBtn = document.querySelector('.detail-wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.onclick = (e) => {
      e.preventDefault();
      toggleWishlist(product.id);
    };
  }

  // Gallery thumbnails
  document.querySelectorAll('.detail-thumb-btn').forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.thumbIndex);
      selectDetailImage(idx, product);
    };
  });

  // Size pills
  document.querySelectorAll('.size-pill').forEach((pill) => {
    pill.onclick = () => {
      const sz = pill.dataset.size;
      selectSize(sz, product);
    };
  });

  // Mobile and desktop WhatsApp order buttons
  const mobileOrderBtn = document.querySelector('#mobile-order-btn');
  if (mobileOrderBtn) {
    mobileOrderBtn.onclick = (e) => {
      e.preventDefault();
      handleOrderClick(product);
    };
  }

  const desktopOrderBtn = document.querySelector('#desktop-order-btn');
  if (desktopOrderBtn) {
    desktopOrderBtn.onclick = (e) => {
      e.preventDefault();
      handleOrderClick(product);
    };
  }

  // Related products wishlist buttons
  bindWishlistClicks();
}

// -----------------------------------------------------------------------------
// SCREEN 3: MEASUREMENTS ONBOARDING
// -----------------------------------------------------------------------------

function initMeasureState(productId, size) {
  const current = state.measure;
  if (current.productId === productId && current.size === size) {
    return;
  }

  const saved = getSavedMeasurements();
  const initialMeasurements = {
    chest: '',
    shoulder: '',
    sleeve: '',
    neck: '',
    waist: '',
    hip: '',
    trouserLength: '',
    kaftanLength: '',
    height: ''
  };

  let hasSavedValues = false;
  if (saved && saved.measurements) {
    Object.keys(initialMeasurements).forEach((k) => {
      if (saved.measurements[k] != null && String(saved.measurements[k]).trim() !== '') {
        initialMeasurements[k] = String(saved.measurements[k]);
        hasSavedValues = true;
      }
    });
  }

  state.measure = {
    productId,
    size: size || 'Custom',
    step: 1,
    unit: (saved && saved.unit) || 'in',
    measurements: initialMeasurements,
    fitPreference: (saved && saved.fitPreference) || 'Regular',
    notes: (saved && saved.notes) || '',
    clientName: (saved && saved.clientName) || '',
    clientPhone: (saved && saved.clientPhone) || '',
    skippedMeasurements: false,
    errors: {},
    hasSaved: Boolean(saved && (hasSavedValues || saved.clientName)),
    savedNotice: hasSavedValues ? 'Loaded from your saved profile' : ''
  };
}

function renderMeasureField(fieldId, unit, isCustom) {
  const cfg = MEASUREMENT_CONFIG[fieldId];
  const value = state.measure.measurements[fieldId] || '';
  const error = state.measure.errors[fieldId] || '';
  const range = cfg.ranges[unit] || cfg.ranges.in;
  const isRequired = isCustom && !cfg.optional;
  const placeholder =
    (cfg.placeholders && cfg.placeholders[unit]) || (unit === 'in' ? '34' : '86');

  return `
    <div class="measure-field-group" data-field-group="${fieldId}">
      <div class="measure-label-row">
        <label for="measure-${fieldId}" class="measure-label">
          ${escapeHtml(cfg.label)}
          ${isRequired ? '<span class="required-badge" aria-label="required" title="Required for bespoke fit">*</span>' : '<span class="optional-tag">Optional</span>'}
        </label>
      </div>
      <div class="measure-input-wrapper">
        <input
          type="text"
          inputmode="decimal"
          id="measure-${fieldId}"
          name="${fieldId}"
          class="measure-input ${error ? 'input-error' : ''}"
          placeholder="e.g. ${placeholder}"
          value="${escapeHtml(value)}"
          aria-describedby="tip-${fieldId} error-${fieldId}"
          aria-invalid="${error ? 'true' : 'false'}"
        />
        <span class="measure-unit-affix">${unit}</span>
      </div>
      <p class="measure-tip" id="tip-${fieldId}">${escapeHtml(cfg.tip)} <span class="measure-range-tip">(Typical: ${range.min}–${range.max} ${unit})</span></p>
      <div class="measure-inline-error" id="error-${fieldId}" role="alert" ${error ? '' : 'hidden'}>
        ${escapeHtml(error)}
      </div>
    </div>
  `;
}

function renderMeasure(product) {
  const images = getProductImages(product);
  const activeImage = images[0] || '';
  const { step, unit, size, measurements, fitPreference, notes, clientName, clientPhone, errors, hasSaved, savedNotice } =
    state.measure;
  const isCustom = size === 'Custom';

  return `
    <!-- Top Bar: Back, Title, Close -->
    <header class="detail-top-bar measure-top-bar">
      <div class="detail-top-bar-inner measure-top-bar-inner">
        <button type="button" class="icon-button" id="measure-back-btn" aria-label="Go back">
          ${ICONS.back}
        </button>
        <span class="detail-top-bar-title measure-top-bar-title">Measurements</span>
        <a href="#product/${escapeHtml(product.id)}" class="icon-button" id="measure-close-btn" aria-label="Cancel and return to product">
          ${ICONS.close}
        </a>
      </div>
    </header>

    <main class="page-container measure-page-container" id="main-content">
      <div class="measure-panel">
        <!-- Unified Product Header & Progress Card -->
        <section class="measure-summary-card" aria-label="Product summary & onboarding progress">
          <div class="measure-summary-top">
            <img src="${escapeHtml(activeImage)}" alt="${escapeHtml(product.name)}" class="measure-summary-thumb" />
            <div class="measure-summary-info">
              <span class="measure-summary-category">${escapeHtml(product.category)}</span>
              <h1 class="measure-summary-title">${escapeHtml(product.name)}</h1>
              <div class="measure-summary-meta">
                <span class="measure-summary-price">${escapeHtml(formatPrice(product.price))}</span>
                <span class="measure-summary-size-tag ${isCustom ? 'custom-tag' : ''}">Size: <strong>${escapeHtml(size)}</strong></span>
              </div>
            </div>
          </div>

          <div class="measure-progress-strip">
            <div class="measure-progress-header">
              <span class="measure-step-label">
                ${
                  step === 4
                    ? 'Final Review & Confirm'
                    : `Step ${step} of 3: ${
                        step === 1
                          ? 'Upper Body'
                          : step === 2
                          ? 'Lower Body & Length'
                          : 'Fit & Details'
                      }`
                }
              </span>
              <span class="measure-step-fraction">
                ${step === 4 ? 'Review' : `Step ${step} / 3`}
              </span>
            </div>
            <div class="measure-progress-track" role="progressbar" aria-valuenow="${step === 4 ? 100 : step * 33}" aria-valuemin="0" aria-valuemax="100">
              <div class="measure-progress-fill step-${step}"></div>
            </div>
          </div>
        </section>

        <!-- Saved Measurements Banner -->
        ${
          hasSaved && step < 4
            ? `
          <aside class="measure-saved-banner" id="measure-saved-banner" aria-label="Saved measurements profile">
            <div class="saved-banner-text">
              <div class="saved-banner-title">
                ${ICONS.tape}
                <strong>Saved Profile Found</strong>
              </div>
              <p class="saved-banner-sub">${savedNotice || 'Use your saved body measurements for fast concierge ordering.'}</p>
            </div>
            <button type="button" class="btn-saved-action" id="use-saved-measurements-btn">
              Use my saved measurements
            </button>
          </aside>
        `
            : ''
        }

        <!-- Step 1: Upper Body -->
        ${
          step === 1
            ? `
          <form class="measure-form" id="measure-step-form" novalidate>
            <div class="measure-step-header">
              <div class="step-title-block">
                <h2 class="measure-section-title">Upper Body Measurements</h2>
                <p class="measure-section-sub">
                  Accurate upper torso measurements ensure a tailored drape. Fields marked with <span class="required-badge" aria-label="required">*</span> are required for custom fit.
                </p>
              </div>

              <!-- Unit of Measure Toggle (cm/inches) -->
              <div class="unit-toggle-wrapper">
                <span class="unit-toggle-caption">Unit:</span>
                <div class="unit-toggle-pills" role="radiogroup" aria-label="Measurement unit toggle">
                  <button
                    type="button"
                    class="unit-toggle-pill ${unit === 'in' ? 'active' : ''}"
                    data-unit="in"
                    role="radio"
                    aria-checked="${unit === 'in'}"
                  >
                    Inches (in)
                  </button>
                  <button
                    type="button"
                    class="unit-toggle-pill ${unit === 'cm' ? 'active' : ''}"
                    data-unit="cm"
                    role="radio"
                    aria-checked="${unit === 'cm'}"
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>
            </div>

            <!-- Two-Column Form Grid -->
            <div class="measure-form-grid">
              ${renderMeasureField('chest', unit, isCustom)}
              ${renderMeasureField('shoulder', unit, isCustom)}
              ${renderMeasureField('sleeve', unit, isCustom)}
              ${renderMeasureField('neck', unit, isCustom)}
            </div>

            <!-- Bottom Action Row -->
            <div class="measure-actions-row">
              ${
                !isCustom
                  ? `
                <button type="button" class="btn-secondary measure-btn-skip" id="step1-skip-btn">
                  Skip, use standard size
                </button>
              `
                  : ''
              }
              <button type="button" class="btn-primary measure-btn-next ${isCustom ? 'full-width' : ''}" id="step1-next-btn">
                <span>Continue to Lower Body</span>
                ${ICONS.arrowRight}
              </button>
            </div>

            ${
              isCustom
                ? `
              <p class="measure-bespoke-note">
                ${ICONS.tape}
                <span>Custom Size: measurements are required so Ezekiel can hand-craft this piece to your exact proportions.</span>
              </p>
            `
                : ''
            }
          </form>
        `
            : ''
        }

        <!-- Step 2: Lower Body & Length -->
        ${
          step === 2
            ? `
          <form class="measure-form" id="measure-step-form" novalidate>
            <div class="measure-step-header">
              <div class="step-title-block">
                <h2 class="measure-section-title">Lower Body & Garment Length</h2>
                <p class="measure-section-sub">Waist, hips, and garment lengths determine trouser break and kaftan hemline.</p>
              </div>

              <!-- Unit of Measure Toggle (cm/inches) -->
              <div class="unit-toggle-wrapper">
                <span class="unit-toggle-caption">Unit:</span>
                <div class="unit-toggle-pills" role="radiogroup" aria-label="Measurement unit toggle">
                  <button
                    type="button"
                    class="unit-toggle-pill ${unit === 'in' ? 'active' : ''}"
                    data-unit="in"
                    role="radio"
                    aria-checked="${unit === 'in'}"
                  >
                    Inches (in)
                  </button>
                  <button
                    type="button"
                    class="unit-toggle-pill ${unit === 'cm' ? 'active' : ''}"
                    data-unit="cm"
                    role="radio"
                    aria-checked="${unit === 'cm'}"
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>
            </div>

            <!-- Two-Column Form Grid -->
            <div class="measure-form-grid">
              ${renderMeasureField('waist', unit, isCustom)}
              ${renderMeasureField('hip', unit, isCustom)}
              ${renderMeasureField('trouserLength', unit, isCustom)}
              ${renderMeasureField('kaftanLength', unit, isCustom)}
            </div>

            <!-- Bottom Action Row -->
            <div class="measure-actions-row">
              <button type="button" class="btn-secondary" id="step2-back-btn">
                Back
              </button>
              ${
                !isCustom
                  ? `
                <button type="button" class="btn-secondary measure-btn-skip" id="step2-skip-btn">
                  Skip, use standard size
                </button>
              `
                  : ''
              }
              <button type="button" class="btn-primary measure-btn-next" id="step2-next-btn">
                <span>Continue to Details</span>
                ${ICONS.arrowRight}
              </button>
            </div>
          </form>
        `
            : ''
        }

        <!-- Step 3: Details & Contact -->
        ${
          step === 3
            ? `
          <form class="measure-form" id="measure-step-form" novalidate>
            <div class="measure-step-header">
              <div class="step-title-block">
                <h2 class="measure-section-title">Fit Preferences & Client Details</h2>
                <p class="measure-section-sub">Personalize your tailoring style and tell Ezekiel where to confirm your order.</p>
              </div>
            </div>

            <div class="measure-details-stack">
              <!-- Height (Optional) -->
              <div class="measure-field-group">
                <div class="measure-label-row">
                  <label for="measure-height" class="measure-label">
                    Total Height (${unit}) <span class="optional-tag">Optional</span>
                  </label>
                  <span class="measure-range-tag">${MEASUREMENT_CONFIG.height.ranges[unit].min}–${MEASUREMENT_CONFIG.height.ranges[unit].max} ${unit}</span>
                </div>
                <div class="measure-input-wrapper">
                  <input
                    type="text"
                    inputmode="decimal"
                    id="measure-height"
                    name="height"
                    class="measure-input ${errors.height ? 'input-error' : ''}"
                    placeholder="e.g. ${unit === 'in' ? '70' : '178'}"
                    value="${escapeHtml(measurements.height || '')}"
                    aria-describedby="tip-height error-height"
                    aria-invalid="${errors.height ? 'true' : 'false'}"
                  />
                  <span class="measure-unit-affix">${unit}</span>
                </div>
                <p class="measure-tip" id="tip-height">${escapeHtml(MEASUREMENT_CONFIG.height.tip)}</p>
                <div class="measure-inline-error" id="error-height" role="alert" ${errors.height ? '' : 'hidden'}>
                  ${escapeHtml(errors.height || '')}
                </div>
              </div>

              <!-- Fit Preference Pills -->
              <div class="measure-field-group">
                <label id="fit-label" class="measure-label">Fit Preference</label>
                <div class="fit-pills-row" role="radiogroup" aria-labelledby="fit-label">
                  ${['Slim', 'Regular', 'Relaxed']
                    .map(
                      (fit) => `
                    <button
                      type="button"
                      class="fit-pill ${fitPreference === fit ? 'active' : ''}"
                      data-fit="${fit}"
                      role="radio"
                      aria-checked="${fitPreference === fit}"
                    >
                      ${fit}
                    </button>
                  `
                    )
                    .join('')}
                </div>
                <p class="measure-tip">Slim: tailored contour; Regular: standard classic drape; Relaxed: loose flowing ease.</p>
              </div>

              <!-- Special Notes (Optional) -->
              <div class="measure-field-group">
                <label for="measure-notes" class="measure-label">
                  Special Notes & Adjustments <span class="optional-tag">Optional</span>
                </label>
                <textarea
                  id="measure-notes"
                  name="notes"
                  class="measure-textarea"
                  rows="3"
                  placeholder="e.g. Extra 1 inch on sleeves, loose neckline, concealed side pocket, urgent wedding deadline..."
                >${escapeHtml(notes)}</textarea>
                <p class="measure-tip">Any personal adjustments or styling touches for Ezekiel.</p>
              </div>

              <!-- Client Full Name -->
              <div class="measure-field-group">
                <label for="measure-clientName" class="measure-label">
                  Your Full Name <span class="required-badge">*</span>
                </label>
                <input
                  type="text"
                  id="measure-clientName"
                  name="clientName"
                  autocomplete="name"
                  class="measure-input ${errors.clientName ? 'input-error' : ''}"
                  placeholder="e.g. Babatunde Adeyemi"
                  value="${escapeHtml(clientName)}"
                  aria-invalid="${errors.clientName ? 'true' : 'false'}"
                />
                <div class="measure-inline-error" id="error-clientName" role="alert" ${errors.clientName ? '' : 'hidden'}>
                  ${escapeHtml(errors.clientName || '')}
                </div>
              </div>

              <!-- WhatsApp Phone Number -->
              <div class="measure-field-group">
                <label for="measure-clientPhone" class="measure-label">
                  WhatsApp Phone Number <span class="required-badge">*</span>
                </label>
                <input
                  type="tel"
                  inputmode="tel"
                  id="measure-clientPhone"
                  name="clientPhone"
                  autocomplete="tel"
                  class="measure-input ${errors.clientPhone ? 'input-error' : ''}"
                  placeholder="+234 801 234 5678"
                  value="${escapeHtml(clientPhone)}"
                  aria-invalid="${errors.clientPhone ? 'true' : 'false'}"
                />
                <p class="measure-tip">Master Ezekiel will confirm measurements, fabric swatch photos & delivery updates here.</p>
                <div class="measure-inline-error" id="error-clientPhone" role="alert" ${errors.clientPhone ? '' : 'hidden'}>
                  ${escapeHtml(errors.clientPhone || '')}
                </div>
              </div>
            </div>

            <!-- Bottom Action Row -->
            <div class="measure-actions-row">
              <button type="button" class="btn-secondary" id="step3-back-btn">
                Back
              </button>
              <button type="button" class="btn-primary measure-btn-next" id="step3-next-btn">
                <span>Review Order</span>
                ${ICONS.arrowRight}
              </button>
            </div>
          </form>
        `
            : ''
        }

        <!-- Step 4: Final Review Card -->
        ${
          step === 4
            ? `
          <div class="review-container" aria-label="Review order and measurements">
            <div class="review-header-block">
              <h2 class="measure-section-title">Review Your Order</h2>
              <p class="measure-section-sub">Please verify your garment sizing and measurements before sending your order to Ezekiel on WhatsApp.</p>
            </div>

            <!-- Card 1: Product & Size -->
            <div class="review-card">
              <div class="review-card-header">
                <h3 class="review-card-title">Garment & Fit</h3>
                <a href="#product/${escapeHtml(product.id)}" class="review-edit-link">Change</a>
              </div>
              <div class="review-product-preview">
                <img src="${escapeHtml(activeImage)}" alt="${escapeHtml(product.name)}" class="review-thumb" />
                <div class="review-product-info">
                  <h4 class="review-item-name">${escapeHtml(product.name)}</h4>
                  <span class="review-item-price">${escapeHtml(formatPrice(product.price))}</span>
                  <div class="review-size-pill-row">
                    <span class="review-pill">Size: <strong>${escapeHtml(size)}</strong></span>
                    <span class="review-pill">Fit: <strong>${escapeHtml(fitPreference)}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Client Contact Details -->
            <div class="review-card">
              <div class="review-card-header">
                <h3 class="review-card-title">Client Contact</h3>
                <button type="button" class="review-edit-link" data-goto-step="3">
                  ${ICONS.edit}
                  <span>Edit</span>
                </button>
              </div>
              <dl class="review-dl">
                <div class="review-dl-row">
                  <dt>Full Name</dt>
                  <dd>${escapeHtml(clientName || '—')}</dd>
                </div>
                <div class="review-dl-row">
                  <dt>WhatsApp Phone</dt>
                  <dd>${escapeHtml(clientPhone || '—')}</dd>
                </div>
                ${
                  notes
                    ? `
                  <div class="review-dl-row">
                    <dt>Special Notes</dt>
                    <dd>${escapeHtml(notes)}</dd>
                  </div>
                `
                    : ''
                }
              </dl>
            </div>

            <!-- Card 3: Measurements Summary -->
            <div class="review-card">
              <div class="review-card-header">
                <h3 class="review-card-title">Body Measurements (${escapeHtml(unit)})</h3>
                ${
                  !state.measure.skippedMeasurements
                    ? `
                  <button type="button" class="review-edit-link" data-goto-step="1">
                    ${ICONS.edit}
                    <span>Edit</span>
                  </button>
                `
                    : ''
                }
              </div>

              ${
                state.measure.skippedMeasurements
                  ? `
                <div class="review-skipped-box">
                  <p class="review-skipped-title">Standard Size <strong>${escapeHtml(size)}</strong> Selected</p>
                  <p class="review-skipped-sub">Custom measurements were skipped. Ezekiel will craft your garment using the standard Nigerian luxury ${escapeHtml(size)} sizing block.</p>
                  <button type="button" class="review-inline-add-link" data-goto-step="1">Add custom measurements instead</button>
                </div>
              `
                  : `
                <div class="review-measurements-grid">
                  ${[
                    { id: 'chest', label: 'Chest' },
                    { id: 'shoulder', label: 'Shoulder Width' },
                    { id: 'sleeve', label: 'Sleeve Length' },
                    { id: 'neck', label: 'Neck' },
                    { id: 'waist', label: 'Waist' },
                    { id: 'hip', label: 'Hip' },
                    { id: 'trouserLength', label: 'Trouser Length' },
                    { id: 'kaftanLength', label: 'Top / Kaftan Length' },
                    { id: 'height', label: 'Height' }
                  ]
                    .map((item) => {
                      const val = measurements[item.id];
                      if (!val) return '';
                      return `
                        <div class="review-measure-cell">
                          <span class="review-cell-label">${escapeHtml(item.label)}</span>
                          <span class="review-cell-val">${escapeHtml(val)} ${escapeHtml(unit)}</span>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              `
              }
            </div>

            <!-- Order Action Block -->
            <div class="review-order-actions">
              <button
                type="button"
                class="order-whatsapp-btn full-width review-main-cta"
                id="send-measurements-whatsapp-btn"
                aria-label="Send tailoring order to Ezekiel on WhatsApp"
              >
                ${ICONS.whatsapp}
                <span>Send to Ezekiel on WhatsApp</span>
              </button>

              <button type="button" class="btn-secondary full-width" id="review-back-btn">
                Back to Details
              </button>

              <p class="cta-guarantee-note">
                Tapping opens WhatsApp with your prefilled measurements and order summary directly to Master Tailor Ezekiel.
              </p>
            </div>
          </div>
        `
            : ''
        }
      </div>
    </main>
  `;
}

function bindMeasureEvents(product) {
  const isCustom = state.measure.size === 'Custom';

  // Back button in top bar
  const backBtn = document.querySelector('#measure-back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      if (state.measure.step === 1) {
        window.location.hash = `#product/${product.id}`;
      } else {
        state.measure.step--;
        state.measure.errors = {};
        render();
        window.scrollTo(0, 0);
      }
    };
  }

  // Close button in top bar
  const closeBtn = document.querySelector('#measure-close-btn');
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      window.location.hash = `#product/${product.id}`;
    };
  }

  // Unit toggle pills (cm / inches)
  document.querySelectorAll('.unit-toggle-pill').forEach((btn) => {
    btn.onclick = () => {
      const targetUnit = btn.dataset.unit;
      if (targetUnit === state.measure.unit) return;

      const oldUnit = state.measure.unit;
      state.measure.unit = targetUnit;

      // Convert all populated measurement values
      Object.keys(state.measure.measurements).forEach((key) => {
        const val = state.measure.measurements[key];
        if (val != null && String(val).trim() !== '') {
          state.measure.measurements[key] = String(
            convertMeasurement(val, oldUnit, targetUnit)
          );
        }
      });

      state.measure.errors = {};
      render();
    };
  });

  // Use my saved measurements button
  const savedBtn = document.querySelector('#use-saved-measurements-btn');
  if (savedBtn) {
    savedBtn.onclick = (e) => {
      e.preventDefault();
      const saved = getSavedMeasurements();
      if (saved) {
        if (saved.unit) state.measure.unit = saved.unit;
        if (saved.measurements) {
          Object.keys(state.measure.measurements).forEach((k) => {
            if (saved.measurements[k] != null) {
              state.measure.measurements[k] = String(saved.measurements[k]);
            }
          });
        }
        if (saved.fitPreference) state.measure.fitPreference = saved.fitPreference;
        if (saved.clientName) state.measure.clientName = saved.clientName;
        if (saved.clientPhone) state.measure.clientPhone = saved.clientPhone;
        if (saved.notes) state.measure.notes = saved.notes;

        state.measure.savedNotice = 'Measurements successfully restored from profile!';
        state.measure.errors = {};
        render();
      }
    };
  }

  // Real-time measurement input binding & error clearing
  document.querySelectorAll('.measure-input').forEach((input) => {
    input.oninput = (e) => {
      const fieldName = e.target.name;
      const val = e.target.value;

      if (fieldName === 'clientName') {
        state.measure.clientName = val;
      } else if (fieldName === 'clientPhone') {
        state.measure.clientPhone = val;
      } else {
        state.measure.measurements[fieldName] = val;
      }

      if (state.measure.errors[fieldName]) {
        delete state.measure.errors[fieldName];
        input.classList.remove('input-error');
        input.setAttribute('aria-invalid', 'false');
        const errEl = document.querySelector(`#error-${fieldName}`);
        if (errEl) {
          errEl.setAttribute('hidden', '');
          errEl.textContent = '';
        }
      }
    };
  });

  // Notes textarea
  const notesTextarea = document.querySelector('#measure-notes');
  if (notesTextarea) {
    notesTextarea.oninput = (e) => {
      state.measure.notes = e.target.value;
    };
  }

  // Fit pills
  document.querySelectorAll('.fit-pill').forEach((pill) => {
    pill.onclick = () => {
      state.measure.fitPreference = pill.dataset.fit;
      document.querySelectorAll('.fit-pill').forEach((p) => {
        const isActive = p.dataset.fit === state.measure.fitPreference;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    };
  });

  // Skip buttons (Step 1 & Step 2 for standard sizes)
  const skipBtn1 = document.querySelector('#step1-skip-btn');
  if (skipBtn1) {
    skipBtn1.onclick = () => {
      state.measure.skippedMeasurements = true;
      state.measure.errors = {};
      if (state.measure.clientName && state.measure.clientPhone) {
        state.measure.step = 4;
      } else {
        state.measure.step = 3;
      }
      render();
      window.scrollTo(0, 0);
    };
  }

  const skipBtn2 = document.querySelector('#step2-skip-btn');
  if (skipBtn2) {
    skipBtn2.onclick = () => {
      state.measure.skippedMeasurements = true;
      state.measure.errors = {};
      if (state.measure.clientName && state.measure.clientPhone) {
        state.measure.step = 4;
      } else {
        state.measure.step = 3;
      }
      render();
      window.scrollTo(0, 0);
    };
  }

  // Step 1 Next
  const step1Next = document.querySelector('#step1-next-btn');
  if (step1Next) {
    step1Next.onclick = (e) => {
      e.preventDefault();
      const res = validateMeasurementsStep(
        1,
        state.measure.measurements,
        state.measure.unit,
        isCustom
      );

      if (!res.isValid) {
        state.measure.errors = res.errors;
        render();
        const firstErr = document.querySelector('.input-error');
        if (firstErr) firstErr.focus();
        return;
      }

      state.measure.errors = {};
      state.measure.step = 2;
      render();
      window.scrollTo(0, 0);
    };
  }

  // Step 2 Back & Next
  const step2Back = document.querySelector('#step2-back-btn');
  if (step2Back) {
    step2Back.onclick = (e) => {
      e.preventDefault();
      state.measure.errors = {};
      state.measure.step = 1;
      render();
      window.scrollTo(0, 0);
    };
  }

  const step2Next = document.querySelector('#step2-next-btn');
  if (step2Next) {
    step2Next.onclick = (e) => {
      e.preventDefault();
      const res = validateMeasurementsStep(
        2,
        state.measure.measurements,
        state.measure.unit,
        isCustom
      );

      if (!res.isValid) {
        state.measure.errors = res.errors;
        render();
        const firstErr = document.querySelector('.input-error');
        if (firstErr) firstErr.focus();
        return;
      }

      state.measure.errors = {};
      state.measure.step = 3;
      render();
      window.scrollTo(0, 0);
    };
  }

  // Step 3 Back & Next
  const step3Back = document.querySelector('#step3-back-btn');
  if (step3Back) {
    step3Back.onclick = (e) => {
      e.preventDefault();
      state.measure.errors = {};
      state.measure.step = 2;
      render();
      window.scrollTo(0, 0);
    };
  }

  const step3Next = document.querySelector('#step3-next-btn');
  if (step3Next) {
    step3Next.onclick = (e) => {
      e.preventDefault();
      const res = validateMeasurementsStep(
        3,
        {
          height: state.measure.measurements.height,
          clientName: state.measure.clientName,
          clientPhone: state.measure.clientPhone
        },
        state.measure.unit,
        isCustom
      );

      if (!res.isValid) {
        state.measure.errors = res.errors;
        render();
        const firstErr = document.querySelector('.input-error');
        if (firstErr) firstErr.focus();
        return;
      }

      state.measure.errors = {};
      state.measure.step = 4;
      render();
      window.scrollTo(0, 0);
    };
  }

  // Review step edit buttons
  document.querySelectorAll('[data-goto-step]').forEach((btn) => {
    btn.onclick = () => {
      const targetStep = Number(btn.dataset.gotoStep);
      state.measure.step = targetStep;
      if (targetStep === 1) state.measure.skippedMeasurements = false;
      state.measure.errors = {};
      render();
      window.scrollTo(0, 0);
    };
  });

  // Review step Back
  const reviewBack = document.querySelector('#review-back-btn');
  if (reviewBack) {
    reviewBack.onclick = (e) => {
      e.preventDefault();
      state.measure.step = 3;
      state.measure.errors = {};
      render();
      window.scrollTo(0, 0);
    };
  }

  // Final Review WhatsApp Send
  const sendWhatsAppBtn = document.querySelector('#send-measurements-whatsapp-btn');
  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.onclick = (e) => {
      e.preventDefault();

      // Persist in localStorage so returning clients get measurements prefilled
      persistSavedMeasurements({
        unit: state.measure.unit,
        measurements: state.measure.measurements,
        fitPreference: state.measure.fitPreference,
        clientName: state.measure.clientName,
        clientPhone: state.measure.clientPhone,
        notes: state.measure.notes,
        updatedAt: Date.now()
      });

      const pageUrl = `${window.location.origin}${window.location.pathname}#product/${product.id}`;
      const whatsappUrl = buildWhatsAppMeasurementsUrl(WHATSAPP_PHONE, {
        productName: product.name,
        productPrice: product.price,
        size: state.measure.size,
        measurements: state.measure.measurements,
        unit: state.measure.unit,
        fitPreference: state.measure.fitPreference,
        notes: state.measure.notes,
        clientName: state.measure.clientName,
        clientPhone: state.measure.clientPhone,
        pageUrl,
        skippedMeasurements: state.measure.skippedMeasurements
      });

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };
  }
}

// -----------------------------------------------------------------------------
// ROUTER & INITIALIZATION
// -----------------------------------------------------------------------------

function render() {
  const app = document.querySelector('#app');
  if (!app) return;

  const hash = window.location.hash || '';

  // Route: Admin Portal (#/admin or #admin)
  if (hash.startsWith('#/admin') || hash.startsWith('#admin')) {
    initAdmin(app);
    return;
  }

  // Route: #/measure/<productId>?size=<size>
  if (hash.startsWith('#measure/')) {
    const raw = hash.replace('#measure/', '').trim();
    const [productId, queryString] = raw.split('?');
    const params = new URLSearchParams(queryString || '');
    const size = params.get('size') || 'Custom';

    const product = state.products.find((p) => p.id === productId || p.slug === productId);
    if (!product) {
      app.innerHTML = renderNotFound();
      const notFoundBackBtn = document.querySelector('#not-found-back-btn');
      if (notFoundBackBtn) {
        notFoundBackBtn.onclick = (e) => {
          e.preventDefault();
          window.location.hash = '#shop';
        };
      }
      const notFoundTopBackBtn = document.querySelector('#not-found-back-top-btn');
      if (notFoundTopBackBtn) {
        notFoundTopBackBtn.onclick = (e) => {
          e.preventDefault();
          window.location.hash = '#shop';
        };
      }
      window.scrollTo(0, 0);
      return;
    }

    initMeasureState(product.id, size);
    app.innerHTML = renderMeasure(product);
    bindMeasureEvents(product);
    return;
  }

  if (hash.startsWith('#product/')) {
    const productId = hash.replace('#product/', '').trim();
    const product = state.products.find((p) => p.id === productId || p.slug === productId);

    if (!product) {
      app.innerHTML = renderNotFound();
      const notFoundBackBtn = document.querySelector('#not-found-back-btn');
      if (notFoundBackBtn) {
        notFoundBackBtn.onclick = (e) => {
          e.preventDefault();
          window.location.hash = '#shop';
        };
      }
      const notFoundTopBackBtn = document.querySelector('#not-found-back-top-btn');
      if (notFoundTopBackBtn) {
        notFoundTopBackBtn.onclick = (e) => {
          e.preventDefault();
          window.location.hash = '#shop';
        };
      }
      window.scrollTo(0, 0);
      return;
    }

    if (state.detail.productId !== product.id) {
      state.detail = {
        productId: product.id,
        selectedImageIndex: 0,
        selectedSize: null,
        sizeError: false
      };
    }

    app.innerHTML = renderDetail(product);
    bindDetailEvents(product);
    window.scrollTo(0, 0);
    return;
  }

  // Default: Home / Shop
  app.innerHTML = renderHome();
  bindHomeEvents();
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', render);
}
