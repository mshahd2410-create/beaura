-- PHASE 2 (CONTRACT): run ONLY AFTER the updated application is deployed
-- and its booking, artist settings, and admin flows have been verified.
-- Phase 1 must already have run successfully.

-- Remove broad MUA reads. Artist discovery remains public, but email/phone
-- are no longer stored on this table after the final two statements below.
drop policy if exists "Public can view MUA profiles" on public.mua_profiles;
drop policy if exists "Public can view MUAs" on public.mua_profiles;
drop policy if exists "Public read access for mua profiles" on public.mua_profiles;
drop policy if exists "Public read mua profiles" on public.mua_profiles;
drop policy if exists "public read profiles" on public.mua_profiles;
drop policy if exists "Public can view artist discovery fields" on public.mua_profiles;
drop policy if exists "MUA can read own profile" on public.mua_profiles;

create policy "Public can view artist discovery fields"
on public.mua_profiles for select
using (true);

create policy "MUA can read own profile"
on public.mua_profiles for select to authenticated
using (auth.uid() = id);

-- Bride event and contact details are visible only to the bride and admins.
drop policy if exists "Allow authenticated users to read bride profiles" on public.bride_profiles;
drop policy if exists "Admins can read all bride profiles" on public.bride_profiles;
create policy "Admins can read all bride profiles"
on public.bride_profiles for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- The new application reads/writes these values through mua_private.
alter table public.mua_profiles
  drop column if exists email,
  drop column if exists phone;
