/**
 * Format a number as Nigerian Naira (e.g. 120000 -> ₦120,000)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return '₦0';
  return `₦${Math.round(num).toLocaleString('en-US')}`;
}

/**
 * Build WhatsApp order link with prefilled order details
 * @param {string} phone e.g. "2347065086445"
 * @param {{ product: string, size?: string, price?: number|string }} details
 * @returns {string}
 */
export function buildWhatsAppUrl(phone = '2347065086445', { product, size = 'M', price } = {}) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const priceText = price != null ? formatPrice(price) : '';
  const parts = [`Hello Apparel by Ezekiel, I want to order the ${product || 'garment'}`];
  if (size) {
    parts.push(`(Size: ${size})`);
  }
  if (priceText) {
    parts.push(`for ${priceText}`);
  }
  const message = `${parts.join(' ')}.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Filter product array by category and search keyword
 * @param {Array} products
 * @param {{ category?: string, search?: string }} filters
 * @returns {Array}
 */
export function filterProducts(products = [], { category = 'All', search = '' } = {}) {
  const q = (search || '').trim().toLowerCase();
  const cat = (category || 'All').trim();

  return products.filter((p) => {
    const matchesCategory =
      !cat || cat === 'All' || p.category.toLowerCase() === cat.toLowerCase();

    if (!matchesCategory) return false;
    if (!q) return true;

    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const catMatch = (p.category || '').toLowerCase().includes(q);
    const descMatch = (p.description || '').toLowerCase().includes(q);

    return nameMatch || catMatch || descMatch;
  });
}

/**
 * Escape HTML characters to prevent XSS injection
 * @param {*} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
