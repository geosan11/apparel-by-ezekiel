-- Schema Documentation for Apparel by Ezekiel (Izgmbygjstkstzmveuct)
-- Products catalog, admins lookup, and product photo storage

-- Enable pgcrypto for UUID generation if not enabled
create extension if not exists "pgcrypto";

-- Table: public.admins
-- Stores user IDs granted administrative access to manage products and photos
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.products
-- Stores catalog products with categories, pricing, sizing, and photo gallery URLs
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null check (category in ('Kaftans', 'Agbada', 'Senator', 'Accessories')),
  price integer not null check (price >= 0),
  description text,
  details text,
  sizes text[] not null default array['S', 'M', 'L', 'XL', 'XXL', 'Custom'],
  images text[] not null default array[]::text[],
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helpful indexes for lookup and storefront catalog ordering
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_published_sort_idx on public.products (is_published, sort_order, created_at desc);

-- Automatic updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

-- Row Level Security (RLS)
alter table public.admins enable row level security;
alter table public.products enable row level security;

-- Admins Table Policies
-- Only authenticated users can check if their own user_id exists in admins
create policy "Admins can view own admin record"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- Products Table Policies
-- 1. Anyone (public anonymous or authenticated) can read published products.
--    Admins can also read unpublished (draft) products.
create policy "Anyone can read published products"
  on public.products
  for select
  using (
    is_published = true
    or (
      auth.role() = 'authenticated'
      and exists (select 1 from public.admins where user_id = auth.uid())
    )
  );

-- 2. Only users listed in public.admins can insert products
create policy "Admins can insert products"
  on public.products
  for insert
  to authenticated
  with check (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- 3. Only users listed in public.admins can update products
create policy "Admins can update products"
  on public.products
  for update
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- 4. Only users listed in public.admins can delete products
create policy "Admins can delete products"
  on public.products
  for delete
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- Storage Bucket: product-photos (Max 5MB, public read, admin-only write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-photos',
  'product-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage Policies
create policy "Public can view product photos"
  on storage.objects
  for select
  using (bucket_id = 'product-photos');

create policy "Admins can upload product photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-photos'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );

create policy "Admins can update product photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-photos'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );

create policy "Admins can delete product photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-photos'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );
