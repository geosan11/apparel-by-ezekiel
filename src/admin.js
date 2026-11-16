import {
  supabase,
  isSupabaseConfigured,
  checkIsAdmin,
  fetchAdminProducts,
  fetchAdminOrders,
  upsertProduct,
  deleteProduct,
  toggleProductPublished,
  processProductImage,
  uploadProductPhoto
} from './supabase.js';
import productsFallbackData from './products.json';
import {
  formatPrice,
  parsePrice,
  generateSlug,
  escapeHtml,
  normalizeProduct,
  validateMakingDays,
  calculateExpectedReadyDate,
  formatExpectedReadyDate,
  koboToNaira
} from './utils.js';

// Admin SVG Icons
const ADMIN_ICONS = {
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  arrowLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  arrowRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  upload: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  star: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  orders: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  scissors: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`,
  calendar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  phone: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  whatsapp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.782-.879-2.057-.98-.276-.1-.477-.15-.678.15-.201.301-.778.98-.954 1.18-.176.2-.352.226-.653.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.785-1.676-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.1-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.237-.245-.588-.493-.508-.678-.518l-.578-.01c-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.124 3.244 5.146 4.549.719.31 1.28.496 1.718.636.722.229 1.378.197 1.898.119.579-.088 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zm-5.467 7.426h-.005a9.882 9.882 0 0 1-5.034-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 0 1-1.514-5.26c0-5.46 4.444-9.904 9.909-9.904 2.646 0 5.132 1.031 7.001 2.903a9.839 9.839 0 0 1 2.899 7.003c-.002 5.462-4.447 9.906-9.914 9.906zM20.52 3.484C18.257 1.22 15.245 0 12.005 0 5.44 0 .092 5.347.09 11.913a11.85 11.85 0 0 0 1.815 6.275L0 24l5.986-1.57a11.89 11.89 0 0 0 5.998 1.62h.005c6.564 0 11.913-5.348 11.915-11.915 0-3.182-1.24-6.195-3.384-8.651z"/></svg>`
};

const CATEGORIES = ['Kaftans', 'Agbada', 'Senator', 'Accessories'];
const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Custom'];

// Local mutable state for Admin module
const adminState = {
  view: 'list', // 'list' | 'add' | 'edit'
  activeTab: 'garments', // 'garments' | 'orders'
  user: null,
  isAdmin: false,
  isCheckingAuth: true,
  isDemoMode: false,
  products: [],
  orders: [],
  ordersSearchQuery: '',
  ordersFilterStatus: 'All',
  searchQuery: '',
  categoryFilter: 'All',
  editingProduct: null,
  isUploading: false,
  uploadMessage: '',
  isSaving: false,
  deleteConfirmProduct: null,
  loginError: '',
  toast: null // { message: string, type: 'success' | 'error' }
};

let toastTimeout = null;

export function showToast(message, type = 'success') {
  if (toastTimeout) clearTimeout(toastTimeout);
  adminState.toast = { message, type };
  renderToast();
  toastTimeout = setTimeout(() => {
    adminState.toast = null;
    renderToast();
  }, 3500);
}

function renderToast() {
  const container = document.querySelector('#admin-toast-container');
  if (!container) return;
  if (!adminState.toast) {
    container.innerHTML = '';
    return;
  }
  const isErr = adminState.toast.type === 'error';
  container.innerHTML = `
    <div class="admin-toast ${isErr ? 'admin-toast-error' : 'admin-toast-success'}" role="alert">
      <div class="admin-toast-content">
        <span class="admin-toast-icon">${isErr ? ADMIN_ICONS.alert : ADMIN_ICONS.check}</span>
        <span class="admin-toast-text">${escapeHtml(adminState.toast.message)}</span>
      </div>
      <button type="button" class="admin-toast-close" id="admin-toast-close-btn" aria-label="Close notification">
        ${ADMIN_ICONS.close}
      </button>
    </div>
  `;
  const closeBtn = document.querySelector('#admin-toast-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      adminState.toast = null;
      renderToast();
    };
  }
}

/**
 * Initialize Admin App
 */
export async function initAdmin(container) {
  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(hash.split('?')[1] || '');
  const isDev = Boolean(import.meta.env && import.meta.env.DEV);
  const isDemo = isDev && searchParams.get('demo') === '1';

  adminState.isDemoMode = isDemo;
  adminState.isCheckingAuth = true;
  adminState.loginError = '';

  renderAdmin(container);

  if (isDemo) {
    // In dev demo mode, simulate authenticated owner Ezekiel
    adminState.user = { email: 'ezekiel@apparelbyezekiel.com', id: 'demo-ezekiel' };
    adminState.isAdmin = true;
    adminState.isCheckingAuth = false;
    adminState.products = productsFallbackData.map(normalizeProduct);
    adminState.orders = getSampleOrders();
    const hash = window.location.hash || '';
    if (hash.includes('tab=orders')) {
      adminState.activeTab = 'orders';
    }
    renderAdmin(container);
    return;
  }

  if (!isSupabaseConfigured || !supabase) {
    adminState.isCheckingAuth = false;
    adminState.user = null;
    adminState.isAdmin = false;
    renderAdmin(container);
    return;
  }

  // Check current session from Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      adminState.user = session.user;
      adminState.isAdmin = await checkIsAdmin(session.user);
      if (adminState.isAdmin) {
        await Promise.all([loadAdminProducts(), loadAdminOrders()]);
      }
    } else {
      adminState.user = null;
      adminState.isAdmin = false;
    }
  } catch (err) {
    console.error('Admin auth check failed:', err);
    adminState.user = null;
    adminState.isAdmin = false;
  } finally {
    adminState.isCheckingAuth = false;
    renderAdmin(container);
  }
}

function getSampleOrders() {
  return [
    {
      id: 'ord-001',
      reference: 'ABE-849201-LAGOS',
      product_id: 'kaftan-010',
      product_name: 'Kaftan 010 – Royal Sand',
      amount: 12000000, // ₦120,000 (in kobo)
      currency: 'NGN',
      status: 'paid',
      customer_name: 'Babatunde Adeyemi',
      customer_phone: '+234 803 456 7890',
      customer_email: 'babatunde@lagos.ng',
      size: 'Custom',
      measurements: {
        chest: 42,
        shoulder: 19.5,
        sleeve: 26,
        neck: 16.5,
        waist: 35,
        trouserLength: 42,
        unit: 'in'
      },
      making_days: 10,
      expected_ready_date: calculateExpectedReadyDate(new Date(Date.now() - 2 * 86400000), 10),
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'ord-002',
      reference: 'ABE-719342-ABUJA',
      product_id: 'agbada-monarch',
      product_name: 'Monarch Grand Agbada – Imperial Emerald',
      amount: 25000000, // ₦250,000 (in kobo)
      currency: 'NGN',
      status: 'pending',
      customer_name: 'Chief Chukwuma Obi',
      customer_phone: '+234 812 345 6789',
      customer_email: 'c.obi@abuja.com',
      size: 'XL',
      measurements: {
        chest: 44,
        shoulder: 20,
        height: '6ft 1in',
        unit: 'in'
      },
      making_days: 21,
      expected_ready_date: calculateExpectedReadyDate(new Date(Date.now() - 1 * 86400000), 21),
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'ord-003',
      reference: 'ABE-512098-VI',
      product_id: 'senator-diplomat',
      product_name: 'Diplomat Senator – Slate Grey',
      amount: 9500000, // ₦95,000 (in kobo)
      currency: 'NGN',
      status: 'paid',
      customer_name: 'Olumide Bakare',
      customer_phone: '+234 809 123 4567',
      customer_email: 'olumide.bakare@gmail.com',
      size: 'L',
      measurements: {
        chest: 41,
        shoulder: 18.5,
        sleeve: 25,
        waist: 34,
        unit: 'in'
      },
      making_days: 7,
      expected_ready_date: calculateExpectedReadyDate(new Date(Date.now() - 4 * 86400000), 7),
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    }
  ];
}

