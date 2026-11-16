-- Seed data for Apparel by Ezekiel products
-- Matches items currently in src/products.json

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('kaftan-010', 'Kaftan 010 – Royal Sand', 'Kaftans', 120000, 10, 'Handcrafted two-piece beige kaftan tailored from premium Irish wool blend with subtle chest embroidery and tapered trousers.', 'Crafted from imported breathable Irish wool-linen blend. Features precision hand-finished needlework, hidden placket buttons, and tailored trousers with side adjusters. Designed for traditional ceremonies, weddings, and executive engagements.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/e7e5e0/0a0a0a?text=Kaftan+010+Front', 'https://placehold.co/600x800/dcd9d2/0a0a0a?text=Kaftan+010+Detail', 'https://placehold.co/600x800/e7e5e0/0a0a0a?text=Kaftan+010+Side', 'https://placehold.co/600x800/dcd9d2/0a0a0a?text=Kaftan+010+Back']::text[], true, 0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('kaftan-006', 'Kaftan 006 – Midnight Noir', 'Kaftans', 120000, 12, 'Structured charcoal black kaftan featuring vertical silver geometric chest embroidery and French cuff accents.', 'Cut from high-twist tropical wool. Features distinctive geometric embroidery running down the chest and contrasting cuff motifs. Finished with matching tailored slim trousers and soft inner lining.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/222222/f7f5f0?text=Kaftan+006+Front', 'https://placehold.co/600x800/2c2c2c/f7f5f0?text=Kaftan+006+Embroidery', 'https://placehold.co/600x800/1e1e1e/f7f5f0?text=Kaftan+006+Cuff', 'https://placehold.co/600x800/262626/f7f5f0?text=Kaftan+006+Back']::text[], true, 10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('agbada-monarch', 'Monarch Grand Agbada – Imperial Emerald', 'Agbada', 250000, 21, 'Majestic three-piece agbada set crafted from heavyweight Aso-Oke inspired damask with opulent tonal embroidery.', 'An extraordinary heirloom piece designed for chieftaincy coronations, gala celebrations, and milestone weddings. Set includes sweeping wide-winged grand robe, fitted inner tunic, matching trousers, and bespoke styling consultation.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/182e25/f7f5f0?text=Agbada+Monarch+Front', 'https://placehold.co/600x800/213b30/f7f5f0?text=Agbada+Monarch+Detail', 'https://placehold.co/600x800/1b352b/f7f5f0?text=Agbada+Monarch+Wing', 'https://placehold.co/600x800/14261f/f7f5f0?text=Agbada+Monarch+Back']::text[], true, 20)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('agbada-heritage', 'Heritage Agbada – Obsidian & Bronze', 'Agbada', 220000, 18, 'Contemporary three-piece agbada in jet black cashmere blend accented with metallic bronze sovereign chain embroidery.', 'A modern interpretation of the timeless Yoruba silhouette. Lined with lightweight Italian silk for effortless drape and movement. Complete with tapered drawstring-waist trousers and tailored short-sleeve under-tunic.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/1c1b18/e7e5e0?text=Heritage+Agbada+Front', 'https://placehold.co/600x800/272522/e7e5e0?text=Heritage+Agbada+Chest', 'https://placehold.co/600x800/201e1b/e7e5e0?text=Heritage+Agbada+Full', 'https://placehold.co/600x800/191815/e7e5e0?text=Heritage+Agbada+Back']::text[], true, 30)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('senator-diplomat', 'Diplomat Senator – Slate Grey', 'Senator', 95000, 7, 'Executive longline senator tunic and trousers in Italian super-120s wool with asymmetrical button styling.', 'Clean lines and sharp architectural tailoring designed for boardrooms and Sunday outings alike. Features concealed side slash pockets, minimalist Mandarin collar, and reinforced side slits.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/52565e/f7f5f0?text=Diplomat+Senator+Front', 'https://placehold.co/600x800/60646c/f7f5f0?text=Diplomat+Senator+Collar', 'https://placehold.co/600x800/494d54/f7f5f0?text=Diplomat+Senator+Side', 'https://placehold.co/600x800/585c64/f7f5f0?text=Diplomat+Senator+Back']::text[], true, 40)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('senator-vanguard', 'Vanguard Senator – Burgundy Wine', 'Senator', 105000, 8, 'Rich wine-toned two-piece senator set with subtle self-colored corded embroidery around neck and chest.', 'Crafted from fine twill weave cotton-cashmere blend. Breathable for warm climates with deep, rich saturation that won''t fade. Styled with a crisp angled hemline and matching tailored trousers.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/4a1525/f7f5f0?text=Vanguard+Senator+Front', 'https://placehold.co/600x800/57192c/f7f5f0?text=Vanguard+Senator+Neck', 'https://placehold.co/600x800/3e121f/f7f5f0?text=Vanguard+Senator+Detail', 'https://placehold.co/600x800/4a1525/f7f5f0?text=Vanguard+Senator+Back']::text[], true, 50)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('kaftan-sahara', 'Sahara Kaftan – Terracotta Dusk', 'Kaftans', 110000, 10, 'Warm earth-toned two-piece kaftan featuring hand-stitched bar-tack accents and relaxed silhouette.', 'Inspired by northern Sahelian heritage, cut from breathable Egyptian linen blend. Features a relaxed cut bodice, notch neckline, and tailored straight-cut trousers with deep functional pockets.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/8d4b38/f7f5f0?text=Sahara+Kaftan+Front', 'https://placehold.co/600x800/9b533f/f7f5f0?text=Sahara+Kaftan+Neck', 'https://placehold.co/600x800/7f4332/f7f5f0?text=Sahara+Kaftan+Side', 'https://placehold.co/600x800/8d4b38/f7f5f0?text=Sahara+Kaftan+Back']::text[], true, 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (slug, name, category, price, making_days, description, details, sizes, images, is_published, sort_order)
VALUES ('accessory-fila', 'Royal Fila Cap – Onyx & Silver', 'Accessories', 85000, 7, 'Traditional Yoruba cap woven with silver-threaded Aso-Oke cotton, shaped to complement any Agbada or Senator ensemble.', 'Handmade by master weavers in Iseyin. Pre-creased in the classic Gobi style or pliable to fold in the wearer''s preferred crown shape. Lined with soft breathable cotton sweatband.', ARRAY['S', 'M', 'L', 'XL', 'XXL', 'Custom']::text[], ARRAY['https://placehold.co/600x800/2a2a2a/f7f5f0?text=Royal+Fila+Front', 'https://placehold.co/600x800/383838/f7f5f0?text=Royal+Fila+Weave', 'https://placehold.co/600x800/222222/f7f5f0?text=Royal+Fila+Angle', 'https://placehold.co/600x800/303030/f7f5f0?text=Royal+Fila+Interior']::text[], true, 70)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  making_days = EXCLUDED.making_days,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  sizes = EXCLUDED.sizes,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;
