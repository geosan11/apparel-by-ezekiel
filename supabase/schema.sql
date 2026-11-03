-- ==============================================================================
-- Apparel by Ezekiel — Supabase Database Schema & Row-Level Security (RLS)
-- Target: Supabase PostgreSQL
-- Notice: DO NOT RUN THIS IN TEST/BUILD SCRIPTS. Intended for manual Supabase execution.
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Owners Table (Identifies authorized atelier owners via Supabase Auth UID)
create table if not exists public.owners (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text default 'Ezekiel',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Designs Table
create table if not exists public.designs (
  id text primary key,
  slug text unique not null,
  title text not null,
  category text not null,
  price numeric not null,
  price_formatted text not null,
  tagline text,
  description text,
  fabric text,
  lead_time text,
  featured boolean default false,
  is_new_this_week boolean default false,
  color text default '#141414',
  accent_color text default '#B89B6A',
  image text not null,
  overlay_image text,
  is_placeholder boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Bookings Table (Public bespoke booking appointments & simulated deposits)
create table if not exists public.bookings (
  id text primary key,
  customer_name text not null,
  phone text not null,
  fitting_date text not null,
  design_id text references public.designs(id) on delete set null,
  design_title text,
  notes text,
  deposit_status text default 'pending' check (deposit_status in ('pending', 'paid')),
  deposit_amount numeric default 50000,
  deposit_reference text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Orders Table (Unified orders: site bookings + manual entries: WhatsApp, IG, Walk-in)
create table if not exists public.orders (
  id text primary key,
  booking_id text references public.bookings(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  design_title text not null,
  amount numeric not null,
  deposit_amount numeric default 0,
  deposit_status text default 'pending' check (deposit_status in ('pending', 'paid')),
  status text default 'Pending' check (status in ('Pending', 'Confirmed', 'In Progress', 'Ready', 'Delivered', 'Cancelled')),
  source text default 'Site' check (source in ('WhatsApp', 'Instagram', 'Walk-in', 'Site')),
  fitting_date text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Expenses Table
create table if not exists public.expenses (
  id text primary key,
  amount numeric not null,
  category text not null check (category in (
    'fabric', 'thread', 'transport', 'logistics', 'staff', 'rent', 'power/fuel', 'marketing', 'packaging', 'other'
  )),
  date text not null,
  description text,
  raw_input text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Subscribers Table (Drop notification captures)
create table if not exists public.subscribers (
  id text primary key,
  contact text not null,
  channel text default 'whatsapp' check (channel in ('whatsapp', 'email')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- Row-Level Security (RLS) Configuration
-- ==============================================================================

alter table public.owners enable row level security;
alter table public.designs enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.expenses enable row level security;
alter table public.subscribers enable row level security;

-- Helper function to verify if the current authenticated caller is an authorized owner
create or replace function public.is_atelier_owner()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.owners
    where owners.id = auth.uid()
  );
$$;

-- 1. Owners Table Policies
create policy "Owners can view own profile"
  on public.owners
  for select
  to authenticated
  using (id = auth.uid());

-- 2. Designs Table Policies
create policy "Public can view designs"
  on public.designs
  for select
  to anon, authenticated
  using (true);

create policy "Owners have full control over designs"
  on public.designs
  for all
  to authenticated
  using (public.is_atelier_owner())
  with check (public.is_atelier_owner());

-- 3. Bookings Table Policies
-- Anon/Public may ONLY insert bookings (lead capture)
create policy "Public can submit bookings"
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);

-- Owners can view, update, delete bookings
create policy "Owners have full control over bookings"
  on public.bookings
  for all
  to authenticated
  using (public.is_atelier_owner())
  with check (public.is_atelier_owner());

-- 4. Orders Table Policies (Owner only)
create policy "Owners have full control over orders"
  on public.orders
  for all
  to authenticated
  using (public.is_atelier_owner())
  with check (public.is_atelier_owner());

-- 5. Expenses Table Policies (Owner only)
create policy "Owners have full control over expenses"
  on public.expenses
  for all
  to authenticated
  using (public.is_atelier_owner())
  with check (public.is_atelier_owner());

-- 6. Subscribers Table Policies
-- Anon/Public may ONLY insert contact captures
create policy "Public can subscribe to drops"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (true);

-- Owners can view subscribers
create policy "Owners have full control over subscribers"
  on public.subscribers
  for all
  to authenticated
  using (public.is_atelier_owner())
  with check (public.is_atelier_owner());
