-- Beaura admin audit log
-- Run this migration in Supabase SQL Editor after reviewing it.
-- Stores metadata and changed values for operational/admin tables. Sensitive
-- contact, address, payment-detail, and proof fields are deliberately omitted.

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid,
  changed_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_table_record_idx
  on public.admin_audit_logs (table_name, record_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

revoke all on public.admin_audit_logs from public, anon, authenticated;
grant select on public.admin_audit_logs to authenticated;
grant usage, select on sequence public.admin_audit_logs_id_seq to authenticated;

create or replace function public.capture_admin_audit_log()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
  v_row jsonb;
  v_changes jsonb := '{}'::jsonb;
  v_key text;
  v_record_id text;
  v_action text := TG_OP;
begin
  if TG_OP in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(OLD);
  end if;

  if TG_OP in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(NEW);
  end if;

  v_row := case when TG_OP = 'DELETE' then v_old else v_new end;
  v_record_id := coalesce(v_row ->> 'id', v_row ->> 'booking_id');

  if TG_OP = 'INSERT' then
    select coalesce(jsonb_object_agg(key, jsonb_build_object('after', value)), '{}'::jsonb)
      into v_changes
    from jsonb_each(v_new)
    where key not in (
      'email', 'phone', 'address', 'location', 'location_notes',
      'payout_details', 'bank_account', 'account_number',
      'payment_proof_url', 'proof_url', 'completion_photo_url'
    );
  elsif TG_OP = 'DELETE' then
    select coalesce(jsonb_object_agg(key, jsonb_build_object('before', value)), '{}'::jsonb)
      into v_changes
    from jsonb_each(v_old)
    where key not in (
      'email', 'phone', 'address', 'location', 'location_notes',
      'payout_details', 'bank_account', 'account_number',
      'payment_proof_url', 'proof_url', 'completion_photo_url'
    );
  else
    for v_key in
      select key
      from jsonb_each(v_new)
      where key not in (
        'email', 'phone', 'address', 'location', 'location_notes',
        'payout_details', 'bank_account', 'account_number',
        'payment_proof_url', 'proof_url', 'completion_photo_url'
      )
      and (v_old -> key) is distinct from (v_new -> key)
    loop
      v_changes := v_changes || jsonb_build_object(
        v_key,
        jsonb_build_object('before', v_old -> v_key, 'after', v_new -> v_key)
      );
    end loop;
  end if;

  insert into public.admin_audit_logs (
    table_name, record_id, action, actor_id, changed_fields
  )
  values (
    TG_TABLE_NAME,
    v_record_id,
    v_action,
    auth.uid(),
    v_changes
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

revoke all on function public.capture_admin_audit_log() from public, anon, authenticated;

drop trigger if exists audit_bookings_changes on public.bookings;
create trigger audit_bookings_changes
after insert or update or delete on public.bookings
for each row execute function public.capture_admin_audit_log();

drop trigger if exists audit_mua_profiles_changes on public.mua_profiles;
create trigger audit_mua_profiles_changes
after insert or update or delete on public.mua_profiles
for each row execute function public.capture_admin_audit_log();

drop trigger if exists audit_promo_codes_changes on public.promo_codes;
create trigger audit_promo_codes_changes
after insert or update or delete on public.promo_codes
for each row execute function public.capture_admin_audit_log();

drop trigger if exists audit_cancellation_requests_changes on public.booking_cancellation_requests;
create trigger audit_cancellation_requests_changes
after insert or update or delete on public.booking_cancellation_requests
for each row execute function public.capture_admin_audit_log();

drop trigger if exists audit_payout_requests_changes on public.payout_requests;
create trigger audit_payout_requests_changes
after insert or update or delete on public.payout_requests
for each row execute function public.capture_admin_audit_log();

drop trigger if exists audit_wallet_cash_requests_changes on public.wallet_cash_requests;
create trigger audit_wallet_cash_requests_changes
after insert or update or delete on public.wallet_cash_requests
for each row execute function public.capture_admin_audit_log();

drop trigger if exists audit_support_tickets_changes on public.support_tickets;
create trigger audit_support_tickets_changes
after insert or update or delete on public.support_tickets
for each row execute function public.capture_admin_audit_log();

drop trigger if exists audit_reports_changes on public.reports;
create trigger audit_reports_changes
after insert or update or delete on public.reports
for each row execute function public.capture_admin_audit_log();
