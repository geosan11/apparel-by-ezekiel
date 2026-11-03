# Apparel by Ezekiel — Luxury Bespoke Atelier (v1 Foundation)

> Modern, minimal Nigerian bespoke fashion maison site with dual-entry architecture (public collection + offline-capable PWA admin portal). Built with vanilla ES modules on Vite.

---

## 1. Architecture & Design Principles

- **Framework-free:** Pure modern JavaScript (ES2022) with Vite tooling.
- **Strict Bundle Isolation:** Two independent entries: `index.html` (public client site) and `admin.html` (atelier executive dashboard). The public bundle contains **zero** admin logic.
- **Dynamic 3D & Supabase Import:** Three.js is imported dynamically via `import('three')` **only** when a client clicks the 3D Garment Preview. Supabase is loaded lazily only when configured. Initial public JavaScript bundle is **14.39 KB gzipped** (enforced by CI size budget checks: public ≤ 25 KB gz, admin ≤ 75 KB gz initial JS).
- **Static Prerendering for WhatsApp & Social Sharing:** Build script generates static HTML pages in `dist/designs/<slug>/index.html` with Open Graph tags (`og:title`, `og:image`, `og:description`, `product:price`), ensuring link previews work on WhatsApp, iMessage, and Instagram.
- **Zero-Upload Virtual Try-On:** All garment overlay positioning, scaling, rotation, and multi-touch gestures occur 100% in-browser on an HTML5 canvas. No client photo is ever sent to or stored on a server.
- **Dual Data Layer:** Unified store interface (`src/store/index.js`) supporting:
  1. **IndexedDB:** Default offline-first persistence engine with pre-seeded orders, expenses, and bookings.
  2. **Supabase:** PostgreSQL backend with Row-Level Security (RLS) policies, dynamically loaded only when environment variables are supplied.

---

## 2. Palette & Luxury Motion Tokens

- **Near-black:** `#0E0E0E` (primary canvas)
- **Off-white:** `#F6F3EE` (high-contrast editorial typography)
- **Warm grey:** `#8A847C` (body copy, sub-labels)
- **Muted gold:** `#B89B6A` (sparingly used for artisanal embroidery accents)
- **Typography:** Self-hosted Cormorant Garamond display + Inter body via `@fontsource` with `font-display: swap`.
- **Motion System:**
  - Standard ease: `cubic-bezier(0.2, 0.7, 0.2, 1)`
  - Durations: `160ms` hover lift, `280ms` enter, `480ms` hero
  - Staggered IntersectionObserver reveals (12px rise + fade, 40ms stagger)
  - Full respect for `@media (prefers-reduced-motion: reduce)`

---

## 3. Quick Start & Development

### Prerequisites
- Node.js 18+ (tested on Node v20/v22/v24)
- npm 9+

### Installation & Local Dev
```bash
# Clone and enter directory
cd /workspace/apparel/repo

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit:
- Public Atelier: `http://localhost:5173/`
- Atelier Admin Dashboard: `http://localhost:5173/admin.html`

### Run Vitest Unit Tests
```bash
npm test
```
Runs 62 automated unit tests covering:
- Natural language rule-based expense parser (18k, 1.5m, ₦18000, N18000, 18,000, categories, dates: today/yesterday/last friday/ISO).
- Simple CRM pure logic: phone normalization (`0803...`, `234...`, `+234...`, international `+`, spaces/dashes, garbage), status derivation (due, active, quiet), follow-up priority scheduling, measurement validation and inch/cm conversion, duplicate detection, idempotent order rebuild.
- IndexedDB offline store adapter CRUD (including v2 `customers` store), upgrade migration, JSON backup export/import v1→v2 compatibility, and reset-to-demo.

### Production Build & Prerender
```bash
npm run build
```
Compiles production assets to `/dist` and runs `scripts/prerender.js` to create per-design static HTML pages with Open Graph tags.

### Bundle Size Budget Check
```bash
npm run size
```
Verifies initial first-load JavaScript budgets via manifest analysis (`dist/.vite/manifest.json`):
- Public site (`index.html`) initial JS ≤ 25 KB gzipped (actual: 14.39 KB gzipped)
- Atelier Admin (`admin.html`) initial JS ≤ 75 KB gzipped (actual: 12.15 KB gzipped)
- Confirms zero Supabase vendor code or `@supabase/` in the initial public bundle.

---

## 4. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://<project>.supabase.co`) | Empty (uses local IndexedDB) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public API key | Empty (uses local IndexedDB) |
| `VITE_WHATSAPP_PHONE` | Atelier WhatsApp concierge phone number | `2348000000000` |