async function loadAdminOrders() {
  if (adminState.isDemoMode || !isSupabaseConfigured) {
    if (adminState.orders.length === 0) {
      adminState.orders = getSampleOrders();
    }
    return;
  }

  const { orders, error } = await fetchAdminOrders();
  if (error || !orders || orders.length === 0) {
    adminState.orders = getSampleOrders();
  } else {
    adminState.orders = orders;
  }
}

async function loadAdminProducts() {
  if (adminState.isDemoMode) {
    if (adminState.products.length === 0) {
      adminState.products = productsFallbackData.map(normalizeProduct);
    }
    return;
  }

  const { products, error } = await fetchAdminProducts();
  if (error) {
    showToast('Failed to load products from database', 'error');
    adminState.products = productsFallbackData.map(normalizeProduct);
  } else {
    adminState.products = products.length > 0 ? products : productsFallbackData.map(normalizeProduct);
  }
}

/**
 * Main Render Dispatcher
 */
export function renderAdmin(container) {
  if (!container) return;

  if (adminState.isCheckingAuth) {
    container.innerHTML = `
      <div class="admin-loading-screen">
        <div class="admin-spinner" aria-hidden="true"></div>
        <p class="admin-loading-text">Verifying owner access...</p>
      </div>
    `;
    return;
  }

  // Not signed in
  if (!adminState.user) {
    container.innerHTML = renderLogin();
    bindLoginEvents(container);
    renderToast();
    return;
  }

  // Signed in but not an authorized admin in public.admins
  if (!adminState.isAdmin) {
    container.innerHTML = renderUnauthorized();
    bindUnauthorizedEvents(container);
    renderToast();
    return;
  }

  // Authorized Admin View
  if (adminState.view === 'add' || adminState.view === 'edit') {
    container.innerHTML = renderProductForm();
    bindProductFormEvents(container);
  } else {
    container.innerHTML = renderProductList();
    bindProductListEvents(container);
  }

  // Render confirm modal if open
  renderConfirmModal(container);
  renderToast();
}

/**
 * Render Login Form
 */
function renderLogin() {
  const isDev = Boolean(import.meta.env && import.meta.env.DEV);

  return `
    <div class="admin-login-page">
      <div id="admin-toast-container"></div>
      
      <div class="admin-login-card">
        <div class="admin-login-header">
          <a href="#shop" class="admin-login-brand">APPAREL BY EZEKIEL</a>
          <h1 class="admin-login-title">Owner Admin Portal</h1>
          <p class="admin-login-subtitle">
            Sign in to manage product photography, update pricing, and edit garment details.
          </p>
        </div>

        ${
          adminState.loginError
            ? `
          <div class="admin-alert admin-alert-danger" role="alert">
            <span class="admin-alert-icon">${ADMIN_ICONS.alert}</span>
            <div class="admin-alert-text">${escapeHtml(adminState.loginError)}</div>
          </div>
        `
            : ''
        }

        <form id="admin-login-form" class="admin-login-form" novalidate>
          <div class="admin-field">
            <label for="admin-email" class="admin-label">Email Address</label>
            <input
              type="email"
              id="admin-email"
              name="email"
              class="admin-input"
              placeholder="ezekiel@apparelbyezekiel.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="admin-field">
            <label for="admin-password" class="admin-label">Password</label>
            <input
              type="password"
              id="admin-password"
              name="password"
              class="admin-input"
              placeholder="••••••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="admin-btn admin-btn-primary admin-btn-block" id="admin-login-btn">
            Sign In to Admin
          </button>
        </form>

        <div class="admin-login-footer">
          <a href="#shop" class="admin-link-secondary">
            ${ADMIN_ICONS.arrowLeft} Back to Storefront
          </a>

          ${
            isDev
              ? `
            <div class="admin-demo-box">
              <span class="admin-demo-badge">Dev Mode</span>
              <p class="admin-demo-text">Reviewing without database credentials?</p>
              <a href="#/admin?demo=1" class="admin-demo-link" id="admin-launch-demo-btn">
                Launch Dev Demo Admin →
              </a>
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function bindLoginEvents(container) {
  const form = container.querySelector('#admin-login-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = (form.querySelector('#admin-email')?.value || '').trim();
      const password = (form.querySelector('#admin-password')?.value || '').trim();

      if (!email || !password) {
        adminState.loginError = 'Please enter both your email and password.';
        renderAdmin(container);
        return;
      }

      if (!supabase) {
        adminState.loginError = 'Supabase environment variables are missing. Please check .env.local configuration.';
        renderAdmin(container);
        return;
      }

      const submitBtn = form.querySelector('#admin-login-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          adminState.loginError = error.message.includes('Invalid login')
            ? 'Incorrect email or password. Please verify your details.'
            : error.message;
          renderAdmin(container);
          return;
        }

        adminState.user = data.user;
        adminState.isAdmin = await checkIsAdmin(data.user);
        adminState.loginError = '';

        if (adminState.isAdmin) {
          showToast('Welcome back, Ezekiel!');
          await loadAdminProducts();
        }
        renderAdmin(container);
      } catch (err) {
        adminState.loginError = 'An unexpected error occurred during sign in. Please try again.';
        renderAdmin(container);
      }
    };
  }

  const demoBtn = container.querySelector('#admin-launch-demo-btn');
  if (demoBtn) {
    demoBtn.onclick = (e) => {
      e.preventDefault();
      window.location.hash = '#/admin?demo=1';
    };
  }
}

/**
 * Render Unauthorized View (Logged in but not in public.admins)
 */
function renderUnauthorized() {
  return `
    <div class="admin-login-page">
      <div id="admin-toast-container"></div>
      <div class="admin-login-card">
        <div class="admin-login-header">
          <a href="#shop" class="admin-login-brand">APPAREL BY EZEKIEL</a>
          <div class="admin-unauth-icon">${ADMIN_ICONS.alert}</div>
          <h1 class="admin-login-title">Access Restricted</h1>
          <p class="admin-login-subtitle" style="color: #b91c1c; font-weight: 500;">
            This account isn't set up as the owner.
          </p>
        </div>

        <p class="admin-unauth-note">
          You are signed in as <strong>${escapeHtml(adminState.user?.email || 'authenticated user')}</strong>, but this user ID is not registered in the owners list (<code>public.admins</code> table).
        </p>

        <div class="admin-unauth-actions">
          <button type="button" class="admin-btn admin-btn-primary admin-btn-block" id="admin-signout-unauth-btn">
            Sign Out
          </button>
          <a href="#shop" class="admin-link-secondary" style="display: block; text-align: center; margin-top: 14px;">
            ${ADMIN_ICONS.arrowLeft} Back to Storefront
          </a>
        </div>
      </div>
    </div>
  `;
}

function bindUnauthorizedEvents(container) {
  const signoutBtn = container.querySelector('#admin-signout-unauth-btn');
  if (signoutBtn) {
    signoutBtn.onclick = async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      adminState.user = null;
      adminState.isAdmin = false;
      renderAdmin(container);
    };
  }
}

/**
 * Render Product List Dashboard
 */
