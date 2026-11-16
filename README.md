# Apparel by Ezekiel – v1 Storefront

Apparel by Ezekiel is a bespoke and luxury ready-to-wear Nigerian men's fashion brand specializing in Kaftans, Agbada, and Senator attire.

This project is a mobile-first, lightweight storefront built with plain HTML5, CSS3, and vanilla JavaScript bundled with Vite. It requires no heavy frameworks, backend, or database.

---

## Design System & Principles

- **Palette**:
  - Background: Off-white (`#f7f5f0`)
  - Cards: Crisp pure white (`#ffffff`) with subtle hairline border (`rgba(10, 10, 10, 0.08)`)
  - Primary text / accents: Deep black (`#0a0a0a`)
  - Muted text / labels: Greys (`#666666`, `#888888`)
  - *No bright neon or lime accents.*
- **Typography**: Clean sans-serif (`Inter`, system fallback) with generous tracking on wordmarks.
- **Corners**: Generous rounded corners (`14px`–`22px` and pill `9999px`) matching modern luxury fashion app references (`ref-mockup3.jpg` and `ref-cossly.jpg`).
- **Accessibility**:
  - Minimum 44×44px tap targets on all interactive elements (buttons, links, search clear, category chips, wishlist buttons).
  - Explicit `:focus-visible` focus rings with 2px offset.
  - Descriptive alt text on all product photography.
  - Full XSS protection by sanitizing all dynamic inputs via `escapeHtml()`.

---

## How to Add a Product / Change Photos

All garment catalog data lives in [`src/products.json`](file:///workspace/apparel2/repo/src/products.json).

### 1. Adding a New Product

Open `src/products.json` and append a new JSON object to the array:

```json
{
  "id": "kaftan-011",
  "name": "Kaftan 011 – Ivory Sovereign",
  "category": "Kaftans",
  "price": 135000,
  "description": "Two-piece handcrafted ivory kaftan with gold bar-tack embroidery and tailored straight-cut trousers.",
  "images": [
    "https://placehold.co/600x800/f3f0e8/0a0a0a?text=Kaftan+011+Front"
  ]
}
```

#### Field Specifications:
- `id`: Unique lowercase slug (e.g. `kaftan-011`, `agbada-emperor`).
- `name`: Display title of the piece (e.g. `Monarch Grand Agbada – Imperial Emerald`).
- `category`: Must match one of the store categories:
  - `"Kaftans"`
  - `"Agbada"`
  - `"Senator"`
  - `"Accessories"`
- `price`: Numeric value in Naira (integer without currency symbols or commas, e.g. `135000`). The storefront automatically formats this as `₦135,000`.
- `description`: Short description of the fabric and tailoring details.
- `images`: Array of image URLs. The first image `images[0]` is displayed on the product grid card.

### 2. Changing or Swapping Real Photos

Currently, sample products use placeholder images formatted as:
`https://placehold.co/600x800/<background_hex>/<text_hex>?text=<Label>`

To swap in real photos:
1. Place your high-resolution images in `public/images/` or host them on a CDN / Cloudinary.
2. In `src/products.json`, update the `images` array with the relative path or hosted URL:
   ```json
   "images": [
     "/images/kaftan-010-front.jpg",
     "/images/kaftan-010-detail.jpg"
   ]
   ```
3. Optimal image aspect ratio is **3:4** (e.g. 600×800 or 900×1200) with a neutral off-white or studio background.

---

## Development & Testing

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run Vitest test suite (price formatting, filtering, escaping)
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Current Scope (v1 Screen 1)

This release implements **Screen 1 (Home / Shop Grid)**:
- Sticky top bar with `APPAREL BY EZEKIEL` wordmark and slide-out navigation drawer.
- Search input with clear button and real-time filtering.
- Horizontal category chips (`All`, `Kaftans`, `Agbada`, `Senator`, `Accessories`) with black active states.
- `New Arrivals` catalog heading with dynamic item count.
- 2-column mobile product grid (scales to 3–4 columns on tablet/desktop) with rounded photos, heart wishlist toggles, and Naira pricing.
- Bottom navigation with `Home` and `Shop` (fixed mobile bar, floating pill dock on desktop).
- `#/product/<id>` placeholder screen ("Coming next") for individual garments.
