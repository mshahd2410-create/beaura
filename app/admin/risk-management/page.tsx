"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, MessageSquareWarning, RefreshCw, Search, ShieldCheck, Users, UserRound, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  verified?: boolean | null;
  cities?: string[] | null;
};

type Booking = {
  id: string;
  bride_id: string | null;
  mua_id: string | null;
  status: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
};

type Report = { id: string; reported_user_id: string | null };
type Dispute = { id: string; mua_id: string | null };

type RiskRecord = {
  id: string;
  kind: "Client" | "Artist";
  name: string;
  status: string;
  verified?: boolean | null;
  location: string;
  bookings: number;
  cancellations: number;
  attributedCancellations: number;
  reports: number;
  disputes: number;
  reasons: string[];
  level: "High review" | "Needs review" | "No current flags";
};

const isCancelled = (booking: Booking) =>
  String(booking.status || "").toLowerCase() === "cancelled" || Boolean(booking.cancelled_at);

const isActorMatch = (actor: string | null | undefined, id: string, aliases: string[]) => {
  const value = String(actor || "").toLowerCase();
  return value === id.toLowerCase() || aliases.includes(value);
};

function makeRiskRecord(input: Omit<RiskRecord, "reasons" | "level">): RiskRecord {
  const reasons: string[] = [];
  if (input.status.toLowerCase() === "suspended") reasons.push("Account is currently suspended");
  if (input.attributedCancellations >= 3) reasons.push("3 or more cancellations attributed to this account");
  else if (input.attributedCancellations > 0) reasons.push("Cancellation(s) attributed to this account");
  if (input.reports > 0) reasons.push(`${input.reports} report(s) naming this account`);
  if (input.disputes > 0) reasons.push(`${input.disputes} dispute(s) involving this artist`);

  const high = input.status.toLowerCase() === "suspended" ||
    input.attributedCancellations >= 3 ||
    input.disputes >= 2 ||
    (input.reports >= 2 && input.attributedCancellations > 0);
  return {
    ...input,
    reasons,
    level: high ? "High review" : reasons.length ? "Needs review" : "No current flags",
  };
}