function renderGarmentsCatalogView(totalCount, publishedCount, draftCount, filtered) {
  return `
    <!-- Dashboard Header & Metrics -->
    <div class="admin-header-row">
      <div>
        <h1 class="admin-page-title">Garments Catalog</h1>
        <p class="admin-page-subtitle">
          Manage luxury bespoke pieces, upload high-res photos, and update prices.
        </p>
      </div>

      <button type="button" class="admin-btn admin-btn-primary" id="admin-add-product-btn">
        ${ADMIN_ICONS.plus} Add New Garment
      </button>
    </div>

    <!-- Metric Stat Cards -->
    <div class="admin-stats-grid">
      <div class="admin-stat-card">
        <span class="admin-stat-label">Total Pieces</span>
        <span class="admin-stat-value">${totalCount}</span>
      </div>
      <div class="admin-stat-card">
        <span class="admin-stat-label">Published in Store</span>
        <span class="admin-stat-value admin-stat-highlight">${publishedCount}</span>
      </div>
      <div class="admin-stat-card">
        <span class="admin-stat-label">Drafts (Hidden)</span>
        <span class="admin-stat-value">${draftCount}</span>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="admin-toolbar">
      <div class="admin-search-wrap">
        <span class="admin-search-icon">${ADMIN_ICONS.search}</span>
        <input
          type="search"
          id="admin-search-input"
          class="admin-search-input"
          placeholder="Search garments by name or category..."
          value="${escapeHtml(adminState.searchQuery)}"
        />
        ${
          adminState.searchQuery
            ? `<button type="button" class="admin-search-clear" id="admin-clear-search-btn" aria-label="Clear search">${ADMIN_ICONS.close}</button>`
            : ''
        }
      </div>

      <div class="admin-category-pills">
        ${['All', ...CATEGORIES].map(
          (cat) => `
          <button
            type="button"
            class="admin-pill ${adminState.categoryFilter === cat ? 'active' : ''}"
            data-category="${escapeHtml(cat)}"
          >
            ${escapeHtml(cat)}
          </button>
        `
        ).join('')}
      </div>
    </div>

    <!-- Products List Grid -->
    <section class="admin-products-section">
      ${
        filtered.length === 0
          ? `
        <div class="admin-empty-card">
          <h3>No garments found</h3>
          <p>We couldn't find any piece matching your current filter.</p>
          <button type="button" class="admin-btn admin-btn-primary" id="admin-empty-add-btn">
            ${ADMIN_ICONS.plus} Add Your First Garment
          </button>
        </div>
      `
          : `
        <div class="admin-products-grid">
          ${filtered.map((product) => renderProductCard(product)).join('')}
        </div>
      `
      }
    </section>
  `;
}

function renderAdminOrderCard(order) {
  const status = (order.status || 'pending').toLowerCase();
  let badgeClass = 'admin-badge-pending';
  let badgeText = 'Pending Verification';
  if (status === 'paid') {
    badgeClass = 'admin-badge-paid';
    badgeText = 'Paid via OPay';
  } else if (status === 'failed') {
    badgeClass = 'admin-badge-failed';
    badgeText = 'Payment Incomplete';
  }

  const amountNaira = order.amount > 100000 ? koboToNaira(order.amount) : order.amount;
  const formattedAmount = formatPrice(amountNaira);

  // Measurements
  const measurements = order.measurements || {};
  const unit = measurements.unit || 'in';
  const measurementKeys = [
    { key: 'chest', label: 'Chest' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'sleeve', label: 'Sleeve' },
    { key: 'neck', label: 'Neck' },
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'trouserLength', label: 'Trouser' },
    { key: 'kaftanLength', label: 'Top Length' },
    { key: 'height', label: 'Height' }
  ];

  const populatedMeasurements = measurementKeys
    .filter((m) => measurements[m.key] != null && String(measurements[m.key]).trim() !== '')
    .map((m) => `${m.label}: ${measurements[m.key]}${m.key === 'height' && String(measurements[m.key]).includes('ft') ? '' : unit}`);

  const phoneClean = String(order.customer_phone || '').replace(/\D/g, '');
  const waLink = phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hello ${order.customer_name || 'Client'}, regarding your Apparel by Ezekiel order (${order.reference}) for ${order.product_name}...`)}`
    : null;

  return `
    <div class="admin-order-card" data-order-id="${escapeHtml(order.id || order.reference)}">
      <!-- Order Card Top Row: Ref & Status -->
      <div class="admin-order-header">
        <div class="admin-order-ref-group">
          <span class="admin-order-ref">${escapeHtml(order.reference)}</span>
          <span class="admin-order-date">${order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
        </div>
        <div class="admin-order-badges">
          <span class="admin-badge ${badgeClass}">${badgeText}</span>
        </div>
      </div>

      <!-- Garment & Amount Row -->
      <div class="admin-order-product-row">
        <div class="admin-order-prod-info">
          <h3 class="admin-order-prod-name">${escapeHtml(order.product_name)}</h3>
          <div class="admin-order-prod-meta">
            <span class="admin-order-size-badge">Size: <strong>${escapeHtml(order.size || 'M')}</strong></span>
            ${order.making_days ? `<span class="admin-order-turnaround">Turnaround: ${escapeHtml(order.making_days)} days</span>` : ''}
          </div>
        </div>
        <div class="admin-order-price-box">
          <span class="admin-order-price">${escapeHtml(formattedAmount)}</span>
        </div>
      </div>

      <!-- Customer Details Row -->
      <div class="admin-order-customer-box">
        <div class="admin-order-customer-info">
          <div class="admin-order-customer-name">
            <strong>${escapeHtml(order.customer_name || 'Anonymous Client')}</strong>
          </div>
          <div class="admin-order-customer-contact">
            <span class="admin-order-phone">${escapeHtml(order.customer_phone || '—')}</span>
            ${order.customer_email ? `<span class="admin-order-email">• ${escapeHtml(order.customer_email)}</span>` : ''}
          </div>
        </div>
        ${
          waLink
            ? `
          <a
            href="${waLink}"
            target="_blank"
            rel="noopener noreferrer"
            class="admin-order-wa-btn"
            title="Chat with client on WhatsApp"
            aria-label="Message ${escapeHtml(order.customer_name)} on WhatsApp"
          >
            ${ADMIN_ICONS.whatsapp}
            <span>WhatsApp</span>
          </a>
        `
            : ''
        }
      </div>

      <!-- Expected Ready Date Box -->
      <div class="admin-order-schedule-box">
        <span class="admin-order-schedule-icon">${ADMIN_ICONS.calendar}</span>
        <div class="admin-order-schedule-text">
          <span class="admin-order-schedule-label">Expected Ready Date:</span>
          <strong>${order.expected_ready_date ? escapeHtml(formatExpectedReadyDate(order.expected_ready_date)) : (order.making_days ? `In about ${order.making_days} days` : 'To be confirmed')}</strong>
        </div>
      </div>

      <!-- Measurements Section -->
      <div class="admin-order-measurements-box">
        <div class="admin-order-measurements-label">
          <span>Client Measurements:</span>
          <span class="admin-order-unit-pill">${escapeHtml(unit)}</span>
        </div>
        ${
          populatedMeasurements.length > 0
            ? `
          <div class="admin-order-measurements-pills">
            ${populatedMeasurements.map((m) => `<span class="admin-order-measure-pill">${escapeHtml(m)}</span>`).join('')}
          </div>
        `
            : `
          <p class="admin-order-no-measure">Standard sizing block (custom measurements skipped by client).</p>
        `
        }
      </div>
    </div>
  `;
}

