-- PHASE 1 (EXPAND): run this BEFORE deploying the application changes.
-- Copies MUA contact details into a private table while keeping the old columns
-- and existing policies in place, so the currently deployed site keeps working.

create table if not exists public.mua_private (
  id uuid primary key references public.mua_profiles(id) on delete cascade,
  email text,
  phone text,
  updated_at timestamptz not null default now()
);

insert into public.mua_private (id, email, phone)
select id, email, phone
from public.mua_profiles
on conflict (id) do update
set email = excluded.email,
    phone = excluded.phone,
    updated_at = now();

alter table public.mua_private enable row level security;

drop policy if exists "MUA can read own private details" on public.mua_private;
create policy "MUA can read own private details"
on public.mua_private for select to authenticated
using (auth.uid() = id);

drop policy if exists "MUA can insert own private details" on public.mua_private;
create policy "MUA can insert own private details"
on public.mua_private for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "MUA can update own private details" on public.mua_private;
create policy "MUA can update own private details"
on public.mua_private for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can read MUA private details" on public.mua_private;
create policy "Admins can read MUA private details"
on public.mua_private for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

revoke all on public.mua_private from public, anon;
grant select, insert, update on public.mua_private to authenticated;

-- The RPC returns contacts only for a booking participant or an admin.
-- It is used by server routes; it does not expose contact data for arbitrary users.
create or replace function public.get_booking_notification_contacts(p_booking_id uuid)
returns table (
  bride_first_name text,
  bride_last_name text,
  bride_email text,
  bride_phone text,
  mua_first_name text,
  mua_last_name text,
  mua_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select exists (
    select 1 from public.admins a where a.user_id = v_uid
  ) into v_is_admin;

  if not exists (
    select 1
    from public.bookings b
    where b.id = p_booking_id
      and (v_is_admin or b.bride_id = v_uid or b.mua_id = v_uid)
  ) then
    raise exception 'Not authorized to access booking contacts';
  end if;

  return query
  select
    bp.first_name,
    bp.last_name,
    bp.email,
    bp.phone,
    mp.first_name,
    mp.last_name,
    mpriv.email
  from public.bookings b
  left join public.bride_profiles bp on bp.id = b.bride_id
  left join public.mua_profiles mp on mp.id = b.mua_id
  left join public.mua_private mpriv on mpriv.id = b.mua_id
  where b.id = p_booking_id;
end;
$$;

revoke all on function public.get_booking_notification_contacts(uuid) from public, anon;
grant execute on function public.get_booking_notification_contacts(uuid) to authenticated;
