-- Beaura: close anonymous execution on booking SECURITY DEFINER RPCs
-- Apply this migration in Supabase SQL Editor after reviewing it.
-- Keeps authenticated browser workflows and service-role backend workflows.

begin;

-- These functions are intentionally callable by logged-in users, but never
-- by anon/PUBLIC. Each function also performs its own participant/admin check.
revoke all on function public.admin_cancel_booking_and_refund_bride(uuid, text) from public, anon;
grant execute on function public.admin_cancel_booking_and_refund_bride(uuid, text) to authenticated, service_role;

revoke all on function public.bride_respond_to_travel_fee_quote(uuid, boolean) from public, anon;
grant execute on function public.bride_respond_to_travel_fee_quote(uuid, boolean) to authenticated, service_role;

revoke all on function public.mua_submit_travel_fee_quote(uuid, numeric) from public, anon;
grant execute on function public.mua_submit_travel_fee_quote(uuid, numeric) to authenticated, service_role;

-- Use a safer fixed search path for SECURITY DEFINER functions.
alter function public.admin_cancel_booking_and_refund_bride(uuid, text)
  set search_path = pg_catalog, public;

alter function public.bride_respond_to_travel_fee_quote(uuid, boolean)
  set search_path = pg_catalog, public;

alter function public.mua_submit_travel_fee_quote(uuid, numeric)
  set search_path = pg_catalog, public;

alter function public.confirm_booking_and_handle_payment(uuid)
  set search_path = pg_catalog, public, pg_temp;

-- Explicitly reject unauthenticated callers and use a NULL-safe ownership check.
create or replace function public.confirm_booking_and_handle_payment(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_booking record;
  v_wallet_id uuid;
  v_available numeric;
  v_payment_amount numeric;
  v_deposit_amount numeric;
  v_start timestamptz;
  v_end timestamptz;
  v_duration integer;
  v_conflict record;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in to confirm this booking';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.mua_id is distinct from auth.uid() then
    raise exception 'You are not allowed to confirm this booking';
  end if;

  if v_booking.status <> 'pending' then
    raise exception 'Only pending bookings can be confirmed';
  end if;

  v_duration := coalesce(v_booking.service_duration_minutes, 120);

  if v_booking.start_time is not null
     and v_booking.end_time is not null then
    v_start := v_booking.start_time;
    v_end := v_booking.end_time;
  else
    v_start := (
      v_booking.booking_date + v_booking.booking_time
    ) at time zone 'Africa/Cairo';

    v_end := v_start + make_interval(mins => v_duration);
  end if;

  if v_start is null or v_end is null or v_end <= v_start then
    raise exception 'Invalid booking date or time';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_booking.mua_id::text, 0)
  );

  select *
  into v_conflict
  from public.check_mua_time_conflict(
    v_booking.mua_id,
    v_start,
    v_end
  )
  where not (
    conflict_type = 'booking'
    and conflict_id = p_booking_id
  )
  limit 1;

  if found then
    raise exception 'This booking overlaps with another booking or blocked time.';
  end if;

  if coalesce(v_booking.payment_method, '') in (
    'wallet',
    'credit_balance'
  ) then
    v_payment_amount := coalesce(v_booking.total_price, 0);

    if v_payment_amount <= 0 then
      raise exception 'Booking payment amount is invalid';
    end if;

    insert into public.wallets (
      user_id,
      user_type,
      available_balance,
      pending_balance,
      frozen_balance,
      total_earned,
      total_withdrawn
    )
    values (
      v_booking.bride_id,
      'bride',
      0,
      0,
      0,
      0,
      0
    )
    on conflict (user_id, user_type) do nothing;

    select id, available_balance
    into v_wallet_id, v_available
    from public.wallets
    where user_id = v_booking.bride_id
      and user_type = 'bride'
    for update;

    if coalesce(v_available, 0) < v_payment_amount then
      raise exception 'Bride credit balance is no longer enough for this booking';
    end if;

    update public.wallets
    set
      available_balance = available_balance - v_payment_amount,
      updated_at = now()
    where id = v_wallet_id;

    insert into public.wallet_transactions (
      wallet_id,
      user_id,
      user_type,
      booking_id,
      transaction_type,
      amount,
      status,
      description
    )
    values (
      v_wallet_id,
      v_booking.bride_id,
      'bride',
      p_booking_id,
      'wallet_payment',
      v_payment_amount,
      'completed',
      'Booking paid using Beaura credit balance'
    );

    update public.bookings
    set
      status = 'confirmed',
      wallet_charged = true,
      wallet_charged_at = now(),
      wallet_credit_amount = v_payment_amount,
      amount_due_after_wallet = 0,
      payment_status = 'paid'
    where id = p_booking_id;

  elsif coalesce(v_booking.payment_method, '') = 'transfer' then
    if coalesce(v_booking.total_price, 0) <= 0 then
      raise exception 'Booking payment amount is invalid';
    end if;

    v_deposit_amount := round(
      coalesce(v_booking.total_price, 0) * 0.50,
      2
    );

    update public.bookings
    set
      status = 'confirmed_payment_pending',
      wallet_charged = false,
      wallet_charged_at = null,
      wallet_credit_amount = 0,
      amount_due_after_wallet = v_deposit_amount,
      payment_status = 'pending'
    where id = p_booking_id;

    insert into public.notifications (
      user_id,
      actor_id,
      booking_id,
      type,
      title,
      message,
      href,
      is_read
    )
    values (
      v_booking.bride_id,
      v_booking.mua_id,
      p_booking_id,
      'booking_payment_required',
      'Your booking has been accepted!',
      'Your makeup artist accepted your booking. Please submit your 50% deposit within 48 hours to continue.',
      '/bride/bookings/' || p_booking_id::text || '/payment',
      false
    );

  else
    raise exception 'Unsupported booking payment method';
  end if;
end;
$function$;

commit;
