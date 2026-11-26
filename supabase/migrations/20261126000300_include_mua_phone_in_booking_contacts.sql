-- Return the assigned artist's WhatsApp number to authenticated booking participants.
-- The notification API uses this RPC; mua_private remains protected by RLS.

begin;

drop function if exists public.get_booking_notification_contacts(uuid);

create function public.get_booking_notification_contacts(p_booking_id uuid)
returns table (
  bride_first_name text,
  bride_last_name text,
  bride_email text,
  bride_phone text,
  mua_first_name text,
  mua_last_name text,
  mua_email text,
  mua_phone text
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
    mpriv.email,
    mpriv.phone
  from public.bookings b
  left join public.bride_profiles bp on bp.id = b.bride_id
  left join public.mua_profiles mp on mp.id = b.mua_id
  left join public.mua_private mpriv on mpriv.id = b.mua_id
  where b.id = p_booking_id;
end;
$$;

revoke all on function public.get_booking_notification_contacts(uuid) from public, anon;
grant execute on function public.get_booking_notification_contacts(uuid) to authenticated;

commit;
