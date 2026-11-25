-- Beaura security hardening (single-admin setup)
-- Apply this migration in Supabase after reviewing it. It does not change the live database by itself.
-- Scope: close confirmed SECURITY DEFINER authorization gaps and repair the confirmed broad RLS policies.
-- Browser workflows continue to call the same RPC signatures.

begin;

-- ---------------------------------------------------------------------------
-- Shared authorization convention: the existing admins table is the source of
-- truth for admin access. Do not use profiles.role for admin authorization.
-- ---------------------------------------------------------------------------

-- Admin settings were readable/writable by every authenticated user.
drop policy if exists "Allow authenticated admins to insert settings" on public.admin_settings;
drop policy if exists "Allow authenticated admins to read settings" on public.admin_settings;
drop policy if exists "Allow authenticated admins to update settings" on public.admin_settings;

create policy "Admins can read settings"
on public.admin_settings for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can insert settings"
on public.admin_settings for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can update settings"
on public.admin_settings for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Bride profile details are not a public directory. Brides can see their own
-- profile; the existing admin update policy remains in force.
drop policy if exists "Allow authenticated users to read bride profiles" on public.bride_profiles;

create policy "Brides can read own profile"
on public.bride_profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
);

-- The old payout-request admin policy used USING (true), allowing every
-- authenticated user to read/update/delete every artist payout request.
drop policy if exists "Authenticated admins can manage payout requests" on public.payout_requests;

create policy "Admins can read payout requests"
on public.payout_requests for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can update payout requests"
on public.payout_requests for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Admin promo-code policies previously trusted profiles.role. Align them with
-- the admins membership table used by the rest of the admin area.
drop policy if exists "Admins can create promo codes" on public.promo_codes;
drop policy if exists "Admins can delete promo codes" on public.promo_codes;
drop policy if exists "Admins can read promo codes" on public.promo_codes;
drop policy if exists "Admins can update promo codes" on public.promo_codes;

create policy "Admins can create promo codes"
on public.promo_codes for insert to authenticated
with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can delete promo codes"
on public.promo_codes for delete to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can read promo codes"
on public.promo_codes for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can update promo codes"
on public.promo_codes for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Wallet pages need owner/admin read access. These policies do not expose
-- another customer's or artist's wallet.
alter table public.wallets enable row level security;
drop policy if exists "Wallet owners and admins can read wallets" on public.wallets;
create policy "Wallet owners and admins can read wallets"
on public.wallets for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
);

alter table public.wallet_transactions enable row level security;
drop policy if exists "Wallet owners and admins can read transactions" on public.wallet_transactions;
create policy "Wallet owners and admins can read transactions"
on public.wallet_transactions for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
);

-- The admin cash-request page reads the queue directly. Only the admin can
-- inspect all requests; state changes remain inside the guarded RPC below.
alter table public.wallet_cash_requests enable row level security;
drop policy if exists "Admins can read wallet cash requests" on public.wallet_cash_requests;
create policy "Admins can read wallet cash requests"
on public.wallet_cash_requests for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Booking completion: only the actual participant can confirm their side.
-- Both functions retain their existing argument signatures for the UI.
-- ---------------------------------------------------------------------------

