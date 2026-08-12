-- Migration: create cart_items table and policies
-- Only creates the cart_items table and related policies/index used by the app

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Row Level Security must be enabled for the table before creating policies
alter table public.cart_items enable row level security;

-- Cart items policies
create policy "Users can view own cart items" on public.cart_items for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert own cart items" on public.cart_items for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Users can update own cart items" on public.cart_items for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "Users can delete own cart items" on public.cart_items for delete using (auth.uid() = user_id or public.is_admin());
create policy "Admins can manage cart items" on public.cart_items for all using (public.is_admin());

-- Index for common lookups
create index if not exists idx_cart_items_user_id on public.cart_items(user_id);
create index if not exists idx_cart_items_product_id on public.cart_items(product_id);
