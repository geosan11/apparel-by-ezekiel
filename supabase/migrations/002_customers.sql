-- ==============================================================================
-- NOT APPLIED — requires the owner's yes.
-- Apparel by Ezekiel — Migration 002: Customers (Simple CRM)
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Customers Table
create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text not null,
  phone_norm text not null,
  source text default 'Site' check (source in ('WhatsApp', 'Instagram', 'Walk-in', 'Site', 'Referral')),
  measurements jsonb,
  notes text default '',
  follow_up jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add nullable customer_id reference to orders
alter table public.orders
  add column if not exists customer_id text references public.customers(id) on delete set null;

-- 3. Row-Level Security (RLS) Configuration for Customers
alter table public.customers enable row level security;

-- Owners have full control over customers (mirroring existing owner pattern)
create policy "Owners have full control over customers"
  on public.customers
  for all
  to authenticated
  using (public.is_atelier_owner())
  with check (public.is_atelier_owner());