create or replace function public.bride_confirm_booking_completed(
  p_booking_id uuid,
  p_completion_photo_url text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_booking public.bookings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.bride_id is distinct from auth.uid() then
    raise exception 'You are not allowed to confirm this booking.';
  end if;

  if coalesce(v_booking.status, '') in ('disputed', 'cancelled', 'cancelled_by_mua', 'cancelled_after_dispute')
     or coalesce(v_booking.status, '') like 'cancelled%' then
    raise exception 'This booking cannot be completed.';
  end if;

  if coalesce(v_booking.status, '') not in ('confirmed', 'completed') then
    raise exception 'Only confirmed, paid bookings can be completed.';
  end if;

  if not (
    coalesce(v_booking.wallet_charged, false)
    or coalesce(v_booking.card_paid, false)
    or coalesce(v_booking.payment_status, '') in ('paid', 'partially_paid')
  ) then
    raise exception 'Payment must be confirmed before completion.';
  end if;

  if coalesce(v_booking.completed_by_bride, false) then
    return;
  end if;

  update public.bookings
  set
    completed_by_bride = true,
    bride_completed_at = now(),
    status = case when completed_by_mua = true then 'completed' else status end,
    completed_at = case when completed_by_mua = true then coalesce(completed_at, now()) else completed_at end
  where id = p_booking_id;
end;
$function$;

create or replace function public.complete_booking_and_credit_mua(
  p_booking_id uuid,
  p_completion_photo_url text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_booking public.bookings%rowtype;
  v_payout numeric;
  v_wallet_id uuid;
  v_payout_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.mua_id is distinct from auth.uid() then
    raise exception 'You are not allowed to complete this booking.';
  end if;

  if coalesce(v_booking.status, '') like 'cancelled%'
     or coalesce(v_booking.status, '') = 'disputed' then
    raise exception 'Cancelled or disputed bookings cannot be completed.';
  end if;

  if coalesce(v_booking.status, '') not in ('confirmed', 'completed') then
    raise exception 'Only confirmed bookings can be completed.';
  end if;

  if not (
    coalesce(v_booking.wallet_charged, false)
    or coalesce(v_booking.card_paid, false)
    or coalesce(v_booking.payment_status, '') in ('paid', 'partially_paid')
  ) then
    raise exception 'Payment must be confirmed before completion.';
  end if;

  if coalesce(v_booking.completed_by_mua, false) then
    return;
  end if;

  v_payout := coalesce(
    v_booking.mua_payout,
    greatest(
      coalesce(v_booking.service_price, 0)
      - coalesce(v_booking.platform_fee, round(coalesce(v_booking.service_price, 0) * 0.10)),
      0
    )
  );

  if v_payout <= 0 then
    raise exception 'The booking payout amount is invalid.';
  end if;

  -- Keep the existing 48-hour release model, based on the event date.
  v_payout_at := (v_booking.booking_date::date + interval '48 hours')::timestamptz;

  insert into public.wallets (
    user_id, user_type, available_balance, pending_balance,
    frozen_balance, total_earned, total_withdrawn
  )
  values (v_booking.mua_id, 'mua', 0, 0, 0, 0, 0)
  on conflict (user_id, user_type) do nothing;

  select id into v_wallet_id
  from public.wallets
  where user_id = v_booking.mua_id and user_type = 'mua'
  for update;

  update public.bookings
  set
    completed_by_mua = true,
    mua_completed_at = now(),
    completion_photo_url = coalesce(p_completion_photo_url, completion_photo_url),
    payout_eligible_at = v_payout_at,
    status = case when completed_by_bride = true then 'completed' else status end,
    completed_at = case when completed_by_bride = true then coalesce(completed_at, now()) else completed_at end,
    payout_frozen = true,
    payout_frozen_at = coalesce(payout_frozen_at, now()),
    frozen_payout_amount = coalesce(frozen_payout_amount, v_payout)
  where id = p_booking_id;

  if not coalesce(v_booking.payout_frozen, false) then
    update public.wallets
    set frozen_balance = coalesce(frozen_balance, 0) + v_payout,
        updated_at = now()
    where id = v_wallet_id;

    insert into public.wallet_transactions (
      wallet_id, user_id, user_type, booking_id,
      transaction_type, amount, status, description
    )
    values (
      v_wallet_id, v_booking.mua_id, 'mua', v_booking.id,
      'freeze', v_payout, 'completed',
      'MUA earning frozen for 48 hours after event date'
    );
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Admin-only financial operations. The browser can still call these RPCs,
-- but only a user present in public.admins can execute their effects.
-- ---------------------------------------------------------------------------

create or replace function public.admin_add_customer_credit(
  p_user_id uuid,
  p_amount numeric,
  p_description text default 'Manual admin credit'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_wallet_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ) then
    raise exception 'Admin access required.';
  end if;

  if p_user_id is null or p_amount is null or p_amount <= 0
     or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'A valid user and positive amount are required.';
  end if;

  insert into public.wallets (
    user_id, user_type, available_balance, pending_balance,
    frozen_balance, total_earned, total_withdrawn
  )
  values (p_user_id, 'bride', 0, 0, 0, 0, 0)
  on conflict (user_id, user_type) do nothing;

  select id into v_wallet_id
  from public.wallets
  where user_id = p_user_id and user_type = 'bride'
  for update;

  update public.wallets
  set available_balance = available_balance + p_amount, updated_at = now()
  where id = v_wallet_id;

  insert into public.wallet_transactions (
    wallet_id, user_id, user_type, booking_id,
    transaction_type, amount, status, description
  )
  values (
    v_wallet_id, p_user_id, 'bride', null, 'adjustment',
    p_amount, 'completed', coalesce(p_description, 'Manual admin credit')
  );
end;
$function$;

create or replace function public.admin_process_wallet_cash_request(
  p_request_id uuid,
  p_new_status text,
  p_admin_notes text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_request public.wallet_cash_requests%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ) then
    raise exception 'Admin access required.';
  end if;

  if p_new_status not in ('approved', 'rejected', 'paid') then
    raise exception 'Invalid request status.';
  end if;

  select * into v_request
  from public.wallet_cash_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be processed.';
  end if;

  if p_new_status = 'rejected' then
    update public.wallets
    set available_balance = available_balance + v_request.amount,
        pending_balance = greatest(pending_balance - v_request.amount, 0),
        updated_at = now()
    where id = v_request.wallet_id;

    insert into public.wallet_transactions (
      wallet_id, user_id, user_type, booking_id, transaction_type,
      amount, status, description
    )
    values (
      v_request.wallet_id, v_request.user_id, v_request.user_type, null,
      case when v_request.user_type = 'mua' then 'payout_rejected' else 'refund' end,
      v_request.amount, 'cancelled',
      coalesce(p_admin_notes, 'Cash request rejected by admin')
    );
  else
    update public.wallets
    set pending_balance = greatest(pending_balance - v_request.amount, 0),
        total_withdrawn = case when v_request.user_type = 'mua'
          then total_withdrawn + v_request.amount else total_withdrawn end,
        updated_at = now()
    where id = v_request.wallet_id;

    insert into public.wallet_transactions (
      wallet_id, user_id, user_type, booking_id, transaction_type,
      amount, status, description
    )
    values (
      v_request.wallet_id, v_request.user_id, v_request.user_type, null,
      case when v_request.user_type = 'mua' then 'payout_completed' else 'refund' end,
      v_request.amount, 'completed',
      coalesce(p_admin_notes, case when v_request.user_type = 'mua'
        then 'MUA payout processed by admin' else 'Bride cash refund processed by admin' end)
    );
  end if;

  update public.wallet_cash_requests
  set status = p_new_status, admin_notes = p_admin_notes, processed_at = now()
  where id = p_request_id;
end;
$function$;

create or replace function public.admin_resolve_booking_dispute(
  p_booking_id uuid,
  p_resolution text,
  p_refund_amount numeric default 0,
  p_mua_release_amount numeric default 0,
  p_admin_notes text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_booking public.bookings%rowtype;
  v_bride_wallet_id uuid;
  v_mua_wallet_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ) then
    raise exception 'Admin access required.';
  end if;

  if p_resolution not in ('refund_bride', 'partial_refund', 'release_to_mua', 'close_no_action') then
    raise exception 'Invalid dispute resolution.';
  end if;

  if p_refund_amount is null or p_mua_release_amount is null
     or p_refund_amount < 0 or p_mua_release_amount < 0
     or p_refund_amount::text in ('NaN', 'Infinity', '-Infinity')
     or p_mua_release_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Invalid resolution amounts.';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then raise exception 'Booking not found.'; end if;
  if v_booking.status <> 'disputed' or coalesce(v_booking.dispute_resolved, false) then
    raise exception 'This booking is not awaiting dispute resolution.';
  end if;

  if p_refund_amount > 0 then
    if exists (
      select 1 from public.wallet_transactions
      where booking_id = p_booking_id and user_type = 'bride' and transaction_type = 'refund'
    ) then
      raise exception 'Bride refund already exists for this booking.';
    end if;

    insert into public.wallets (
      user_id, user_type, available_balance, pending_balance,
      frozen_balance, total_earned, total_withdrawn
    ) values (v_booking.bride_id, 'bride', 0, 0, 0, 0, 0)
    on conflict (user_id, user_type) do nothing;

    select id into v_bride_wallet_id from public.wallets
    where user_id = v_booking.bride_id and user_type = 'bride' for update;

    update public.wallets
    set available_balance = available_balance + p_refund_amount, updated_at = now()
    where id = v_bride_wallet_id;

    insert into public.wallet_transactions (
      wallet_id, user_id, user_type, booking_id, transaction_type,
      amount, status, description
    ) values (
      v_bride_wallet_id, v_booking.bride_id, 'bride', p_booking_id,
      'refund', p_refund_amount, 'completed',
      coalesce(p_admin_notes, 'Dispute resolved - refund added to bride wallet')
    );
  end if;

  if p_mua_release_amount > 0 then
    if exists (
      select 1 from public.wallet_transactions
      where booking_id = p_booking_id and user_type = 'mua'
        and transaction_type in ('earning', 'adjustment')
    ) then
      raise exception 'MUA earning already exists for this booking.';
    end if;

    insert into public.wallets (
      user_id, user_type, available_balance, pending_balance,
      frozen_balance, total_earned, total_withdrawn
    ) values (v_booking.mua_id, 'mua', 0, 0, 0, 0, 0)
    on conflict (user_id, user_type) do nothing;

    select id into v_mua_wallet_id from public.wallets
    where user_id = v_booking.mua_id and user_type = 'mua' for update;

    update public.wallets
    set available_balance = available_balance + p_mua_release_amount,
        total_earned = total_earned + p_mua_release_amount,
        updated_at = now()
    where id = v_mua_wallet_id;

    insert into public.wallet_transactions (
      wallet_id, user_id, user_type, booking_id, transaction_type,
      amount, status, description
    ) values (
      v_mua_wallet_id, v_booking.mua_id, 'mua', p_booking_id,
      'adjustment', p_mua_release_amount, 'completed',
      coalesce(p_admin_notes, 'Dispute resolved - payment released to MUA')
    );
  end if;

  update public.bookings
  set dispute_resolved = true,
      dispute_resolution = p_resolution,
      dispute_resolved_at = now(),
      dispute_admin_notes = p_admin_notes,
      refund_processed = case when p_refund_amount > 0 then true else refund_processed end,
      refund_amount = case when p_refund_amount > 0 then p_refund_amount else refund_amount end,
      refund_processed_at = case when p_refund_amount > 0 then now() else refund_processed_at end,
      status = case
        when p_resolution in ('release_to_mua', 'close_no_action') then 'completed'
        else 'cancelled_after_dispute'
      end
  where id = p_booking_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- User-initiated cash-out/payout requests: authenticate, validate role,
-- lock the wallet row, and prevent concurrent overspending.
-- ---------------------------------------------------------------------------

create or replace function public.request_mua_payout(
  p_amount numeric,
  p_payout_method text default null,
  p_payout_details text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_wallet_id uuid;
  v_available numeric;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  if not exists (select 1 from public.mua_profiles m where m.id = auth.uid()) then
    raise exception 'Only registered makeup artists can request a payout.';
  end if;
  if p_amount is null or p_amount <= 0
     or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Amount must be a valid positive number.';
  end if;

  insert into public.wallets (
    user_id, user_type, available_balance, pending_balance,
    frozen_balance, total_earned, total_withdrawn
  ) values (auth.uid(), 'mua', 0, 0, 0, 0, 0)
  on conflict (user_id, user_type) do nothing;

  select id, available_balance into v_wallet_id, v_available
  from public.wallets
  where user_id = auth.uid() and user_type = 'mua'
  for update;

  if coalesce(v_available, 0) < p_amount then raise exception 'Insufficient available balance.'; end if;

  update public.wallets
  set available_balance = available_balance - p_amount,
      pending_balance = pending_balance + p_amount,
      updated_at = now()
  where id = v_wallet_id;

  insert into public.payout_requests (
    wallet_id, mua_id, amount, payout_method, payout_details, status
  ) values (v_wallet_id, auth.uid(), p_amount, p_payout_method, p_payout_details, 'pending');

  insert into public.wallet_transactions (
    wallet_id, user_id, user_type, booking_id, transaction_type,
    amount, status, description
  ) values (
    v_wallet_id, auth.uid(), 'mua', null, 'payout_request',
    p_amount, 'pending', 'MUA requested payout'
  );
end;
$function$;

create or replace function public.request_wallet_cash_out(
  p_user_type text,
  p_amount numeric,
  p_payout_method text default null,
  p_payout_details text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_wallet_id uuid;
  v_available numeric;
  v_request_type text;
  v_transaction_type text;
  v_description text;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  if p_user_type not in ('bride', 'mua') then raise exception 'Invalid user type.'; end if;
  if p_amount is null or p_amount <= 0
     or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Amount must be a valid positive number.';
  end if;

  if p_user_type = 'bride' then
    if not exists (select 1 from public.bride_profiles b where b.id = auth.uid()) then
      raise exception 'Bride account required.';
    end if;
    v_request_type := 'cash_refund';
    v_transaction_type := 'refund';
    v_description := 'Bride requested cash refund from wallet balance';
  else
    if not exists (select 1 from public.mua_profiles m where m.id = auth.uid()) then
      raise exception 'Makeup artist account required.';
    end if;
    v_request_type := 'payout';
    v_transaction_type := 'payout_request';
    v_description := 'MUA requested payout from wallet balance';
  end if;

  insert into public.wallets (
    user_id, user_type, available_balance, pending_balance,
    frozen_balance, total_earned, total_withdrawn
  ) values (auth.uid(), p_user_type, 0, 0, 0, 0, 0)
  on conflict (user_id, user_type) do nothing;

  select id, available_balance into v_wallet_id, v_available
  from public.wallets
  where user_id = auth.uid() and user_type = p_user_type
  for update;

  if coalesce(v_available, 0) < p_amount then raise exception 'Insufficient available balance.'; end if;

  update public.wallets
  set available_balance = available_balance - p_amount,
      pending_balance = pending_balance + p_amount,
      updated_at = now()
  where id = v_wallet_id;

  insert into public.wallet_cash_requests (
    wallet_id, user_id, user_type, request_type, amount,
    payout_method, payout_details, status
  ) values (
    v_wallet_id, auth.uid(), p_user_type, v_request_type, p_amount,
    p_payout_method, p_payout_details, 'pending'
  );

  insert into public.wallet_transactions (
    wallet_id, user_id, user_type, booking_id, transaction_type,
    amount, status, description
  ) values (
    v_wallet_id, auth.uid(), p_user_type, null, v_transaction_type,
    p_amount, 'pending', v_description
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- Conversation RPC must never trust the caller-supplied artist ID.
-- ---------------------------------------------------------------------------

create or replace function public.get_mua_conversations(mua_user_id uuid)
returns table(id uuid, bride_id uuid, created_at timestamptz, unread_count bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  if mua_user_id is distinct from auth.uid() then
    raise exception 'You can only view your own conversations.';
  end if;

  return query
  select c.id, c.bride_id, c.created_at,
         count(m.id) filter (where m.is_read = false and m.sender_id <> auth.uid()) as unread_count
  from public.conversations c
  left join public.messages m on m.conversation_id = c.id
  where c.mua_id = auth.uid()
  group by c.id, c.bride_id, c.created_at;
end;
$function$;

-- Promo usage can only be finalized for a real, paid booking by its bride
-- (or by an admin). The booking row lock and unique booking check make retries safe.
create or replace function public.finalize_booking_promo_usage(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_booking public.bookings%rowtype;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then raise exception 'Booking not found.'; end if;

  if v_booking.bride_id is distinct from auth.uid()
     and not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'You are not allowed to finalize this promotion.';
  end if;

  if v_booking.promo_code_id is null or coalesce(v_booking.discount_amount, 0) <= 0 then
    return;
  end if;

  if coalesce(v_booking.status, '') not in ('confirmed', 'completed') then
    raise exception 'Promotion usage can only be finalized after payment confirmation.';
  end if;

  if not (
    coalesce(v_booking.wallet_charged, false)
    or coalesce(v_booking.card_paid, false)
    or coalesce(v_booking.payment_status, '') in ('paid', 'partially_paid')
  ) then
    raise exception 'Payment must be confirmed before finalizing promotion usage.';
  end if;

  if exists (select 1 from public.promo_code_uses u where u.booking_id = p_booking_id) then
    return;
  end if;

  insert into public.promo_code_uses (
    promo_code_id, bride_id, booking_id, discount_amount, used_at
  ) values (
    v_booking.promo_code_id, v_booking.bride_id, v_booking.id,
    v_booking.discount_amount, now()
  );

  update public.promo_codes
  set used_count = used_count + 1, updated_at = now()
  where id = v_booking.promo_code_id;
end;
$function$;

-- Explicit NULL-safe participant checks for the two cancellation RPCs.
create or replace function public.bride_cancel_booking_and_refund(
  p_booking_id uuid,
  p_reason text default 'Cancelled by bride'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_booking public.bookings%rowtype;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.'; end if;
  if v_booking.bride_id is distinct from auth.uid() then
    raise exception 'You are not allowed to cancel this booking.';
  end if;
  if coalesce(v_booking.status, '') in ('completed', 'disputed')
     or coalesce(v_booking.status, '') like 'cancelled%' then
    raise exception 'This booking cannot be cancelled.';
  end if;
  if coalesce(v_booking.refund_processed, false) then
    raise exception 'Refund already processed for this booking.';
  end if;

  update public.bookings
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = 'bride',
      cancellation_reason = coalesce(p_reason, 'Cancelled by bride'),
      refund_processed = false,
      refund_amount = 0,
      refund_processed_at = null
  where id = p_booking_id;
end;
$function$;

create or replace function public.mua_cancel_booking_and_refund_bride(
  p_booking_id uuid,
  p_reason text default 'Cancelled by MUA'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_booking public.bookings%rowtype;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.'; end if;
  if v_booking.mua_id is distinct from auth.uid() then
    raise exception 'You are not allowed to cancel this booking.';
  end if;
  if coalesce(v_booking.status, '') in ('completed', 'disputed')
     or coalesce(v_booking.status, '') like 'cancelled%' then
    raise exception 'This booking cannot be cancelled.';
  end if;
  if coalesce(v_booking.refund_processed, false) then
    raise exception 'Refund already processed for this booking.';
  end if;

  update public.bookings
  set status = 'cancelled_by_mua',
      cancelled_at = now(),
      cancelled_by = 'mua',
      cancellation_reason = coalesce(p_reason, 'Cancelled by MUA'),
      refund_processed = false,
      refund_amount = 0,
      refund_processed_at = null
  where id = p_booking_id;
end;
$function$;

-- The cancellation trigger must derive the actor from the authenticated user,
-- not from the caller-editable cancelled_by field.
create or replace function public.create_booking_cancellation_request()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_role text;
  v_actor uuid;
  v_days integer;
  v_paid numeric := 0;
  v_refund numeric := 0;
  v_repayment numeric := 0;
  v_eligible boolean := false;
  v_repayment_status text := 'not_required';
  v_refund_status text := 'not_due';
  v_request_status text := 'awaiting_admin_decision';
begin
  if new.status not like 'cancelled%' or old.status like 'cancelled%' then
    return new;
  end if;

  v_actor := auth.uid();

  if v_actor is not null and v_actor = new.bride_id then
    v_role := 'bride';
  elsif v_actor is not null and v_actor = new.mua_id then
    v_role := 'mua';
  elsif v_actor is not null and exists (
    select 1 from public.admins a where a.user_id = v_actor
  ) then
    v_role := 'admin';
  else
    raise exception 'Unauthorized booking cancellation actor.';
  end if;

  v_days := new.booking_date::date - current_date;

  if coalesce(new.wallet_charged, false) then
    v_paid := coalesce(new.wallet_credit_amount, new.total_price, 0);
  elsif coalesce(new.card_paid, false) or coalesce(new.payment_status, '') in ('paid', 'partially_paid') then
    v_paid := coalesce(new.total_price, 0);
  else
    v_paid := 0;
  end if;

  if v_role = 'bride' then
    v_eligible := v_days >= 7;
    if v_eligible then
      v_refund := greatest(0, v_paid - coalesce(new.platform_fee, 0));
      select coalesce(amount, 0) into v_repayment
      from public.booking_deposit_transfers
      where booking_id = new.id
      limit 1;
      if coalesce(v_repayment, 0) > 0 then
        v_repayment_status := 'pending';
        v_request_status := 'awaiting_mua_repayment';
      end if;
    else
      v_refund := 0;
      v_eligible := false;
    end if;
  else
    v_eligible := true;
    v_refund := v_paid;
  end if;

  if v_refund > 0 then v_refund_status := 'pending'; end if;

  if exists (select 1 from public.booking_cancellation_requests r where r.booking_id = new.id) then
    return new;
  end if;

  insert into public.booking_cancellation_requests (
    booking_id, requested_by, requested_by_role, reason, event_date,
    days_before_event, refund_eligible, refund_amount, platform_fee_refund_amount,
    mua_repayment_amount, repayment_deadline, repayment_status, refund_status, request_status
  ) values (
    new.id, v_actor, v_role, coalesce(new.cancellation_reason, 'Booking cancelled'),
    new.booking_date::date, v_days, v_eligible, v_refund, 0,
    coalesce(v_repayment, 0),
    case when v_repayment_status = 'pending' then now() + interval '48 hours' else null end,
    v_repayment_status, v_refund_status, v_request_status
  );

  return new;
end;
$function$;

-- The payout-release function moves real money balances. It is not a browser
-- RPC: only service_role/backend automation may execute it.
revoke all on function public.release_eligible_mua_payouts() from public, anon, authenticated;
grant execute on function public.release_eligible_mua_payouts() to service_role;

-- Remove anonymous/public execution from privileged financial RPCs. Admin
-- checks are inside the functions; authenticated admin UI calls remain valid.
revoke all on function public.admin_add_customer_credit(uuid, numeric, text) from public, anon;
grant execute on function public.admin_add_customer_credit(uuid, numeric, text) to authenticated;

revoke all on function public.admin_process_wallet_cash_request(uuid, text, text) from public, anon;
grant execute on function public.admin_process_wallet_cash_request(uuid, text, text) to authenticated;

revoke all on function public.admin_resolve_booking_dispute(uuid, text, numeric, numeric, text) from public, anon;
grant execute on function public.admin_resolve_booking_dispute(uuid, text, numeric, numeric, text) to authenticated;

revoke all on function public.complete_booking_and_credit_mua(uuid, text) from public, anon;
grant execute on function public.complete_booking_and_credit_mua(uuid, text) to authenticated;

revoke all on function public.bride_confirm_booking_completed(uuid, text) from public, anon;
grant execute on function public.bride_confirm_booking_completed(uuid, text) to authenticated;

revoke all on function public.bride_cancel_booking_and_refund(uuid, text) from public, anon;
grant execute on function public.bride_cancel_booking_and_refund(uuid, text) to authenticated;

revoke all on function public.mua_cancel_booking_and_refund_bride(uuid, text) from public, anon;
grant execute on function public.mua_cancel_booking_and_refund_bride(uuid, text) to authenticated;

revoke all on function public.request_mua_payout(numeric, text, text) from public, anon;
grant execute on function public.request_mua_payout(numeric, text, text) to authenticated;

revoke all on function public.request_wallet_cash_out(text, numeric, text, text) from public, anon;
grant execute on function public.request_wallet_cash_out(text, numeric, text, text) to authenticated;

revoke all on function public.get_mua_conversations(uuid) from public, anon;
grant execute on function public.get_mua_conversations(uuid) to authenticated;

revoke all on function public.finalize_booking_promo_usage(uuid) from public, anon;
grant execute on function public.finalize_booking_promo_usage(uuid) to authenticated;

-- Internal trigger helpers must not be callable as ordinary RPCs.
revoke all on function public.create_booking_cancellation_request() from public, anon, authenticated;
revoke all on function public.set_booking_deposit_transfer_funding_split() from public, anon, authenticated;

-- The old immediate-credit helper is not used by the current completion UI;
-- keep it out of browser reach to avoid bypassing the frozen-payout lifecycle.
revoke all on function public.credit_mua_for_completed_booking(uuid, text) from public, anon, authenticated;
grant execute on function public.credit_mua_for_completed_booking(uuid, text) to service_role;

commit;