export default function AdminRiskManagementPage() {
  const [clients, setClients] = useState<Profile[]>([]);
  const [artists, setArtists] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "clients" | "artists" | "attention">("attention");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [clientRes, artistRes, bookingRes, reportRes, disputeRes] = await Promise.all([
      supabase.from("bride_profiles").select("id, first_name, last_name, status"),
      supabase.from("mua_profiles").select("id, first_name, last_name, status, verified, cities"),
      supabase.from("bookings").select("id, bride_id, mua_id, status, cancelled_at, cancelled_by"),
      supabase.from("reports").select("id, reported_user_id"),
      supabase.from("disputes").select("id, mua_id"),
    ]);

    const failures = [
      clientRes.error && `Clients: ${clientRes.error.message}`,
      artistRes.error && `Artists: ${artistRes.error.message}`,
      bookingRes.error && `Bookings: ${bookingRes.error.message}`,
      reportRes.error && `Reports: ${reportRes.error.message}`,
      disputeRes.error && `Disputes: ${disputeRes.error.message}`,
    ].filter(Boolean) as string[];

    setClients((clientRes.data || []) as Profile[]);
    setArtists((artistRes.data || []) as Profile[]);
    setBookings((bookingRes.data || []) as Booking[]);
    setReports((reportRes.data || []) as Report[]);
    setDisputes((disputeRes.data || []) as Dispute[]);
    if (failures.length) setError(failures.join(" · "));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
    const channel = supabase
      .channel("admin-risk-management-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bride_profiles" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "mua_profiles" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "disputes" }, () => void loadData())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadData]);

  const records = useMemo(() => {
    const clientRows = clients.map((profile) => {
      const related = bookings.filter((booking) => booking.bride_id === profile.id);
      const cancelled = related.filter(isCancelled);
      const attributed = cancelled.filter((booking) => isActorMatch(booking.cancelled_by, profile.id, ["bride", "client"]));
      return makeRiskRecord({
        id: profile.id,
        kind: "Client",
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unnamed client",
        status: profile.status || "active",
        location: "Client account",
        bookings: related.length,
        cancellations: cancelled.length,
        attributedCancellations: attributed.length,
        reports: reports.filter((report) => report.reported_user_id === profile.id).length,
        disputes: 0,
      });
    });
    const artistRows = artists.map((profile) => {
      const related = bookings.filter((booking) => booking.mua_id === profile.id);
      const cancelled = related.filter(isCancelled);
      const attributed = cancelled.filter((booking) => isActorMatch(booking.cancelled_by, profile.id, ["mua", "artist"]));
      return makeRiskRecord({
        id: profile.id,
        kind: "Artist",
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unnamed artist",
        status: profile.status || "active",
        verified: profile.verified,
        location: profile.cities?.join(" · ") || "No cities listed",
        bookings: related.length,
        cancellations: cancelled.length,
        attributedCancellations: attributed.length,
        reports: reports.filter((report) => report.reported_user_id === profile.id).length,
        disputes: disputes.filter((dispute) => dispute.mua_id === profile.id).length,
      });
    });
    return [...clientRows, ...artistRows];
  }, [clients, artists, bookings, reports, disputes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !term || record.name.toLowerCase().includes(term) ||
        record.id.toLowerCase().includes(term) || record.location.toLowerCase().includes(term);
      const matchesFilter = filter === "all" ||
        (filter === "clients" && record.kind === "Client") ||
        (filter === "artists" && record.kind === "Artist") ||
        (filter === "attention" && record.reasons.length > 0);
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      const level = (value: RiskRecord["level"]) => value === "High review" ? 2 : value === "Needs review" ? 1 : 0;
      return level(b.level) - level(a.level) || b.reports + b.disputes + b.attributedCancellations - (a.reports + a.disputes + a.attributedCancellations);
    });
  }, [records, search, filter]);

  const flagged = records.filter((record) => record.reasons.length > 0).length;
  const high = records.filter((record) => record.level === "High review").length;
  const totalReports = reports.length;
  const totalDisputes = disputes.length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 text-[#211823]">
      <header className="rounded-[2rem] border border-[#eadff5] bg-gradient-to-br from-[#fff8fc] via-white to-[#f8f2ff] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Beaura · Admin protection</p>
            <h1 className="mt-3 text-4xl font-light tracking-[-0.07em] text-[#171018] sm:text-6xl">Customer & artist risk</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6077]">A shared review workspace for client and artist accounts, using recorded cancellations, reports, disputes and account status.</p>
          </div>
          <button onClick={() => void loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#171018] px-5 py-3 text-sm text-white disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </header>

      <div className="rounded-2xl border border-[#eadff5] bg-[#faf7ff] p-4 text-xs leading-5 text-[#6f6077]">
        These are review indicators, not automatic fraud findings. A report or cancellation does not prove wrongdoing. Counts use the fields currently recorded in Beaura; client dispute counts are not shown because the existing dispute view only confirms an artist link.
      </div>

      {error && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Some risk data could not be loaded: {error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary label="Accounts monitored" value={records.length} icon={<Users size={18} />} />
        <Summary label="Flagged for review" value={flagged} icon={<AlertTriangle size={18} />} />
        <Summary label="High-priority reviews" value={high} icon={<ShieldCheck size={18} />} />
        <Summary label="Reports" value={totalReports} icon={<MessageSquareWarning size={18} />} />
        <Summary label="Artist-linked disputes" value={totalDisputes} icon={<CalendarDays size={18} />} />
      </section>

      <section className="rounded-[1.6rem] border border-[#eadff5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8c9e]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, city, or account ID..." className="h-12 w-full rounded-xl border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["attention", "all", "clients", "artists"] as const).map((value) => (
              <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2.5 text-xs font-medium capitalize ${filter === value ? "bg-[#171018] text-white" : "border border-[#eadff5] bg-white text-[#6f6077]"}`}>
                {value === "attention" ? "Needs review" : value === "all" ? "All accounts" : value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">Loading account history…</div> :
        filtered.length === 0 ? <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center text-sm text-[#6f6077]">No accounts match this filter.</div> :
        <section className="grid gap-4 lg:grid-cols-2">
          {filtered.map((record) => (
            <article key={record.kind + record.id} className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-purple-700">{record.kind}</p>
                  <h2 className="mt-1 text-2xl font-light tracking-[-0.05em] text-[#171018]">{record.name}</h2>
                  <p className="mt-1 text-xs text-[#817386]">{record.location} · {record.status}{record.kind === "Artist" ? ` · ${record.verified ? "Verified" : "Not verified"}` : ""}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${record.level === "High review" ? "bg-red-50 text-red-700" : record.level === "Needs review" ? "bg-amber-50 text-amber-800" : "bg-[#f7efff] text-purple-700"}`}>{record.level}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Bookings" value={record.bookings} />
                <Metric label="Cancellations" value={record.cancellations} />
                <Metric label="Account cancellations" value={record.attributedCancellations} />
                <Metric label="Reports" value={record.reports} />
                {record.kind === "Artist" && <Metric label="Disputes" value={record.disputes} />}
              </div>
              {record.reasons.length > 0 ? (
                <div className="mt-4 rounded-2xl bg-[#fffafc] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a7d91]">Why this account is flagged</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#6f6077]">{record.reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul>
                </div>
              ) : <p className="mt-4 text-xs text-[#8a7d91]">No current review indicators from the available records.</p>}
              <div className="mt-5 flex flex-wrap gap-3 border-t border-[#f0e8f2] pt-4 text-sm">
                <Link href={record.kind === "Artist" ? "/admin/artist-monitoring" : "/admin/brides"} className="font-medium text-purple-700 hover:underline">Open {record.kind.toLowerCase()} records</Link>
                <Link href="/admin/bookings" className="text-purple-700 hover:underline">View bookings</Link>
                <Link href="/admin/reports" className="text-purple-700 hover:underline">Reports & disputes</Link>
              </div>
            </article>
          ))}
        </section>
      }

      <div className="flex items-center gap-2 text-xs text-[#8a7d91]"><XCircle size={14} /> No accounts are automatically suspended or modified from this page.</div>
    </main>
  );
}

function Summary({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-[1.5rem] border border-[#eadff5] bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2 text-xs text-[#817386]"><span>{label}</span><span className="text-purple-700">{icon}</span></div><p className="mt-3 text-3xl font-light tabular-nums text-[#171018]">{value.toLocaleString("en-EG")}</p></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-[#fffafc] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#95879a]">{label}</p><p className="mt-1 text-xl font-light tabular-nums text-[#211823]">{value}</p></div>;
}
