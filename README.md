# Apparel by Ezekiel – Storefront & Owner Admin (v1)

Apparel by Ezekiel is a bespoke and luxury ready-to-wear Nigerian men's fashion brand specializing in Kaftans, Agbada, and Senator attire.

This project is a mobile-first, lightweight storefront built with plain HTML5, CSS3, and vanilla JavaScript bundled with Vite plus `@supabase/supabase-js`.

---

## Screen 4: Owner Admin Portal (`#/admin`)

A clean, non-technical owner dashboard where Ezekiel can independently upload/replace product photography, update Naira pricing, edit tailoring specifications, toggle storefront visibility, and manage sizes.

Accessible at `#/admin` (also via discrete "Owner Login" footer links on the storefront).

### 1. Creating the Owner Admin Account

Owner accounts are secured via Supabase Authentication and Row Level Security (RLS) on PostgreSQL:

1. **Create Auth User**:
   - In Supabase Dashboard, go to **Authentication** → **Users** → **Add User** (or use Supabase Auth signup).
   - Provide Ezekiel's email and a secure password.
   - Copy the newly created user's `UUID` (e.g. `3a4f89b1-7c22-4d95-8e11-92b0e98a72cd`).

2. **Grant Admin Privileges (`public.admins`)**:
   - In Supabase **SQL Editor** or **Table Editor**, insert the user's UUID into `public.admins`:
     ```sql
     INSERT INTO public.admins (user_id)
     VALUES ('<USER_UUID>')
     ON CONFLICT (user_id) DO NOTHING;
     ```
3. **Owner Sign In**:
   - Visit `#/admin` and sign in with the email and password.
   - The portal verifies the session against `public.admins`. If an authenticated account is not in `public.admins`, it displays: *"This account isn't set up as the owner."* and prevents all write actions.

---

### 2. How to Add & Edit Garments

1. **Add a Piece**:
   - Click **"+ Add New Garment"** in the top-right toolbar.
2. **Garment Information**:
   - **Name**: Enter title (e.g. `Kaftan 012 – Obsidian Gold`). The storefront URL slug is auto-generated (e.g. `kaftan-012-obsidian-gold`).
   - **Category**: Select `Kaftans`, `Agbada`, `Senator`, or `Accessories`.
   - **Price**: Enter plain digits (e.g. `120000`). The live preview badge immediately formats it as `₦120,000`. Do not type commas or currency symbols.
   - **Short Description**: Brief overview shown in collection catalog cards.
   - **Tailoring Details**: Fabric origin, needlework, placket details, trouser adjusters, and recommended occasions.
3. **Sizes & Visibility**:
   - **Available Sizes**: Tap size pills (`S`, `M`, `L`, `XL`, `XXL`, `Custom`) to toggle availability.
   - **Publish to Storefront**: Toggle between **Published** (visible to clients) and **Draft** (hidden while preparing pieces).
4. **Photography Management**:
   - Drag and drop or tap to select multiple photos (JPEG, PNG, WebP).
   - Photos are automatically resized to max 1600px and compressed under ~500KB before uploading to the `product-photos` storage bucket.
   - The **first photo (★ Main)** is the hero thumbnail displayed in the shop grid.
   - Use `Move Left` and `Move Right` buttons to reorder photos.
   - Use `Remove` to delete unwanted photos.
5. **Save or Delete**:
   - Click **"Save Garment"** to publish updates.
   - To remove a piece, scroll to the **Danger Zone** and click **"Delete Garment"**, which triggers an in-page confirmation dialog.

---

### 3. Photography Guidelines & Tips for Ezekiel

To maintain a luxury aesthetic that converts WhatsApp inquiries into orders:

- **Aspect Ratio**: Always capture photos in **vertical portrait orientation (3:4 ratio)**. Landscape photos crop trousers and kaftan length.
- **Lighting**: Photograph in bright, diffused natural daylight (early morning or late afternoon) or soft studio box lights. Avoid harsh noon shadows or direct flash reflections on satin/brocade fabrics.
- **Backgrounds**: Use clean, neutral backdrops (off-white, light warm grey, or stone texture). Avoid cluttered tailor-shop backgrounds.
- **Garment Preparation**: Steam or press garments thoroughly before shooting to showcase crisp embroidery and sharp collar creases.
- **Photo Sequence Recommendation**:
  - **Photo 1 (Main Hero)**: Full-length front shot showing the top and trousers.
  - **Photo 2 (Chest Detail)**: Close-up of neckline embroidery, collar, and buttons.
  - **Photo 3 (Cuff & Fabric Detail)**: Close-up of cuff finishing and fabric texture.
  - **Photo 4 (Back / Side)**: Full back or side angle showing drape.
- **Mobile Compression**: The portal automatically compresses high-res phone photos down to fast-loading WebP files under 500KB, ensuring smooth performance for clients across Nigerian mobile networks.

---

### 4. Dev-Only Demo Mode (`#/admin?demo=1`)

During local development (`import.meta.env.DEV`), reviewers can test the complete admin interface without requiring Supabase database credentials:
- Visit `http://localhost:5173/#/admin?demo=1`
- Renders simulated owner session (`ezekiel@apparelbyezekiel.com`) with local sample garments.
- Enables editing prices, adding photos, reordering gallery, published toggles, and delete confirmations with local in-memory state.
- **Security**: In production builds (`vite build`), `import.meta.env.DEV` compiles to `false` and Demo Mode is strictly disabled.

---

## Database & Storage Setup (Supabase)

Backend project ref: `izgmbygjstkstzmveuct`

- **Migrations**: [`supabase/migrations/001_products_and_photos.sql`](file:///workspace/apparel2/repo/supabase/migrations/001_products_and_photos.sql)
- **Seed Data**: [`supabase/seed.sql`](file:///workspace/apparel2/repo/supabase/seed.sql)
- **Environment Configuration**:
  - Copy `.env.example` to `.env.local` (keep `.env.local` gitignored):
    ```env
    VITE_SUPABASE_URL=https://izgmbygjstkstzmveuct.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
    ```
- **Fallback Guarantee**: Storefront fetches live published products ordered by `sort_order` and `created_at`. If environment variables are missing or network requests fail, the storefront automatically falls back to [`src/products.json`](file:///workspace/apparel2/repo/src/products.json) without breaking the customer shopping experience.

---

## Design System & Principles

- **Palette**:
  - Background: Off-white (`#f7f5f0`)
  - Cards: Crisp pure white (`#ffffff`) with subtle hairline border (`var(--color-border)`)
  - Primary text / accents: Deep black (`#0a0a0a`)
  - Muted text / labels: Greys (`#71717a`, `#a1a1aa`, `#27272a`)
  - *No bright neon or lime accents.*
- **Typography**: Clean sans-serif (`Inter`, system fallback) with generous tracking on wordmarks.
- **Touch Targets**: Minimum 44×44px on all interactive controls (buttons, links, search clear, pills, switches, photo reorder buttons).
- **Accessibility**: Visible `:focus-visible` focus rings, high-contrast badges, keyboard dismissal, and in-page modal dialogs.

---

## Development & Testing

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run Vitest test suite (price parsing, slug generation, resize calculations, fallback logic)
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

