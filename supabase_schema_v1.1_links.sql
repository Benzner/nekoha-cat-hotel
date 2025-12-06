-- Add foreign keys to reservations table
-- (Nullable for backward compatibility with existing v1.0 data)

alter table public.reservations 
add column if not exists customer_id uuid references public.customers(id),
add column if not exists cat_id uuid references public.cats(id);

-- Optional: Create index for performance
create index if not exists reservations_customer_id_idx on public.reservations(customer_id);
create index if not exists reservations_cat_id_idx on public.reservations(cat_id);
