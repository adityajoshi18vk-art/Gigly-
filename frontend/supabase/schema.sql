-- ============================================================================
-- GIGLY PROTOCOL - SUPABASE SCHEMA FOR FREELANCERS & CLIENTS
-- ============================================================================
-- Execute this SQL in your Supabase project:
-- Dashboard -> Project -> SQL Editor -> New query -> Paste and Run.
-- ============================================================================

-- 1. Create the freelancers table
create table if not exists public.freelancers (
  address text primary key,
  name text not null,
  title text not null,
  domain text not null,
  hourly_rate numeric not null default 0,
  skills text[] default '{}',
  verified_skills text[] default '{}',
  skill_verification_hash text,
  bio text default '',
  portfolio_url text,
  github_url text,
  avatar_fallback text,
  kyc_verified boolean default false,
  created_at bigint not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Indexes for fast marketplace queries
create index if not exists idx_freelancers_domain on public.freelancers (domain);
create index if not exists idx_freelancers_hourly_rate on public.freelancers (hourly_rate);
create index if not exists idx_freelancers_created_at on public.freelancers (created_at desc);

-- 3. Enable Row Level Security (RLS) for freelancers
alter table public.freelancers enable row level security;

-- 4. Policies for freelancers
drop policy if exists "Allow public read access to freelancers" on public.freelancers;
create policy "Allow public read access to freelancers"
  on public.freelancers
  for select
  using (true);


-- ============================================================================
-- 5. Create the clients table (Client Onboarding & Identity)
-- ============================================================================
create table if not exists public.clients (
  address text primary key,
  name text not null,
  company_name text,
  industry text default 'Technology',
  website text,
  bio text default '',
  avatar_fallback text,
  created_at bigint not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Indexes for clients
create index if not exists idx_clients_created_at on public.clients (created_at desc);

-- 7. Enable Row Level Security (RLS) for clients
alter table public.clients enable row level security;

-- 8. Policies for clients
drop policy if exists "Allow public read access to clients" on public.clients;
create policy "Allow public read access to clients"
  on public.clients
  for select
  using (true);

-- Note: All profile creation and updates are performed securely by the Next.js
-- backend using the service_role key, which automatically bypasses RLS.