---

## 5. Supabase Setup Steps (When Ready for Cloud Backend)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase/schema.sql` and run it.
4. Go to **Authentication > Users** in Supabase and create the owner account (e.g. `ezekiel@apparelbyezekiel.com`).
5. In the **SQL Editor**, register the owner UID in the `owners` table to grant atelier management permissions:
   ```sql
   INSERT INTO public.owners (id, email, full_name)
   VALUES ('<OWNER_USER_UUID_FROM_AUTH_USERS>', 'ezekiel@apparelbyezekiel.com', 'Ezekiel');
   ```
6. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your environment settings in Vercel or `.env`.

> **Note on RLS Policies:**
> - Anonymous visitors can **only** submit appointments into `bookings` and newsletter captures into `subscribers`.
> - The authenticated atelier owner can read, modify, and delete all records (`orders`, `expenses`, `designs`, `bookings`, `subscribers`).

---

## 6. Admin Portal & "Demo Login"

Navigate to `/admin.html`:
- **Demo Login (Recommended for Review):** Click the golden **"Instant Demo Login"** button. This enters the executive suite immediately with pre-populated demo data:
  - 5 active bespoke orders (Agbada, Senator, Tuxedo) across WhatsApp, Instagram, Walk-in, and Site channels.
  - Inbound booking requests with simulated deposit statuses.
  - Expense ledger with rule-based expense chat.
- **Rule-Based Expense Chat:** Type expressions such as:
  - `Paid 18k for fabric today`
  - `N18000 fuel last friday`
  - `1.5m rent 2026-11-01`
  - `Dispatch delivery 2500`
  The system recognizes amounts, categories, and relative dates without requiring any paid AI API keys. Displays an interactive **Confirm Chip** before saving, and provides an **Undo** action.
- **Clients (CRM):** Minimalist bespoke client relationship manager guided by extreme simplicity and progressive disclosure:
  - **Minimal List:** Displays name, phone, and a discrete status dot (gold = due follow-up, off-white = active orders, warm grey = quiet).
  - **Single Follow-Up Card:** Displays at most one due reminder with quick "Mark Done" action and direct WhatsApp link (`https://wa.me/...`).
  - **Client Profile:** Expandable sections for linked Orders, bespoke Measurements (Chest, Waist, Hips, Shoulder, Sleeve in inches or cm), and Notes with blur autosave.
  - **Where Data Lives:** All client records reside strictly in this browser's IndexedDB (`customers` object store) on the owner's device, with optional cloud sync when Supabase is enabled.
- **Backup & Portability:** Export your entire atelier database as a single portable JSON file, or restore from an existing backup in **Settings**.

---

## 7. What is Placeholder vs What Needs the Owner

To launch live commercial operations, the owner should supply:

| Component | Current v1 Implementation (Placeholder) | Needs from Owner for Production |
| :--- | :--- | :--- |
| **Brand Identity** | Stylized SVG wordmark (`/images/logo.svg`) | Final brand emblem (`logo.jpg` / vector SVG) |
| **Garment Imagery** | Hand-crafted SVG editorial illustrations in `data/designs.json` | High-resolution editorial campaign lookbook photos (WebP / JPG) |
| **3D Garment Model** | Procedural lathe Agbada silhouette rendered with Three.js | Exported 3D garment `.glb` assets (under 2MB, Draco/Meshopt compressed) |
| **Deposits & Payments** | Simulated OPay checkout with persistent `DEMO — NO REAL PAYMENT IS TAKEN` banner | Live Paystack or OPay Merchant API keys & webhook receiver |
| **WhatsApp Phone** | Placeholder `+234 800 000 0000` | Owner's official WhatsApp Business number |
| **Supabase Credentials** | Offline IndexedDB fallback engine active | Production Supabase URL & Anon Key for live cloud syncing |

---

## 8. Compliance & Legal Notices

- **Nigeria Data Protection Act (NDPA) 2023:** Full privacy disclosure available on the site detailing data controller identity, lawful basis, customer rights, and retention policies.
- **NDPR Client Data Notice:** The CRM stores personal data (names, phone numbers, measurements, notes) in this browser's IndexedDB on the owner's device only; backup files contain personal data — store them safely. The owner must approve before entering real customer data.
- **Zero-Upload Virtual Try-On:** All camera frames and user pictures remain strictly on-device in browser RAM. No images are uploaded to any server.