function renderAdminOrdersView() {
  const allOrders = adminState.orders || [];
  const statusFilter = adminState.ordersFilterStatus || 'All';
  const query = (adminState.ordersSearchQuery || '').toLowerCase().trim();

  const filteredOrders = allOrders.filter((ord) => {
    const matchesStatus =
      statusFilter === 'All' ||
      String(ord.status).toLowerCase() === statusFilter.toLowerCase();

    if (!matchesStatus) return false;
    if (!query) return true;

    const ref = (ord.reference || '').toLowerCase();
    const customer = (ord.customer_name || '').toLowerCase();
    const phone = (ord.customer_phone || '').toLowerCase();
    const prod = (ord.product_name || '').toLowerCase();

    return ref.includes(query) || customer.includes(query) || phone.includes(query) || prod.includes(query);
  });

  const totalOrders = allOrders.length;
  const paidOrders = allOrders.filter((o) => String(o.status).toLowerCase() === 'paid').length;
  const pendingOrders = allOrders.filter((o) => String(o.status).toLowerCase() === 'pending').length;

  return `
    <!-- Orders Header & Summary -->
    <div class="admin-header-row">
      <div>
        <h1 class="admin-page-title">Client Commissions & Orders</h1>
        <p class="admin-page-subtitle">
          Track OPay cashier payments, client body measurements, and tailoring turnaround schedules.
        </p>
      </div>
    </div>

    <!-- Metric Stat Cards for Orders -->
    <div class="admin-stats-grid">
      <div class="admin-stat-card">
        <span class="admin-stat-label">Total Commissions</span>
        <span class="admin-stat-value">${totalOrders}</span>
      </div>
      <div class="admin-stat-card">
        <span class="admin-stat-label">Paid via OPay</span>
        <span class="admin-stat-value admin-stat-highlight">${paidOrders}</span>
      </div>
      <div class="admin-stat-card">
        <span class="admin-stat-label">Pending Verification</span>
        <span class="admin-stat-value">${pendingOrders}</span>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="admin-toolbar">
      <div class="admin-search-wrap">
        <span class="admin-search-icon">${ADMIN_ICONS.search}</span>
        <input
          type="search"
          id="admin-orders-search-input"
          class="admin-search-input"
          placeholder="Search orders by client name, ref, phone, garment..."
          value="${escapeHtml(adminState.ordersSearchQuery)}"
        />
        ${
          adminState.ordersSearchQuery
            ? `<button type="button" class="admin-search-clear" id="admin-orders-clear-search-btn" aria-label="Clear order search">${ADMIN_ICONS.close}</button>`
            : ''
        }
      </div>

      <div class="admin-category-pills">
        ${['All', 'Paid', 'Pending', 'Failed'].map(
          (status) => `
          <button
            type="button"
            class="admin-pill ${adminState.ordersFilterStatus.toLowerCase() === status.toLowerCase() ? 'active' : ''}"
            data-order-status="${escapeHtml(status)}"
          >
            ${escapeHtml(status)}
          </button>
        `
        ).join('')}
      </div>
    </div>

    <!-- Orders Cards List -->
    <section class="admin-orders-section">
      ${
        filteredOrders.length === 0
          ? `
        <div class="admin-empty-card">
          <h3>No orders match your filter</h3>
          <p>Try searching for a different client name or clear the status filter.</p>
        </div>
      `
          : `
        <div class="admin-orders-grid">
          ${filteredOrders.map((order) => renderAdminOrderCard(order)).join('')}
        </div>
      `
      }
    </section>
  `;
}

