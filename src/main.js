import productsData from './products.json';
import {
  formatPrice,
  buildWhatsAppUrl,
  filterProducts,
  escapeHtml,
  isSizeSelected,
  getProductImages
} from './utils.js';

export { getProductImages };

// SVG Icons (clean, high-legibility strokes)
const ICONS = {
  menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  close: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
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

function getInitialWishlist() {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('apparel_wishlist') || '[]');
  } catch {
    return [];
  }
}

// App State
const state = {
  products: productsData,
  currentCategory: 'All',
  searchQuery: '',
  isMenuOpen: false,
  wishlist: new Set(getInitialWishlist()),
  detail: {
    productId: null,
    selectedImageIndex: 0,
    selectedSize: null,
    sizeError: false
  }
};

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
              aria-label="Order ${escapeHtml(product.name)} on WhatsApp"
            >
              ${ICONS.whatsapp}
              <span>Order on WhatsApp</span>
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
          aria-label="Order ${escapeHtml(product.name)} on WhatsApp"
        >
          ${ICONS.whatsapp}
          <span>Order on WhatsApp</span>
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

function selectSize(sz) {
  state.detail.selectedSize = sz;
  state.detail.sizeError = false;
  updateSizeSectionUI();
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

  const pageUrl = window.location.href;
  const whatsappUrl = buildWhatsAppUrl(WHATSAPP_PHONE, {
    product: product.name,
    size: state.detail.selectedSize,
    price: product.price,
    link: pageUrl
  });

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
      selectSize(sz);
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
// ROUTER & INITIALIZATION
// -----------------------------------------------------------------------------

function render() {
  const app = document.querySelector('#app');
  if (!app) return;

  const hash = window.location.hash || '';

  if (hash.startsWith('#product/')) {
    const productId = hash.replace('#product/', '').trim();
    const product = state.products.find((p) => p.id === productId);

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
