-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  phone_number text,
  role text check (role in ('user', 'contractor', 'admin')) default 'user',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Public profiles are viewable by everyone.') then
        create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can insert their own profile.') then
        create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can update own profile.') then
        create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );
    end if;
end
$$;

-- Handle new user signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
        create trigger on_auth_user_created
          after insert on auth.users
          for each row execute procedure public.handle_new_user();
    end if;
end
$$;


-- VEHICLES
create table if not exists public.vehicles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  make text not null,
  model text not null,
  year integer not null,
  color text,
  license_plate text,
  type text, -- sedan, suv, truck, etc.
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Vehicles
alter table public.vehicles enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'vehicles' and policyname = 'Users can view their own vehicles.') then
        create policy "Users can view their own vehicles." on vehicles for select using ( auth.uid() = user_id );
    end if;
    if not exists (select 1 from pg_policies where tablename = 'vehicles' and policyname = 'Users can insert their own vehicles.') then
        create policy "Users can insert their own vehicles." on vehicles for insert with check ( auth.uid() = user_id );
    end if;
    if not exists (select 1 from pg_policies where tablename = 'vehicles' and policyname = 'Users can update their own vehicles.') then
        create policy "Users can update their own vehicles." on vehicles for update using ( auth.uid() = user_id );
    end if;
    if not exists (select 1 from pg_policies where tablename = 'vehicles' and policyname = 'Users can delete their own vehicles.') then
        create policy "Users can delete their own vehicles." on vehicles for delete using ( auth.uid() = user_id );
    end if;
end
$$;

-- Note: 'services' and 'bookings' already exist in the database (managed by Strapi).
-- We will avoid recreating them to prevent errors and data loss.
-- We will instead rely on the existing tables for these entities.

-- Run this if bookings table is missing contractor_id:
-- ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS contractor_id uuid REFERENCES public.profiles(id);

-- Run this if profiles table is missing stripe fields:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_account_id text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- NOTIFICATIONS
create table if not exists public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text not null check (type in ('info', 'success', 'warning', 'error')),
    is_read boolean default false,
    link text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Notifications
alter table public.notifications enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'Users can view their own notifications') then
        create policy "Users can view their own notifications" on notifications for select using ( auth.uid() = user_id );
    end if;
    if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'Users can update their own notifications') then
        create policy "Users can update their own notifications" on notifications for update using ( auth.uid() = user_id );
    end if;
    if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'Users can insert their own notifications') then
        create policy "Users can insert their own notifications" on notifications for insert with check ( auth.uid() = user_id );
    end if;
end
$$;