function renderProductList() {
  const filtered = adminState.products.filter((p) => {
    const matchesCategory =
      adminState.categoryFilter === 'All' ||
      p.category.toLowerCase() === adminState.categoryFilter.toLowerCase();

    if (!matchesCategory) return false;

    const q = adminState.searchQuery.trim().toLowerCase();
    if (!q) return true;

    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  const totalCount = adminState.products.length;
  const publishedCount = adminState.products.filter((p) => p.is_published).length;
  const draftCount = totalCount - publishedCount;
  const pendingOrdersCount = (adminState.orders || []).filter((o) => String(o.status).toLowerCase() === 'pending').length;

  return `
    <div class="admin-dashboard">
      <div id="admin-toast-container"></div>

      <!-- Admin Top Bar -->
      <header class="admin-top-bar">
        <div class="admin-top-bar-inner">
          <div class="admin-brand-group">
            <span class="admin-brand-title">APPAREL BY EZEKIEL</span>
            <span class="admin-badge">Owner Admin</span>
            ${
              adminState.isDemoMode
                ? `<span class="admin-badge admin-badge-demo" title="Dev only preview with local state">Demo Mode</span>`
                : ''
            }
          </div>

          <div class="admin-top-actions">
            <a href="#shop" class="admin-btn-outline admin-btn-sm" title="View customer storefront">
              View Store
            </a>
            <button type="button" class="admin-btn-secondary admin-btn-sm" id="admin-signout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Dashboard Content -->
      <main class="admin-main-container">
        <!-- Admin Navigation Tabs: Garments vs Orders -->
        <div class="admin-tab-nav" role="tablist" aria-label="Admin Navigation">
          <button
            type="button"
            role="tab"
            class="admin-tab-btn ${adminState.activeTab === 'garments' ? 'active' : ''}"
            id="admin-tab-btn-garments"
            aria-selected="${adminState.activeTab === 'garments'}"
          >
            ${ADMIN_ICONS.scissors}
            <span>Garments (${adminState.products.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            class="admin-tab-btn ${adminState.activeTab === 'orders' ? 'active' : ''}"
            id="admin-tab-btn-orders"
            aria-selected="${adminState.activeTab === 'orders'}"
          >
            ${ADMIN_ICONS.orders}
            <span>Orders (${adminState.orders.length})</span>
            ${pendingOrdersCount > 0 ? `<span class="admin-tab-pill-badge">${pendingOrdersCount}</span>` : ''}
          </button>
        </div>

        ${adminState.activeTab === 'orders' ? renderAdminOrdersView() : renderGarmentsCatalogView(totalCount, publishedCount, draftCount, filtered)}
      </main>
    </div>
  `;
}

function renderProductCard(product) {
  const images = product.images && product.images.length > 0
    ? product.images
    : (product.image ? [product.image] : []);
  const mainImage = images[0] || 'https://placehold.co/400x533/e7e5e0/0a0a0a?text=No+Photo';
  const photoCount = images.length;

  return `
    <article class="admin-product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="admin-card-media">
        <img
          src="${escapeHtml(mainImage)}"
          alt="${escapeHtml(product.name)}"
          class="admin-card-img"
          loading="lazy"
        />
        <div class="admin-card-badges">
          <span class="admin-card-category">${escapeHtml(product.category)}</span>
          <span class="admin-card-photo-count">${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}</span>
        </div>
      </div>

      <div class="admin-card-content">
        <div class="admin-card-title-row">
          <h2 class="admin-card-title">${escapeHtml(product.name)}</h2>
          <span class="admin-card-price">${escapeHtml(formatPrice(product.price))}</span>
        </div>

        <p class="admin-card-slug">Slug: <code>${escapeHtml(product.slug || product.id)}</code></p>

        <div class="admin-card-status-row">
          <label class="admin-toggle-label" title="Toggle visibility on storefront">
            <input
              type="checkbox"
              class="admin-publish-toggle"
              data-id="${escapeHtml(product.id)}"
              ${product.is_published ? 'checked' : ''}
            />
            <span class="admin-toggle-switch"></span>
            <span class="admin-toggle-text ${product.is_published ? 'is-published' : 'is-draft'}">
              ${product.is_published ? 'Published' : 'Draft (Hidden)'}
            </span>
          </label>
        </div>

        <div class="admin-card-actions">
          <button
            type="button"
            class="admin-btn admin-btn-outline admin-card-edit-btn"
            data-edit-id="${escapeHtml(product.id)}"
          >
            ${ADMIN_ICONS.edit} Edit Details & Photos
          </button>
          <button
            type="button"
            class="admin-btn-icon-danger admin-card-delete-btn"
            data-delete-id="${escapeHtml(product.id)}"
            title="Delete Garment"
            aria-label="Delete ${escapeHtml(product.name)}"
          >
            ${ADMIN_ICONS.trash}
          </button>
        </div>
      </div>
    </article>
  `;
}

function bindProductListEvents(container) {
  // Navigation tabs toggle
  const garmentsTabBtn = container.querySelector('#admin-tab-btn-garments');
  const ordersTabBtn = container.querySelector('#admin-tab-btn-orders');

  if (garmentsTabBtn) {
    garmentsTabBtn.onclick = () => {
      adminState.activeTab = 'garments';
      renderAdmin(container);
    };
  }

  if (ordersTabBtn) {
    ordersTabBtn.onclick = () => {
      adminState.activeTab = 'orders';
      renderAdmin(container);
    };
  }

  // Orders tab search input
  const ordersSearchInput = container.querySelector('#admin-orders-search-input');
  if (ordersSearchInput) {
    ordersSearchInput.oninput = (e) => {
      adminState.ordersSearchQuery = e.target.value;
      renderAdmin(container);
      const updated = container.querySelector('#admin-orders-search-input');
      if (updated) {
        updated.focus();
        updated.setSelectionRange(updated.value.length, updated.value.length);
      }
    };
  }

  const clearOrdersSearchBtn = container.querySelector('#admin-orders-clear-search-btn');
  if (clearOrdersSearchBtn) {
    clearOrdersSearchBtn.onclick = () => {
      adminState.ordersSearchQuery = '';
      renderAdmin(container);
    };
  }

  // Orders status filter pills
  const orderStatusPills = container.querySelectorAll('[data-order-status]');
  orderStatusPills.forEach((pill) => {
    pill.onclick = () => {
      adminState.ordersFilterStatus = pill.dataset.orderStatus;
      renderAdmin(container);
    };
  });

  // Sign out button
  const signoutBtn = container.querySelector('#admin-signout-btn');
  if (signoutBtn) {
    signoutBtn.onclick = async () => {
      if (adminState.isDemoMode) {
        window.location.hash = '#/admin';
        return;
      }
      if (supabase) {
        await supabase.auth.signOut();
      }
      adminState.user = null;
      adminState.isAdmin = false;
      renderAdmin(container);
    };
  }

  // Add product button
  const addBtn = container.querySelector('#admin-add-product-btn');
  const emptyAddBtn = container.querySelector('#admin-empty-add-btn');
  const onAddClick = () => {
    adminState.editingProduct = {
      id: null,
      slug: '',
      name: '',
      category: 'Kaftans',
      price: 120000,
      making_days: 14,
      description: '',
      details: '',
      sizes: ['S', 'M', 'L', 'XL', 'XXL', 'Custom'],
      images: [],
      is_published: true,
      sort_order: (adminState.products.length + 1) * 10
    };
    adminState.view = 'add';
    renderAdmin(container);
    window.scrollTo(0, 0);
  };
  if (addBtn) addBtn.onclick = onAddClick;
  if (emptyAddBtn) emptyAddBtn.onclick = onAddClick;

  // Search input
  const searchInput = container.querySelector('#admin-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      adminState.searchQuery = e.target.value;
      renderAdmin(container);
      const updated = container.querySelector('#admin-search-input');
      if (updated) {
        updated.focus();
        updated.setSelectionRange(updated.value.length, updated.value.length);
      }
    };
  }

  // Clear search
  const clearSearchBtn = container.querySelector('#admin-clear-search-btn');
  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      adminState.searchQuery = '';
      renderAdmin(container);
    };
  }

  // Category filter pills
  const pills = container.querySelectorAll('.admin-pill');
  pills.forEach((pill) => {
    pill.onclick = () => {
      adminState.categoryFilter = pill.dataset.category;
      renderAdmin(container);
    };
  });

  // Edit product buttons
  const editBtns = container.querySelectorAll('.admin-card-edit-btn');
  editBtns.forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.editId;
      const target = adminState.products.find((p) => p.id === id);
      if (target) {
        // Deep copy
        adminState.editingProduct = JSON.parse(JSON.stringify(target));
        adminState.view = 'edit';
        renderAdmin(container);
        window.scrollTo(0, 0);
      }
    };
  });

  // Delete product buttons
  const deleteBtns = container.querySelectorAll('.admin-card-delete-btn');
  deleteBtns.forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.deleteId;
      const target = adminState.products.find((p) => p.id === id);
      if (target) {
        adminState.deleteConfirmProduct = target;
        renderConfirmModal(container);
      }
    };
  });

  // Published toggle switch
  const toggles = container.querySelectorAll('.admin-publish-toggle');
  toggles.forEach((toggle) => {
    toggle.onchange = async () => {
      const id = toggle.dataset.id;
      const isPublished = toggle.checked;
      const prod = adminState.products.find((p) => p.id === id);
      if (prod) {
        prod.is_published = isPublished;
      }

      if (adminState.isDemoMode) {
        showToast(`Updated "${prod?.name || 'Garment'}": ${isPublished ? 'Published' : 'Hidden as Draft'}`);
        renderAdmin(container);
        return;
      }

      const { success, error } = await toggleProductPublished(id, isPublished);
      if (success) {
        showToast(`Updated "${prod?.name || 'Garment'}": ${isPublished ? 'Published' : 'Hidden as Draft'}`);
      } else {
        showToast(error?.message || 'Failed to update visibility', 'error');
        // revert in memory
        if (prod) prod.is_published = !isPublished;
      }
      renderAdmin(container);
    };
  });
}

/**
 * Render Product Form (Add / Edit)
 */
