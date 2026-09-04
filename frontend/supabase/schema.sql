-- ============================================================================
-- GIGLY PROTOCOL - SUPABASE SCHEMA FOR FREELANCERS
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

-- 3. Enable Row Level Security (RLS)
alter table public.freelancers enable row level security;

-- 4. Policies:
-- Allow anyone (including anonymous clients) to read profiles in the marketplace
drop policy if exists "Allow public read access to freelancers" on public.freelancers;
create policy "Allow public read access to freelancers"
  on public.freelancers
  for select
  using (true);

-- Note: All profile creation and updates are performed securely by the Next.js
-- backend using the service_role key, which automatically bypasses RLS.
-- This ensures unauthenticated direct client requests cannot maliciously modify data.
