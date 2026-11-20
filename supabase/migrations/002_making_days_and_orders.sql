-- Migration 002: Add making_days to products and create orders table with OPay checkout support
-- Applied to izgmbygjstkstzmveuct on 2026-11-17 (with set_updated_at helper added)

-- 1. Add making_days to public.products (nullable integer, 1 to 90 days)
alter table public.products
  add column if not exists making_days integer check (making_days is null or (making_days >= 1 and making_days <= 90));

comment on column public.products.making_days is 'Estimated tailoring turnaround time in days (1 to 90), or null if not set.';

-- 2. Create public.orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  amount integer not null check (amount >= 0), -- Amount in kobo (e.g. 12000000 kobo = ₦120,000)
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  size text not null,
  measurements jsonb not null default '{}'::jsonb,
  making_days integer check (making_days is null or (making_days >= 1 and making_days <= 90)),
  expected_ready_date date,
  opay_order_no text,
  opay_cashier_url text,
  raw_response jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.orders is 'Orders placed via OPay Cashier checkout and custom tailoring requests.';
comment on column public.orders.amount is 'Total order amount in kobo (Naira * 100).';

-- Indexes for fast lookup and admin dashboard
create index if not exists orders_reference_idx on public.orders (reference);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Helper trigger function for updated_at (did not exist in 001)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for orders updated_at
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

-- 3. Row Level Security (RLS)
alter table public.orders enable row level security;

-- Admins can read all orders
create policy "Admins can view all orders"
  on public.orders
  for select
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- Admins can update orders (e.g., status changes, tracking notes)
create policy "Admins can update orders"
  on public.orders
  for update
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- 4. Public Security-Definer RPC for Customer Order Status Lookup
-- Public users have no direct table access; they query only status, amount, and product_name via this RPC.
create or replace function public.get_order_status(lookup_reference text)
returns table (
  status text,
  amount integer,
  product_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    o.status,
    o.amount,
    o.product_name
  from public.orders o
  where o.reference = lookup_reference
  limit 1;
end;
$$;

grant execute on function public.get_order_status(text) to anon, authenticated, service_role;