function renderProductForm() {
  const p = adminState.editingProduct;
  if (!p) return '';

  const isEdit = adminState.view === 'edit';
  const title = isEdit ? `Edit Garment: ${p.name || 'Untitled'}` : 'Add New Garment';
  const images = Array.isArray(p.images) ? p.images : [];
  const previewSlug = p.slug || generateSlug(p.name);
  const formattedPricePreview = formatPrice(p.price);

  return `
    <div class="admin-dashboard">
      <div id="admin-toast-container"></div>

      <!-- Top Bar -->
      <header class="admin-top-bar">
        <div class="admin-top-bar-inner">
          <div class="admin-brand-group">
            <button type="button" class="admin-btn-back" id="admin-form-back-btn" aria-label="Back to Garments">
              ${ADMIN_ICONS.arrowLeft} Back
            </button>
            <span class="admin-form-header-title">${escapeHtml(title)}</span>
          </div>

          <div class="admin-top-actions">
            <button type="button" class="admin-btn-secondary admin-btn-sm" id="admin-form-cancel-btn">
              Cancel
            </button>
            <button type="button" class="admin-btn admin-btn-primary admin-btn-sm" id="admin-form-save-top-btn" ${adminState.isSaving ? 'disabled' : ''}>
              ${adminState.isSaving ? 'Saving...' : 'Save Garment'}
            </button>
          </div>
        </div>
      </header>

      <main class="admin-main-container">
        <form id="admin-product-form" class="admin-product-form" novalidate>
          <div class="admin-form-layout">
            <!-- Left Column: Garment Information & Pricing -->
            <div class="admin-form-col">
              <div class="admin-form-section">
                <h2 class="admin-form-section-title">Garment Details</h2>

                <div class="admin-field">
                  <label for="form-product-name" class="admin-label">
                    Garment Name <span class="admin-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="form-product-name"
                    class="admin-input"
                    placeholder="e.g. Kaftan 010 – Royal Sand"
                    value="${escapeHtml(p.name)}"
                    required
                  />
                  <div class="admin-slug-preview">
                    Storefront URL: <code>#product/<span id="slug-preview-text">${escapeHtml(previewSlug)}</span></code>
                    ${isEdit ? `<button type="button" class="admin-slug-regen-btn" id="admin-regen-slug-btn" title="Update URL slug from garment name">Update Slug</button>` : ''}
                  </div>
                  <span class="admin-field-tip">Stable URL for WhatsApp ordering and returning clients.</span>
                </div>

                <div class="admin-form-row-2">
                  <div class="admin-field">
                    <label for="form-product-category" class="admin-label">
                      Category <span class="admin-required">*</span>
                    </label>
                    <select id="form-product-category" class="admin-select">
                      ${CATEGORIES.map(
                        (cat) => `
                        <option value="${escapeHtml(cat)}" ${p.category === cat ? 'selected' : ''}>
                          ${escapeHtml(cat)}
                        </option>
                      `
                      ).join('')}
                    </select>
                  </div>

                  <div class="admin-field">
                    <div class="admin-label-row">
                      <label for="form-product-price" class="admin-label">
                        Price in Naira (₦) <span class="admin-required">*</span>
                      </label>
                      <span class="admin-price-pill" id="price-preview-badge">${escapeHtml(formattedPricePreview)}</span>
                    </div>
                    <div class="admin-price-input-wrap">
                      <span class="admin-currency-prefix">₦</span>
                      <input
                        type="text"
                        inputmode="numeric"
                        id="form-product-price"
                        class="admin-input admin-input-prefixed"
                        placeholder="e.g. 120000"
                        value="${escapeHtml(p.price || '')}"
                        required
                      />
                    </div>
                    <span class="admin-field-tip">Enter numbers only (e.g. 120000). Currency symbol and formatting are applied automatically.</span>
                  </div>
                </div>

                <div class="admin-field">
                  <div class="admin-label-row">
                    <label for="form-product-making-days" class="admin-label">
                      Days to make <span class="admin-optional-badge">(1–90)</span>
                    </label>
                    <span class="admin-days-preview" id="days-preview-badge">
                      ${p.making_days ? `Ready in ~${p.making_days} days` : 'Not specified'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    step="1"
                    id="form-product-making-days"
                    class="admin-input"
                    placeholder="e.g. 14 (turnaround in days)"
                    value="${p.making_days != null ? escapeHtml(p.making_days) : ''}"
                  />
                  <span class="admin-field-tip">Estimated tailoring turnaround (1–90 days). Shown to customers as "Ready in about N days". Leave empty if turnaround varies.</span>
                </div>

                <div class="admin-field">
                  <label for="form-product-desc" class="admin-label">
                    Short Description <span class="admin-required">*</span>
                  </label>
                  <textarea
                    id="form-product-desc"
                    class="admin-textarea"
                    rows="3"
                    placeholder="Brief description for shop cards and search..."
                  >${escapeHtml(p.description)}</textarea>
                  <span class="admin-field-tip">Shown under the title in collection cards.</span>
                </div>

                <div class="admin-field">
                  <label for="form-product-details" class="admin-label">
                    Tailoring & Fabric Specifications
                  </label>
                  <textarea
                    id="form-product-details"
                    class="admin-textarea"
                    rows="5"
                    placeholder="Fabric origin, weave, buttons, embroidery, occasion recommendations..."
                  >${escapeHtml(p.details)}</textarea>
                  <span class="admin-field-tip">Displayed on the full garment detail page for bespoke tailoring inquiries.</span>
                </div>
              </div>

              <!-- Storefront Visibility & Sizes -->
              <div class="admin-form-section">
                <h2 class="admin-form-section-title">Storefront Options</h2>

                <div class="admin-field">
                  <label class="admin-label">Available Sizes</label>
                  <p class="admin-field-tip" style="margin-bottom: 8px;">
                    Tap pills to toggle which sizes Ezekiel accepts for this piece:
                  </p>
                  <div class="admin-size-pills-row" id="form-size-pills">
                    ${ALL_SIZES.map((sz) => {
                      const isActive = (p.sizes || []).includes(sz);
                      return `
                        <button
                          type="button"
                          class="admin-size-pill ${isActive ? 'active' : ''}"
                          data-size="${escapeHtml(sz)}"
                          aria-pressed="${isActive}"
                        >
                          ${isActive ? ADMIN_ICONS.check : ''} ${escapeHtml(sz)}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div class="admin-field admin-field-bordered">
                  <label class="admin-toggle-label">
                    <input
                      type="checkbox"
                      id="form-product-published"
                      ${p.is_published ? 'checked' : ''}
                    />
                    <span class="admin-toggle-switch"></span>
                    <div>
                      <strong class="admin-toggle-heading">Publish to Storefront</strong>
                      <p class="admin-toggle-subtext">
                        When enabled, customers can view this piece in the catalog and order via WhatsApp.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              ${
                isEdit
                  ? `
                <div class="admin-danger-section">
                  <div class="admin-danger-info">
                    <strong class="admin-danger-title">Delete this garment</strong>
                    <p class="admin-danger-desc">
                      Permanently remove <em>${escapeHtml(p.name)}</em> and its gallery from your storefront.
                    </p>
                  </div>
                  <button type="button" class="admin-btn-danger-outline" id="admin-form-delete-btn">
                    ${ADMIN_ICONS.trash} Delete Garment
                  </button>
                </div>
              `
                  : ''
              }
            </div>

            <!-- Right Column: Photography Gallery -->
            <div class="admin-form-col">
              <div class="admin-form-section">
                <div class="admin-section-header-row">
                  <h2 class="admin-form-section-title">Product Photography</h2>
                  <span class="admin-photo-count-badge">${images.length} ${images.length === 1 ? 'photo' : 'photos'}</span>
                </div>

                <!-- Photo Tips Callout -->
                <div class="admin-photo-tips-callout">
                  <strong>Photo guidelines for Ezekiel:</strong>
                  <ul>
                    <li>The <strong>first photo (★ Main)</strong> is your primary catalog thumbnail.</li>
                    <li>Photos are auto-compressed to WebP/JPEG under 500KB before uploading.</li>
                    <li>Use <code>Move Left / Right</code> to rearrange order.</li>
                  </ul>
                </div>

                <!-- Upload Dropzone -->
                <div class="admin-dropzone" id="admin-photo-dropzone">
                  <input
                    type="file"
                    id="admin-photo-file-input"
                    class="admin-file-input"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                  />
                  <div class="admin-dropzone-content">
                    <div class="admin-dropzone-icon">${ADMIN_ICONS.upload}</div>
                    <strong class="admin-dropzone-text">Tap or drop photos to upload</strong>
                    <span class="admin-dropzone-subtext">JPEG, PNG, or WebP (max 5MB each, multiple allowed)</span>
                  </div>
                </div>

                ${
                  adminState.isUploading
                    ? `
                  <div class="admin-upload-progress">
                    <div class="admin-spinner admin-spinner-sm" aria-hidden="true"></div>
                    <span>${escapeHtml(adminState.uploadMessage || 'Processing images...')}</span>
                  </div>
                `
                    : ''
                }

                <!-- Photos Gallery List -->
                <div class="admin-photo-gallery" id="admin-photo-gallery">
                  ${
                    images.length === 0
                      ? `
                    <div class="admin-no-photos">
                      <p>No photos attached to this garment yet. Upload at least one photo for customer orders.</p>
                    </div>
                  `
                      : images
                          .map((imgUrl, index) => {
                            const isFirst = index === 0;
                            const isLast = index === images.length - 1;
                            return `
                        <div class="admin-photo-card ${isFirst ? 'is-main-photo' : ''}" data-index="${index}">
                          <div class="admin-photo-thumb-wrap">
                            <img src="${escapeHtml(imgUrl)}" alt="Product photo ${index + 1}" class="admin-photo-thumb" />
                            ${
                              isFirst
                                ? `<span class="admin-main-badge">${ADMIN_ICONS.star} Main</span>`
                                : `<span class="admin-order-badge">#${index + 1}</span>`
                            }
                          </div>

                          <div class="admin-photo-meta">
                            <div class="admin-photo-meta-header">
                              <span class="admin-photo-meta-title">${isFirst ? '★ Main Hero Thumbnail' : `Gallery Photo #${index + 1}`}</span>
                              <span class="admin-photo-opt-badge">WebP • Mobile Ready</span>
                            </div>
                            <span class="admin-photo-meta-sub">${isFirst ? 'Shown in catalog grid and WhatsApp orders' : 'Shown in detail gallery'}</span>
                          </div>

                          <div class="admin-photo-controls">
                            <button
                              type="button"
                              class="admin-photo-btn admin-photo-move-left"
                              data-index="${index}"
                              ${isFirst ? 'disabled' : ''}
                              title="Move photo left"
                              aria-label="Move photo ${index + 1} left"
                            >
                              ${ADMIN_ICONS.arrowLeft}
                            </button>
                            <button
                              type="button"
                              class="admin-photo-btn admin-photo-move-right"
                              data-index="${index}"
                              ${isLast ? 'disabled' : ''}
                              title="Move photo right"
                              aria-label="Move photo ${index + 1} right"
                            >
                              ${ADMIN_ICONS.arrowRight}
                            </button>
                            <button
                              type="button"
                              class="admin-photo-btn-danger admin-photo-remove"
                              data-index="${index}"
                              title="Remove photo"
                              aria-label="Remove photo ${index + 1}"
                            >
                              ${ADMIN_ICONS.trash}
                            </button>
                          </div>
                        </div>
                      `;
                          })
                          .join('')
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="admin-form-actions-bar">
            <div class="admin-form-actions-left">
              <span class="admin-actions-hint">Changes will be saved to your catalog and storefront.</span>
            </div>

            <div class="admin-form-actions-right">
              <button type="button" class="admin-btn-secondary" id="admin-form-cancel-bottom-btn">
                Cancel
              </button>
              <button type="submit" class="admin-btn admin-btn-primary" id="admin-form-save-btn" ${adminState.isSaving ? 'disabled' : ''}>
                ${adminState.isSaving ? 'Saving Garment...' : 'Save Garment'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  `;
}

function bindProductFormEvents(container) {
  const p = adminState.editingProduct;
  if (!p) return;

  // Back button
  const backBtn = container.querySelector('#admin-form-back-btn');
  const cancelTopBtn = container.querySelector('#admin-form-cancel-btn');
  const cancelBottomBtn = container.querySelector('#admin-form-cancel-bottom-btn');

  const onCancel = () => {
    adminState.editingProduct = null;
    adminState.view = 'list';
    renderAdmin(container);
  };
  if (backBtn) backBtn.onclick = onCancel;
  if (cancelTopBtn) cancelTopBtn.onclick = onCancel;
  if (cancelBottomBtn) cancelBottomBtn.onclick = onCancel;

  // Product Name real-time slug preview
  const nameInput = container.querySelector('#form-product-name');
  const slugPreview = container.querySelector('#slug-preview-text');
  const regenSlugBtn = container.querySelector('#admin-regen-slug-btn');

  if (nameInput) {
    nameInput.oninput = (e) => {
      p.name = e.target.value;
      if (!isEdit) {
        const newSlug = generateSlug(p.name);
        p.slug = newSlug;
        if (slugPreview) slugPreview.textContent = newSlug;
      }
    };
  }

  if (regenSlugBtn) {
    regenSlugBtn.onclick = () => {
      const newSlug = generateSlug(p.name);
      p.slug = newSlug;
      if (slugPreview) slugPreview.textContent = newSlug;
      showToast(`URL slug updated to "${newSlug}"`);
    };
  }

  // Category select
  const catSelect = container.querySelector('#form-product-category');
  if (catSelect) {
    catSelect.onchange = (e) => {
      p.category = e.target.value;
    };
  }

  // Price input & formatted preview
  const priceInput = container.querySelector('#form-product-price');
  const priceBadge = container.querySelector('#price-preview-badge');
  if (priceInput) {
    priceInput.oninput = (e) => {
      const parsed = parsePrice(e.target.value);
      p.price = parsed;
      if (priceBadge) {
        priceBadge.textContent = formatPrice(parsed);
      }
    };
  }

  // Making days input & preview
  const daysInput = container.querySelector('#form-product-making-days');
  const daysBadge = container.querySelector('#days-preview-badge');
  if (daysInput) {
    daysInput.oninput = (e) => {
      const val = e.target.value.trim();
      const res = validateMakingDays(val);
      if (res.valid) {
        p.making_days = res.value;
        if (daysBadge) {
          daysBadge.classList.remove('admin-badge-invalid');
          daysBadge.textContent = res.value ? `Ready in ~${res.value} days` : 'Not specified';
        }
      } else {
        if (daysBadge) {
          daysBadge.classList.add('admin-badge-invalid');
          daysBadge.textContent = 'Invalid (1–90)';
        }
      }
    };
  }

  // Description
  const descInput = container.querySelector('#form-product-desc');
  if (descInput) {
    descInput.oninput = (e) => {
      p.description = e.target.value;
    };
  }

  // Details
  const detailsInput = container.querySelector('#form-product-details');
  if (detailsInput) {
    detailsInput.oninput = (e) => {
      p.details = e.target.value;
    };
  }

  // Published checkbox
  const pubToggle = container.querySelector('#form-product-published');
  if (pubToggle) {
    pubToggle.onchange = (e) => {
      p.is_published = e.target.checked;
    };
  }

  // Size pills toggle (in-place update to preserve scroll position)
  const sizePills = container.querySelectorAll('.admin-size-pill');
  sizePills.forEach((pill) => {
    pill.onclick = () => {
      const sz = pill.dataset.size;
      const currentSizes = new Set(p.sizes || []);
      if (currentSizes.has(sz)) {
        if (currentSizes.size === 1) {
          showToast('Garment must have at least one size available', 'error');
          return;
        }
        currentSizes.delete(sz);
        pill.classList.remove('active');
        pill.setAttribute('aria-pressed', 'false');
        pill.innerHTML = escapeHtml(sz);
      } else {
        currentSizes.add(sz);
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        pill.innerHTML = `${ADMIN_ICONS.check} ${escapeHtml(sz)}`;
      }
      p.sizes = ALL_SIZES.filter((s) => currentSizes.has(s));
    };
  });

  // Photo Dropzone and File Input
  const dropzone = container.querySelector('#admin-photo-dropzone');
  const fileInput = container.querySelector('#admin-photo-file-input');

  if (dropzone && fileInput) {
    dropzone.onclick = () => fileInput.click();

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    };

    dropzone.ondragleave = () => {
      dropzone.classList.remove('is-dragover');
    };

    dropzone.ondrop = async (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer?.files?.length) {
        await handleFilesUpload(e.dataTransfer.files);
      }
    };

    fileInput.onchange = async () => {
      if (fileInput.files?.length) {
        await handleFilesUpload(fileInput.files);
      }
    };
  }

  async function handleFilesUpload(filesList) {
    const files = Array.from(filesList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      showToast('Please select valid JPEG, PNG, or WebP images', 'error');
      return;
    }

    adminState.isUploading = true;
    adminState.uploadMessage = `Compressing ${files.length} photo${files.length === 1 ? '' : 's'}...`;
    renderAdmin(container);

    const slug = p.slug || generateSlug(p.name) || 'garment';
    const newUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      adminState.uploadMessage = `Processing photo ${i + 1} of ${files.length}...`;
      renderAdmin(container);

      try {
        const { blob, dataUrl, fileName } = await processProductImage(file, {
          maxDimension: 1600,
          targetMaxBytes: 500 * 1024
        });

        if (adminState.isDemoMode || !isSupabaseConfigured) {
          // In demo mode or offline, use data URL so preview works immediately
          newUrls.push(dataUrl);
        } else {
          adminState.uploadMessage = `Uploading photo ${i + 1} to storage...`;
          renderAdmin(container);

          const { publicUrl, error } = await uploadProductPhoto(blob, fileName, slug);
          if (error || !publicUrl) {
            console.warn('Supabase photo upload failed, using local preview:', error);
            newUrls.push(dataUrl);
          } else {
            newUrls.push(publicUrl);
          }
        }
      } catch (err) {
        console.error('Photo processing error:', err);
        showToast(`Failed to process ${file.name}`, 'error');
      }
    }

    p.images = [...(p.images || []), ...newUrls];
    adminState.isUploading = false;
    adminState.uploadMessage = '';
    showToast(`Added ${newUrls.length} photo${newUrls.length === 1 ? '' : 's'} to gallery`);
    renderAdmin(container);
  }

  // Photo Reordering (Move Left / Move Right)
  const moveLeftBtns = container.querySelectorAll('.admin-photo-move-left');
  moveLeftBtns.forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index, 10);
      if (idx > 0 && p.images && p.images[idx]) {
        const temp = p.images[idx];
        p.images[idx] = p.images[idx - 1];
        p.images[idx - 1] = temp;
        renderAdmin(container);
      }
    };
  });

  const moveRightBtns = container.querySelectorAll('.admin-photo-move-right');
  moveRightBtns.forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index, 10);
      if (p.images && idx < p.images.length - 1) {
        const temp = p.images[idx];
        p.images[idx] = p.images[idx + 1];
        p.images[idx + 1] = temp;
        renderAdmin(container);
      }
    };
  });

  // Remove Photo
  const removePhotoBtns = container.querySelectorAll('.admin-photo-remove');
  removePhotoBtns.forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index, 10);
      if (p.images && p.images[idx]) {
        p.images.splice(idx, 1);
        renderAdmin(container);
        showToast('Photo removed');
      }
    };
  });

  // Delete product button (from edit form)
  const deleteBtn = container.querySelector('#admin-form-delete-btn');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      adminState.deleteConfirmProduct = p;
      renderConfirmModal(container);
    };
  }

  // Form Submission
  const form = container.querySelector('#admin-product-form');
  const saveTopBtn = container.querySelector('#admin-form-save-top-btn');

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // Validation
    const name = (p.name || '').trim();
    if (!name) {
      showToast('Please enter a garment name', 'error');
      nameInput?.focus();
      return;
    }

    if (!p.price || p.price <= 0) {
      showToast('Please enter a valid price in Naira', 'error');
      priceInput?.focus();
      return;
    }

    const daysRes = validateMakingDays(p.making_days);
    if (!daysRes.valid) {
      showToast(daysRes.error || 'Days to make must be an integer between 1 and 90', 'error');
      daysInput?.focus();
      return;
    }
    p.making_days = daysRes.value;

    adminState.isSaving = true;
    renderAdmin(container);

    p.name = name;
    p.slug = p.slug || generateSlug(name);
    p.sizes = p.sizes && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL', 'XXL', 'Custom'];
    p.images = p.images || [];

    if (adminState.isDemoMode) {
      // In demo mode, update local products
      if (!p.id) {
        p.id = `demo-${Date.now()}`;
        adminState.products.unshift(normalizeProduct(p));
      } else {
        const idx = adminState.products.findIndex((item) => item.id === p.id);
        if (idx !== -1) {
          adminState.products[idx] = normalizeProduct(p);
        } else {
          adminState.products.unshift(normalizeProduct(p));
        }
      }

      adminState.isSaving = false;
      adminState.editingProduct = null;
      adminState.view = 'list';
      showToast(`Garment "${p.name}" saved successfully`);
      renderAdmin(container);
      return;
    }

    // Save to Supabase
    const { product: savedProduct, error } = await upsertProduct(p);

    adminState.isSaving = false;

    if (error || !savedProduct) {
      showToast(error?.message || 'Failed to save garment to database', 'error');
      renderAdmin(container);
      return;
    }

    // Update in-memory list
    const existingIndex = adminState.products.findIndex((item) => item.id === savedProduct.id);
    if (existingIndex !== -1) {
      adminState.products[existingIndex] = savedProduct;
    } else {
      adminState.products.unshift(savedProduct);
    }

    adminState.editingProduct = null;
    adminState.view = 'list';
    showToast(`Garment "${savedProduct.name}" saved successfully`);
    renderAdmin(container);
  };

  if (form) form.onsubmit = handleSave;
  if (saveTopBtn) saveTopBtn.onclick = handleSave;
}

