"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock3, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type AuditRow = {
  id: number;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  changed_fields: Record<string, { before?: unknown; after?: unknown }>;
  created_at: string;
};

type AlertItem = {
  id: string;
  severity: "high" | "review";
  title: string;
  detail: string;
  row: AuditRow;
};

const LABELS: Record<string, string> = {
  bookings: "Booking",
  mua_profiles: "Artist profile",
  promo_codes: "Promo code",
  booking_cancellation_requests: "Cancellation request",
  payout_requests: "Payout request",
  wallet_cash_requests: "Wallet request",
  support_tickets: "Support ticket",
  reports: "Report",
};

const MONEY_FIELDS = /payment|payout|refund|deposit|wallet|amount|fee|price|total|balance|transfer/i;
const STATUS_FIELDS = /status|verified|suspend|cancel|complete|approve|reject/i;

function cairoDate(value: string) {
  return new Date(value).toLocaleString("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  });
}

function fieldNames(row: AuditRow) {
  return Object.keys(row.changed_fields || {});
}

function buildAlerts(rows: AuditRow[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const row of rows) {
    const fields = fieldNames(row);
    const subject = LABELS[row.table_name] || row.table_name.replaceAll("_", " ");
    if (row.action === "DELETE") {
      alerts.push({
        id: `delete-${row.id}`,
        severity: "high",
        title: `${subject} deleted`,
        detail: `A record was deleted. Review the audit entry and confirm the action was expected.`,
        row,
      });
      continue;
    }

    const moneyChanges = fields.filter((field) => MONEY_FIELDS.test(field));
    if (moneyChanges.length) {
      alerts.push({
        id: `money-${row.id}`,
        severity: "review",
        title: "Financial field changed",
        detail: `Changed: ${moneyChanges.map((field) => field.replaceAll("_", " ")).join(", ")}. Check that the amount or payment update is correct.`,
        row,
      });
    }

    const statusChanges = fields.filter((field) => STATUS_FIELDS.test(field));
    if (statusChanges.length) {
      alerts.push({
        id: `status-${row.id}`,
        severity: "review",
        title: "Status or approval changed",
        detail: `Changed: ${statusChanges.map((field) => field.replaceAll("_", " ")).join(", ")}. Confirm the decision matches the case.`,
        row,
      });
    }
  }

  const byActor = new Map<string, AuditRow[]>();
  for (const row of rows) {
    if (!row.actor_id) continue;
    const group = byActor.get(row.actor_id) || [];
    group.push(row);
    byActor.set(row.actor_id, group);
  }

  for (const [actor, actorRows] of byActor) {
    const sorted = [...actorRows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    for (let index = 0; index < sorted.length; index++) {
      const newest = sorted[index];
      const windowStart = Date.parse(newest.created_at) - 10 * 60 * 1000;
      const burst = sorted.filter((row) => {
        const time = Date.parse(row.created_at);
        return time >= windowStart && time <= Date.parse(newest.created_at);
      });
      if (burst.length >= 5) {
        alerts.push({
          id: `burst-${actor}-${newest.id}`,
          severity: "high",
          title: "Unusually frequent activity",
          detail: `${burst.length} recorded changes by the same actor within 10 minutes. Review whether this activity was expected.`,
          row: newest,
        });
        break;
      }
    }
  }

  return alerts.sort((a, b) => Date.parse(b.row.created_at) - Date.parse(a.row.created_at));
}

export default function AdminActivityAlertsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"alerts" | "activity">("alerts");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("admin_audit_logs")
      .select("id, table_name, record_id, action, actor_id, changed_fields, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (queryError) {
      setError(queryError.message);
      setRows([]);
    } else {
      setRows((data || []) as AuditRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-activity-alerts-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_audit_logs" }, (payload) => {
        setRows((current) => [payload.new as AuditRow, ...current].slice(0, 500));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const alerts = useMemo(() => buildAlerts(rows), [rows]);
  const visibleAlerts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return alerts.filter((alert) => [
      alert.title,
      alert.detail,
      alert.row.table_name,
      alert.row.record_id,
      alert.row.actor_id,
    ].join(" ").toLowerCase().includes(term));
  }, [alerts, search]);
  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => [
      row.table_name,
      row.record_id,
      row.actor_id,
      row.action,
      JSON.stringify(row.changed_fields || {}),
    ].join(" ").toLowerCase().includes(term));
  }, [rows, search]);

  const highCount = alerts.filter((alert) => alert.severity === "high").length;
  const reviewCount = alerts.filter((alert) => alert.severity === "review").length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 text-[#171018]">
      <header className="rounded-[2rem] border border-[#eadff5] bg-gradient-to-br from-white via-[#fffafc] to-[#f7efff] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-purple-700"><ShieldAlert size={15} /> Admin · Monitoring</p>
            <h1 className="mt-3 text-4xl font-light tracking-[-0.07em]">Activity & alerts</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6077]">A review queue built from Beaura's audit history. It highlights deletions, financial or status changes, and unusually frequent recorded activity.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadff5] bg-white px-5 py-3 text-sm disabled:opacity-50"><RefreshCw size={15} /> Refresh</button>
        </div>
      </header>

      <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm leading-6 text-[#6f6077]">
        These are rule-based review flags, not proof of fraud or unauthorized access. This page only sees changes captured by the audit log; failed logins and activity outside the audited tables are not currently tracked.
      </div>

      {error && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Activity could not be loaded: {error}. Check the audit-log migration and your admin access.</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#eadff5] bg-white p-5"><p className="text-sm text-[#6f6077]">High-priority flags</p><p className="mt-2 text-3xl font-light">{highCount}</p><p className="mt-1 text-xs text-[#8a7d91]">Deletions and activity bursts</p></article>
        <article className="rounded-2xl border border-[#eadff5] bg-white p-5"><p className="text-sm text-[#6f6077]">Needs review</p><p className="mt-2 text-3xl font-light">{reviewCount}</p><p className="mt-1 text-xs text-[#8a7d91]">Financial and status changes</p></article>
        <article className="rounded-2xl border border-[#eadff5] bg-white p-5"><p className="text-sm text-[#6f6077]">Audit events loaded</p><p className="mt-2 text-3xl font-light">{rows.length}</p><p className="mt-1 text-xs text-[#8a7d91]">Latest 500 entries</p></article>
      </section>

      <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-full border border-[#eadff5] bg-[#fffafc] p-1">
            <button onClick={() => setView("alerts")} className={`rounded-full px-4 py-2 text-sm ${view === "alerts" ? "bg-[#171018] text-white" : "text-[#6f6077]"}`}>Alerts ({alerts.length})</button>
            <button onClick={() => setView("activity")} className={`rounded-full px-4 py-2 text-sm ${view === "activity" ? "bg-[#171018] text-white" : "text-[#6f6077]"}`}>All activity ({rows.length})</button>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records, actors, or fields..." className="h-11 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-10 pr-4 text-sm outline-none focus:border-purple-400" />
          </div>
        </div>

        {loading ? <div className="py-14 text-center text-sm text-[#6f6077]">Loading activity…</div> : view === "alerts" ? (
          visibleAlerts.length === 0 ? <div className="py-14 text-center"><Activity className="mx-auto text-purple-500" size={26} /><p className="mt-3 text-sm font-medium">No review flags found</p><p className="mt-1 text-xs text-[#8a7d91]">New flags appear when matching audit events are recorded.</p></div> :
          <div className="mt-5 space-y-3">{visibleAlerts.map((alert) => (
            <article key={alert.id} className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${alert.severity === "high" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}><AlertTriangle size={18} /></span>
                  <div><p className="font-medium">{alert.title}</p><p className="mt-1 text-sm leading-6 text-[#6f6077]">{alert.detail}</p><p className="mt-2 text-xs text-[#8a7d91]">{LABELS[alert.row.table_name] || alert.row.table_name} · Record {alert.row.record_id || "—"} · {alert.row.action}</p></div>
                </div>
                <span className="shrink-0 text-xs text-[#6f6077]">{cairoDate(alert.row.created_at)}</span>
              </div>
              <details className="mt-3 border-t border-[#eadff5] pt-3 text-xs">
                <summary className="cursor-pointer font-medium text-purple-700">View audit details</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2"><p className="break-all"><span className="text-[#8a7d91]">Actor:</span> {alert.row.actor_id || "System / unknown"}</p><p><span className="text-[#8a7d91]">Audit entry:</span> #{alert.row.id}</p></div>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-[11px]">{JSON.stringify(alert.row.changed_fields, null, 2)}</pre>
              </details>
            </article>
          ))}</div>
        ) : (
          visibleRows.length === 0 ? <div className="py-14 text-center text-sm text-[#6f6077]">No matching activity found.</div> :
          <div className="mt-5 space-y-2">{visibleRows.map((row) => (
            <article key={row.id} className="flex flex-col gap-2 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-medium">{row.action} · {LABELS[row.table_name] || row.table_name}</p><p className="mt-1 text-xs text-[#8a7d91]">Record {row.record_id || "—"} · Actor {row.actor_id || "unknown"} · #{row.id}</p></div>
              <span className="inline-flex items-center gap-1 text-xs text-[#6f6077]"><Clock3 size={13} /> {cairoDate(row.created_at)}</span>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  );
}
