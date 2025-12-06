-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create CUSTOMERS table
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text,
  email text,
  address text,
  line_id text,
  facebook_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create CATS table
create table public.cats (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.customers(id) on delete cascade not null,
  name text not null,
  breed text,
  color text,
  gender text, -- 'Male', 'Female'
  birth_date date,
  medical_notes text,
  dietary_notes text,
  personality_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create ROOM_RATES table
create table public.room_rates (
  room_type text primary key, -- 'standard', 'standard-connecting', 'delux', 'suite'
  price decimal(10,2) not null,
  currency text default 'THB',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Default Rates (Adjust these values as needed)
insert into public.room_rates (room_type, price) values 
('standard', 350.00),
('standard-connecting', 700.00),
('delux', 600.00),
('suite', 1200.00)
on conflict (room_type) do nothing;

-- 4. Enable RLS (Row Level Security)
alter table public.customers enable row level security;
alter table public.cats enable row level security;
alter table public.room_rates enable row level security;

-- Policies (Allow authenticated users to read/write for now - simple 'staff' access)
create policy "Enable all access for authenticated users on customers" 
on public.customers for all using (auth.role() = 'authenticated');

create policy "Enable all access for authenticated users on cats" 
on public.cats for all using (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on room_rates" 
on public.room_rates for select using (auth.role() = 'authenticated');

create policy "Enable update access for ADMIN only on room_rates" 
on public.room_rates for update using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- 5. Update nekohacathotel@gmail.com to Admin
-- Note: This requires the user to have signed up already.
update public.profiles
set role = 'admin'
where id in (
  select id from auth.users where email = 'nekohacathotel@gmail.com'
);