/**
 * In-Page Delete Confirmation Dialog (No window.confirm or alert)
 */
function renderConfirmModal(container) {
  let modalWrap = container.querySelector('#admin-modal-wrap');
  if (!adminState.deleteConfirmProduct) {
    if (modalWrap) modalWrap.remove();
    return;
  }

  const p = adminState.deleteConfirmProduct;

  if (!modalWrap) {
    modalWrap = document.createElement('div');
    modalWrap.id = 'admin-modal-wrap';
    container.appendChild(modalWrap);
  }

  modalWrap.innerHTML = `
    <div class="admin-modal-backdrop" id="admin-modal-backdrop">
      <div class="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
        <div class="admin-modal-icon">${ADMIN_ICONS.alert}</div>
        
        <h2 class="admin-modal-title" id="admin-dialog-title">Delete Garment?</h2>
        
        <p class="admin-modal-text">
          Are you sure you want to permanently delete <strong>${escapeHtml(p.name)}</strong>?
        </p>
        <p class="admin-modal-warning">
          This piece will be removed from your catalog and will no longer appear on your storefront. This action cannot be undone.
        </p>

        <div class="admin-modal-actions">
          <button type="button" class="admin-btn-secondary" id="admin-confirm-cancel-btn">
            Cancel
          </button>
          <button type="button" class="admin-btn admin-btn-danger" id="admin-confirm-delete-btn">
            Yes, Delete Garment
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.style.overflow = 'hidden';

  const cancelBtn = modalWrap.querySelector('#admin-confirm-cancel-btn');
  const backdrop = modalWrap.querySelector('#admin-modal-backdrop');
  const deleteBtn = modalWrap.querySelector('#admin-confirm-delete-btn');

  const closeModal = () => {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', handleKeyDown);
    adminState.deleteConfirmProduct = null;
    modalWrap.remove();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  if (cancelBtn) cancelBtn.onclick = closeModal;
  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e.target === backdrop) closeModal();
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const targetId = p.id;
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';

      if (adminState.isDemoMode) {
        adminState.products = adminState.products.filter((item) => item.id !== targetId);
        showToast(`Deleted "${p.name}"`);
        closeModal();
        if (adminState.view === 'edit') adminState.view = 'list';
        renderAdmin(container);
        return;
      }

      const { success, error } = await deleteProduct(targetId);
      if (success) {
        adminState.products = adminState.products.filter((item) => item.id !== targetId);
        showToast(`Deleted "${p.name}"`);
        closeModal();
        if (adminState.view === 'edit') adminState.view = 'list';
      } else {
        showToast(error?.message || 'Failed to delete garment', 'error');
        closeModal();
      }
      renderAdmin(container);
    };
  }
}
