"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  MessageSquareWarning,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";

type Artist = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  verified: boolean | null;
  status: string | null;
  beaura_tier: string | null;
  cities: string[] | null;
};

type MonitoringRow = {
  artist: Artist;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  artistCancellations: number;
  disputes: number;
  complaints: number;
  completionRate: number;
};

type DataRow = Record<string, any>;

export default function AdminArtistMonitoringPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [bookings, setBookings] = useState<DataRow[]>([]);
  const [reports, setReports] = useState<DataRow[]>([]);
  const [disputes, setDisputes] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "attention" | "suspended">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [artistsRes, bookingsRes, reportsRes, disputesRes] = await Promise.all([
      supabase.from("mua_profiles").select("id, first_name, last_name, verified, status, beaura_tier, cities").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*"),
      supabase.from("reports").select("*"),
      supabase.from("disputes").select("*"),
    ]);

    const failures = [
      artistsRes.error && `Artists: ${artistsRes.error.message}`,
      bookingsRes.error && `Bookings: ${bookingsRes.error.message}`,
      reportsRes.error && `Reports: ${reportsRes.error.message}`,
      disputesRes.error && `Disputes: ${disputesRes.error.message}`,
    ].filter(Boolean) as string[];

    if (failures.length) {
      setError(failures.join(" · "));
      setArtists((artistsRes.data || []) as Artist[]);
      setBookings(bookingsRes.data || []);
      setReports(reportsRes.data || []);
      setDisputes(disputesRes.data || []);
    } else {
      setArtists((artistsRes.data || []) as Artist[]);
      setBookings(bookingsRes.data || []);
      setReports(reportsRes.data || []);
      setDisputes(disputesRes.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
    const channel = supabase
      .channel("admin-artist-monitoring")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "mua_profiles" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "disputes" }, () => void loadData())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadData]);

  const rows = useMemo<MonitoringRow[]>(() => artists.map((artist) => {
    const artistBookings = bookings.filter((booking) => booking.mua_id === artist.id);
    const completedBookings = artistBookings.filter((booking) =>
      String(booking.status || "").toLowerCase() === "completed" || booking.completed_by_mua === true
    ).length;
    const cancelledRows = artistBookings.filter((booking) =>
      String(booking.status || "").toLowerCase() === "cancelled" || Boolean(booking.cancelled_at)
    );
    const artistCancellations = cancelledRows.filter((booking) => {
      const actor = String(booking.cancelled_by || "").toLowerCase();
      return actor === artist.id.toLowerCase() || actor === "mua" || actor === "artist";
    }).length;
    const complaintCount = reports.filter((report) => report.reported_user_id === artist.id).length;
    const disputeCount = disputes.filter((dispute) => dispute.mua_id === artist.id).length;
    return {
      artist,
      totalBookings: artistBookings.length,
      completedBookings,
      cancelledBookings: cancelledRows.length,
      artistCancellations,
      disputes: disputeCount,
      complaints: complaintCount,
      completionRate: artistBookings.length ? Math.round((completedBookings / artistBookings.length) * 100) : 0,
    };
  }), [artists, bookings, reports, disputes]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const name = `${row.artist.first_name || ""} ${row.artist.last_name || ""}`.toLowerCase();
      const matchesSearch = name.includes(term) || (row.artist.cities || []).join(" ").toLowerCase().includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "suspended" && row.artist.status === "suspended") ||
        (filter === "attention" && (row.artistCancellations > 0 || row.complaints > 0 || row.disputes > 0 || row.artist.status === "suspended"));
      return matchesSearch && matchesFilter;
    }).sort((a, b) =>
      (b.complaints + b.disputes + b.artistCancellations) - (a.complaints + a.disputes + a.artistCancellations) ||
      b.totalBookings - a.totalBookings
    );
  }, [rows, search, filter]);

  const totals = useMemo(() => ({
    artists: artists.length,
    completed: rows.reduce((sum, row) => sum + row.completedBookings, 0),
    cancellations: rows.reduce((sum, row) => sum + row.cancelledBookings, 0),
    complaints: rows.reduce((sum, row) => sum + row.complaints, 0),
    disputes: rows.reduce((sum, row) => sum + row.disputes, 0),
  }), [artists.length, rows]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 text-[#211823]">
      <header className="rounded-[2rem] border border-[#eadff5] bg-gradient-to-br from-[#fff8fc] via-white to-[#f8f2ff] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Beaura · Admin operations</p>
            <h1 className="mt-3 text-4xl font-light tracking-[-0.07em] text-[#171018] sm:text-6xl">Artist monitoring</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6077]">
              Review artist booking outcomes, cancellations, complaints and disputes. Artists with more reported issues appear first.
            </p>
          </div>
          <button onClick={() => void loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#171018] px-5 py-3 text-sm text-white disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Some monitoring data could not be loaded: {error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Artists monitored" value={totals.artists} icon={<UserRound size={18} />} />
        <SummaryCard label="Completed bookings" value={totals.completed} icon={<CheckCircle2 size={18} />} />
        <SummaryCard label="Cancelled bookings" value={totals.cancellations} icon={<XCircle size={18} />} />
        <SummaryCard label="Reports against artists" value={totals.complaints} icon={<MessageSquareWarning size={18} />} />
        <SummaryCard label="Disputes involving artists" value={totals.disputes} icon={<AlertTriangle size={18} />} />
      </section>

      <p className="rounded-2xl border border-[#eadff5] bg-[#faf7ff] p-4 text-xs leading-5 text-[#6f6077]">
        Artist ratings are not included in this view yet. The current connected review data source could not be confirmed, so no rating averages or scores are displayed.
      </p>

      <section className="rounded-[1.6rem] border border-[#eadff5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8c9e]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search artist or city..." className="h-12 w-full rounded-xl border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "attention", "suspended"] as const).map((value) => (
              <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2.5 text-xs font-medium capitalize ${filter === value ? "bg-[#171018] text-white" : "border border-[#eadff5] bg-white text-[#6f6077]"}`}>
                {value === "all" ? "All artists" : value === "attention" ? "Needs attention" : "Suspended"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">Loading artist activity...</div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center text-sm text-[#6f6077]">No artists match this filter.</div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredRows.map((row) => {
            const name = `${row.artist.first_name || ""} ${row.artist.last_name || ""}`.trim() || "Unnamed artist";
            const attention = row.artistCancellations > 0 || row.complaints > 0 || row.disputes > 0 || row.artist.status === "suspended";
            return (
              <article key={row.artist.id} className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">{name}</h2>
                    <p className="mt-1 text-xs text-[#817386]">{row.artist.cities?.join(" · ") || "No cities listed"} · {row.artist.beaura_tier || "standard"} tier</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${row.artist.status === "suspended" ? "bg-red-50 text-red-700" : attention ? "bg-amber-50 text-amber-800" : "bg-[#f7efff] text-purple-700"}`}>
                    {row.artist.status === "suspended" ? "Suspended" : attention ? "Needs review" : row.artist.verified ? "Verified" : "Pending verification"}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Metric label="Total bookings" value={row.totalBookings} />
                  <Metric label="Completed" value={row.completedBookings} />
                  <Metric label="Completion rate" value={`${row.completionRate}%`} />
                  <Metric label="Cancellations" value={row.cancelledBookings} />
                  <Metric label="Artist cancellations" value={row.artistCancellations} />
                  <Metric label="Complaints" value={row.complaints} />
                  <Metric label="Disputes" value={row.disputes} />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e8f2] pt-4">
                  <p className="text-xs text-[#817386]">Review booking and report details before taking action.</p>
                  <Link href="/admin/bookings" className="text-sm font-medium text-purple-700 hover:underline">View bookings</Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/reports" className="text-purple-700 hover:underline">Open reports & disputes</Link>
        <Link href="/admin/cancellation-requests" className="text-purple-700 hover:underline">Open cancellation queue</Link>
        <Link href="/admin/muas" className="text-purple-700 hover:underline">Manage artist profiles</Link>
      </div>
      <p className="text-xs leading-5 text-[#8a7d91]">
        Completion rate is completed bookings divided by all bookings recorded for that artist. A complaint is counted when the artist is the reported user. Artist-attributed cancellations are counted only when the cancellation actor is recorded as that artist’s ID, “mua”, or “artist”.
      </p>
    </main>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadff5] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-xs text-[#817386]"><span>{label}</span><span className="text-purple-700">{icon}</span></div>
      <p className="mt-3 text-3xl font-light tabular-nums text-[#171018]">{value.toLocaleString("en-EG")}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-[#fffafc] p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#95879a]">{label}</p>
      <p className="mt-1 text-xl font-light tabular-nums text-[#211823]">{value}</p>
    </div>
  );
}
