"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ShieldCheck, Clock3 } from "lucide-react";
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

const TABLE_LABELS: Record<string, string> = {
  bookings: "Bookings",
  mua_profiles: "Artist profiles",
  promo_codes: "Promo codes",
  booking_cancellation_requests: "Cancellation requests",
  payout_requests: "Payout requests",
  wallet_cash_requests: "Wallet requests",
  support_tickets: "Support tickets",
  reports: "Reports",
};

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatField(field: string) {
  return field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");

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
      .channel("admin-audit-log-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_audit_logs" }, (payload) => {
        setRows((current) => [payload.new as AuditRow, ...current].slice(0, 500));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const tableNames = useMemo(() => [...new Set(rows.map((row) => row.table_name))].sort(), [rows]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesAction = actionFilter === "all" || row.action === actionFilter;
      const matchesTable = tableFilter === "all" || row.table_name === tableFilter;
      const searchable = [
        row.table_name,
        row.record_id,
        row.actor_id,
        row.action,
        ...Object.keys(row.changed_fields || {}),
        JSON.stringify(row.changed_fields || {}),
      ].join(" ").toLowerCase();
      return matchesAction && matchesTable && (!term || searchable.includes(term));
    });
  }, [rows, search, actionFilter, tableFilter]);

  const actionCounts = {
    insert: rows.filter((row) => row.action === "INSERT").length,
    update: rows.filter((row) => row.action === "UPDATE").length,
    delete: rows.filter((row) => row.action === "DELETE").length,
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 text-[#171018]">
      <header className="rounded-[2rem] border border-[#eadff5] bg-gradient-to-br from-white via-[#fffafc] to-[#f7efff] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-purple-700"><ShieldCheck size={15} /> Admin · Security</p>
            <h1 className="mt-3 text-4xl font-light tracking-[-0.07em]">Audit log</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6077]">A chronological record of changes to bookings, artist profiles, promotions, refunds, payouts, support tickets and reports.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadff5] bg-white px-5 py-3 text-sm disabled:opacity-50"><RefreshCw size={15} /> Refresh</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Audit log data could not be loaded: {error}. Check that the audit migration has been run in Supabase and that your admin account is recognized.</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#eadff5] bg-white p-5"><p className="text-sm text-[#6f6077]">Created records</p><p className="mt-2 text-3xl font-light">{actionCounts.insert}</p></article>
        <article className="rounded-2xl border border-[#eadff5] bg-white p-5"><p className="text-sm text-[#6f6077]">Updated records</p><p className="mt-2 text-3xl font-light">{actionCounts.update}</p></article>
        <article className="rounded-2xl border border-[#eadff5] bg-white p-5"><p className="text-sm text-[#6f6077]">Deleted records</p><p className="mt-2 text-3xl font-light">{actionCounts.delete}</p></article>
      </section>

      <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search record ID, actor, or changed field..." className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-400" />
          </div>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-12 rounded-full border border-[#eadff5] bg-white px-4 text-sm">
            <option value="all">All actions</option><option value="INSERT">Created</option><option value="UPDATE">Updated</option><option value="DELETE">Deleted</option>
          </select>
          <select value={tableFilter} onChange={(event) => setTableFilter(event.target.value)} className="h-12 rounded-full border border-[#eadff5] bg-white px-4 text-sm">
            <option value="all">All areas</option>
            {tableNames.map((table) => <option key={table} value={table}>{TABLE_LABELS[table] || table}</option>)}
          </select>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-[#8a7d91]"><span>{filteredRows.length} entries shown · latest 500 loaded</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> Newest first</span></div>

        {loading ? <div className="py-14 text-center text-sm text-[#6f6077]">Loading audit history…</div> : filteredRows.length === 0 ? <div className="py-14 text-center text-sm text-[#6f6077]">No audit entries match these filters.</div> : (
          <div className="mt-4 space-y-3">
            {filteredRows.map((row) => (
              <details key={row.id} className="group rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
                <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.action === "DELETE" ? "bg-red-50 text-red-700" : row.action === "INSERT" ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-700"}`}>{row.action}</span>
                    <span className="text-sm font-medium">{TABLE_LABELS[row.table_name] || row.table_name}</span>
                    <span className="text-xs text-[#8a7d91]">Record: {row.record_id || "—"}</span>
                  </div>
                  <span className="text-xs text-[#6f6077]">{new Date(row.created_at).toLocaleString("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" })}</span>
                </summary>
                <div className="mt-4 grid gap-3 border-t border-[#eadff5] pt-4 sm:grid-cols-2">
                  <div><p className="text-[10px] uppercase tracking-wider text-[#8a7d91]">Actor ID</p><p className="mt-1 break-all text-xs">{row.actor_id || "System / unknown"}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-[#8a7d91]">Audit entry</p><p className="mt-1 text-xs">#{row.id}</p></div>
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-[#8a7d91]">Changed fields</p>
                    {Object.keys(row.changed_fields || {}).length === 0 ? <p className="text-xs text-[#6f6077]">No field details recorded.</p> : <div className="space-y-2">{Object.entries(row.changed_fields).map(([field, values]) => <div key={field} className="grid gap-2 rounded-xl bg-white p-3 text-xs sm:grid-cols-[180px_1fr_1fr]"><span className="font-medium">{formatField(field)}</span><span className="break-words text-[#8a7d91]">Before: {formatValue(values?.before)}</span><span className="break-words">After: {formatValue(values?.after)}</span></div>)}</div>}
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
