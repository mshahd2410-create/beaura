"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, Search, ShieldCheck } from "lucide-react";

type CancellationRequest = {
  id: string;
  booking_id: string;
  requested_by: string;
  requested_by_role: "bride" | "mua" | "admin";
  admin_decision: "cancel_and_refunded" | "cancel_with_no_refund" | null;
  refund_status: string;
  reason: string;
  requested_at: string;
  event_date: string | null;
  days_before_event: number | null;
  refund_eligible: boolean;
  refund_amount: number;
  platform_fee_refund_amount: number;
  mua_repayment_amount: number;
  repayment_deadline: string | null;
  repayment_status: string;
  refund_status: string;
  request_status: string;
};

type Booking = {
  id: string;
  bride_id: string;
  mua_id: string;
  booking_date: string | null;
  booking_time: string | null;
  service_price: number | null;
  deposit_amount: number | null;
  travel_fee: number | null;
  status: string;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  refund_processed?: boolean | null;
  refund_amount?: number | null;
};

type BrideProfile = { id: string; first_name: string | null; last_name: string | null; phone: string | null };
type QueueFilter = "all" | "repayment" | "overdue" | "decision";

export default function CancellationRequestsPage() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [directCancellations, setDirectCancellations] = useState<Booking[]>([]);
  const [brides, setBrides] = useState<Record<string, BrideProfile>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: requestError } = await supabase
      .from("booking_cancellation_requests")
      .select("*")
      .order("requested_at", { ascending: true });
    if (requestError) {
      setError(requestError.message);
      setLoading(false);
      return;
    }
    const rows = ((data || []) as CancellationRequest[]).filter((row) => row.request_status !== "closed");
    const ids = [...new Set(rows.map((row) => row.booking_id))];
    const [{ data: bookingRows, error: bookingError }, { data: cancelledRows, error: cancelledError }] = await Promise.all([
      ids.length
        ? supabase
            .from("bookings")
            .select("id, bride_id, mua_id, booking_date, booking_time, service_price, deposit_amount, travel_fee, status")
            .in("id", ids)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("bookings")
        .select("id, bride_id, mua_id, booking_date, booking_time, service_price, deposit_amount, travel_fee, status, cancelled_at, cancelled_by, cancellation_reason, refund_processed, refund_amount")
        .like("status", "cancelled%")
        .order("cancelled_at", { ascending: false }),
    ]);
    if (bookingError || cancelledError) {
      setError(bookingError?.message || cancelledError?.message || "Could not load cancelled bookings.");
      setLoading(false);
      return;
    }
    const requestBookingIds = new Set(ids);
    const directRows = ((cancelledRows || []) as Booking[]).filter((row) => !requestBookingIds.has(row.id));
    const allBrideIds = [...new Set([
      ...(bookingRows || []).map((row: any) => row.bride_id),
      ...directRows.map((row) => row.bride_id),
    ].filter(Boolean))];
    const { data: brideRows, error: brideError } = allBrideIds.length
      ? await supabase.from("bride_profiles").select("id, first_name, last_name, phone").in("id", allBrideIds)
      : { data: [], error: null };
    if (brideError) {
      setError(brideError.message);
      setLoading(false);
      return;
    }
    setRequests(rows);
    setBookings(Object.fromEntries((bookingRows || []).map((row) => [row.id, row as Booking])));
    setDirectCancellations(directRows);
    setBrides(Object.fromEntries(((brideRows || []) as BrideProfile[]).map((row) => [row.id, row])));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-cancellation-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_cancellation_requests" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const now = Date.now();
  const isOverdue = (request: CancellationRequest) =>
    request.repayment_status === "overdue" ||
    (request.repayment_status === "pending" && !!request.repayment_deadline &&
      new Date(request.repayment_deadline).getTime() < now);

  const counts = useMemo(() => ({
    all: requests.length,
    repayment: requests.filter((r) => r.repayment_status === "pending").length,
    overdue: requests.filter(isOverdue).length,
    decision: requests.filter((r) => r.request_status === "awaiting_admin_decision" || r.repayment_status === "received").length,
  }), [requests]);

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      const booking = bookings[request.booking_id];
      const bride = booking?.bride_id ? brides[booking.bride_id] : undefined;
      const brideName = `${bride?.first_name || ""} ${bride?.last_name || ""}`.trim();
      const matchesSearch = !term || [
        request.booking_id, request.reason, request.requested_by,
        booking?.bride_id, booking?.mua_id, brideName, bride?.phone,
      ].some((value) => String(value || "").toLowerCase().includes(term));
      const matchesFilter =
        filter === "all" ||
        (filter === "repayment" && request.repayment_status === "pending") ||
        (filter === "overdue" && isOverdue(request)) ||
        (filter === "decision" && (request.request_status === "awaiting_admin_decision" || request.repayment_status === "received"));
      return matchesSearch && matchesFilter;
    });
  }, [requests, bookings, brides, search, filter]);

  async function decide(request: CancellationRequest, decision: "cancel_and_refunded" | "cancel_with_no_refund") {
    setBusyId(request.id);
    setError(null);
    setMessage(null);
    const { error: decisionError } = await supabase.rpc("admin_decide_booking_cancellation_request", {
      p_request_id: request.id,
      p_decision: decision,
      p_admin_notes: notes[request.id]?.trim() || null,
    });
    if (decisionError) {
      setError(decisionError.message);
    } else {
      setMessage(decision === "cancel_and_refunded"
        ? "Cancellation approved. The refund decision was recorded."
        : "Booking cancelled without a refund.");
      await load();
    }
    setBusyId(null);
  }

  async function markMoneyTransferred(request: CancellationRequest) {
    if (!window.confirm(`Confirm that ${money(request.refund_amount)} has actually been transferred to the bride?`)) return;
    setBusyId(request.id);
    setError(null);
    setMessage(null);
    const { error: transferError } = await supabase.rpc("admin_mark_cancellation_money_transferred", {
      p_request_id: request.id,
      p_admin_notes: notes[request.id]?.trim() || null,
    });
    if (transferError) setError(transferError.message);
    else { setMessage("Refund marked as transferred and recorded as completed."); await load(); }
    setBusyId(null);
  }

  const money = (amount: number | null | undefined) =>
    `EGP ${Number(amount || 0).toLocaleString("en-EG", { maximumFractionDigits: 2 })}`;

  const filters: { id: QueueFilter; label: string; count: number }[] = [
    { id: "all", label: "All requests", count: counts.all },
    { id: "repayment", label: "Awaiting repayment", count: counts.repayment },
    { id: "overdue", label: "Overdue", count: counts.overdue },
    { id: "decision", label: "Ready for decision", count: counts.decision },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 text-[#211823]">
      <header className="overflow-hidden rounded-[2rem] border border-[#eadfe5] bg-white shadow-sm">
        <div className="flex flex-col gap-5 bg-gradient-to-br from-[#fff8fb] via-white to-[#f8f2fb] p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a36f8c]">Beaura · Admin operations</p>
            <h1 className="mt-3 text-3xl font-light tracking-[-0.06em] sm:text-5xl">Cancellation queue</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#756975]">
              Review cancellation requests, track the MUA’s 48-hour deposit repayment window, and record the final admin decision.
            </p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#eadfe5] bg-white px-5 py-3 text-sm font-medium text-[#4f4050] transition hover:border-[#c9a9ba] disabled:opacity-50 lg:self-auto">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh queue
          </button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-[#f0e7ed] border-t border-[#f0e7ed] sm:grid-cols-4 sm:divide-y-0">
          {[
            { label: "Open requests", value: counts.all, icon: ShieldCheck },
            { label: "Awaiting repayment", value: counts.repayment, icon: Clock3 },
            { label: "Past deadline", value: counts.overdue, icon: AlertCircle },
            { label: "Ready for decision", value: counts.decision, icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            return <div key={item.label} className="p-5 sm:px-6"><div className="flex items-center gap-2 text-xs text-[#8b7d89]"><Icon size={15} />{item.label}</div><p className="mt-2 text-3xl font-light tabular-nums text-[#2a2029]">{item.value}</p></div>;
          })}
        </div>
      </header>

      {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}

      <section className="rounded-[1.6rem] border border-[#eadfe5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a493a1]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, bride name, phone, ID or reason" className="h-12 w-full rounded-xl border border-[#eee4eb] bg-[#fffafc] pl-11 pr-4 text-sm outline-none transition focus:border-[#c9a9ba]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-full px-4 py-2.5 text-xs font-medium transition ${filter === item.id ? "bg-[#2b202a] text-white" : "border border-[#eee4eb] bg-white text-[#766875] hover:border-[#c9a9ba]"}`}>{item.label} <span className={filter === item.id ? "ml-1 text-white/70" : "ml-1 text-[#a18f9e]"}>{item.count}</span></button>)}
          </div>
        </div>
      </section>

      {!loading && directCancellations.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-medium text-[#332733]">Direct cancellations</h2>
            <p className="mt-1 text-sm text-[#887b86]">Bookings cancelled without a repayment request. These are shown separately and do not automatically require an admin refund decision.</p>
          </div>
          <div className="space-y-3">
            {directCancellations.map((booking) => {
              const bride = brides[booking.bride_id];
              const brideName = `${bride?.first_name || ""} ${bride?.last_name || ""}`.trim() || booking.bride_id;
              return (
                <article key={booking.id} className="rounded-[1.5rem] border border-[#eadfe5] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a36f8c]">Cancelled booking · no open request</p>
                      <h3 className="mt-2 text-lg font-medium text-[#2b202a]">Order #{booking.id.slice(0, 8).toUpperCase()}</h3>
                      <p className="mt-1 text-sm text-[#756975]">Bride: {brideName}</p>
                      <p className="mt-1 text-sm text-[#756975]">Appointment: {booking.booking_date || "Not available"} · {booking.booking_time || "Time not available"}</p>
                      <p className="mt-2 text-sm text-[#756975]">Reason: {booking.cancellation_reason || "No reason recorded"}</p>
                      <p className="mt-1 text-xs text-[#988b96]">Cancelled: {booking.cancelled_at ? new Date(booking.cancelled_at).toLocaleString() : "Timestamp not recorded"}</p>
                    </div>
                    <div className="rounded-xl bg-[#fff8fb] px-4 py-3 sm:min-w-[180px] sm:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a08798]">Refund recorded</p>
                      <p className="mt-1 text-lg font-semibold text-[#332733]">{booking.refund_processed ? money(booking.refund_amount) : "No refund recorded"}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {loading ? (
        <div className="rounded-[1.8rem] border border-[#eadfe5] bg-white p-10 text-center text-sm text-[#887b86]">Loading cancellation requests…</div>
      ) : visibleRequests.length === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-[#e6d9e2] bg-white p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff4f8] text-[#a36f8c]"><CheckCircle2 size={22} /></div>
          <h2 className="mt-4 text-xl font-medium text-[#332733]">No requests in this view</h2>
          <p className="mt-2 text-sm text-[#887b86]">Try another filter or clear your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRequests.map((request) => {
            const booking = bookings[request.booking_id];
            const overdue = isOverdue(request);
            const deadline = request.repayment_deadline ? new Date(request.repayment_deadline) : null;
            const canDecide = !request.admin_decision && (request.request_status === "awaiting_admin_decision" || request.repayment_status === "received" || request.repayment_status === "overdue");
            const canMarkTransferred = request.admin_decision === "cancel_and_refunded" && request.refund_status === "pending";
            return (
              <article key={request.id} className="overflow-hidden rounded-[1.8rem] border border-[#eadfe5] bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#f1e8ee] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f8eff5] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#976b83]">{request.requested_by_role} request</span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${overdue ? "bg-red-50 text-red-700" : "bg-[#f6f3f6] text-[#6e626d]"}`}>{overdue ? "Repayment overdue" : request.request_status.replaceAll("_", " ")}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-medium tracking-tight text-[#2b202a]">Order #{request.booking_id.slice(0, 8).toUpperCase()}</h2>
                    <p className="mt-1 text-xs text-[#988b96]">Requested {new Date(request.requested_at).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fff8fb] px-5 py-3 sm:min-w-[190px] sm:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a08798]">MUA repayment due</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[#332733]">{money(request.mua_repayment_amount)}</p>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                  <Info label="Appointment" value={booking?.booking_date ? `${booking.booking_date} ${booking.booking_time || ""}` : request.event_date || "Not available"} />
                  <Info label="Bride" value={booking?.bride_id ? (`${brides[booking.bride_id]?.first_name || ""} ${brides[booking.bride_id]?.last_name || ""}`.trim() || booking.bride_id) : "Not available"} />
                  <Info label="Bride phone" value={booking?.bride_id ? brides[booking.bride_id]?.phone || "Not available" : "Not available"} />
                  <Info label="MUA user ID" value={booking?.mua_id || "Not available"} />
                  <Info label="Deposit recorded" value={money(booking?.deposit_amount)} />
                  <Info label="Refund eligible" value={request.refund_eligible ? "Yes" : "No"} />
                  <Info label="Refund amount" value={money(request.refund_amount)} />
                  <Info label="Fee refund" value={money(request.platform_fee_refund_amount)} />
                  <Info label="Repayment status" value={request.repayment_status.replaceAll("_", " ")} />
                </div>

                <div className="mx-5 rounded-2xl border border-[#f0e7ed] bg-[#fffafc] p-4 sm:mx-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8e7e8b]">48-hour repayment window</p>
                    <p className={`text-sm font-medium ${overdue ? "text-red-700" : "text-[#514451]"}`}>{deadline ? `${overdue ? "Overdue since" : "Deadline"} · ${deadline.toLocaleString()}` : "No repayment deadline recorded"}</p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee5eb]"><div className={`h-full rounded-full ${overdue ? "w-full bg-red-400" : request.repayment_status === "received" ? "w-full bg-emerald-400" : "w-1/2 bg-[#c49ab1]"}`} /></div>
                  <p className="mt-3 text-sm leading-6 text-[#756975]">{request.reason || "No cancellation reason was provided."}</p>
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  <textarea value={notes[request.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} rows={2} placeholder="Internal admin notes (optional)" className="w-full resize-y rounded-xl border border-[#eee4eb] bg-white p-3 text-sm outline-none transition focus:border-[#c9a9ba]" />
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {!request.admin_decision && <>
                      <button disabled={busyId === request.id || !canDecide} onClick={() => void decide(request, "cancel_and_refunded")} className="rounded-full bg-[#2b202a] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#493747] disabled:cursor-not-allowed disabled:opacity-40">{busyId === request.id ? "Saving…" : "Refund"}</button>
                      <button disabled={busyId === request.id || !canDecide} onClick={() => void decide(request, "cancel_with_no_refund")} className="rounded-full border border-[#e7dce4] px-5 py-3 text-sm font-medium text-[#5f5260] transition hover:bg-[#fff8fb] disabled:cursor-not-allowed disabled:opacity-40">No refund needed</button>
                    </>}
                    {request.admin_decision === "cancel_and_refunded" && request.refund_status === "pending" && <button disabled={busyId === request.id} onClick={() => void markMoneyTransferred(request)} className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{busyId === request.id ? "Saving…" : `Money transferred · ${money(request.refund_amount)}`}</button>}
                    {request.refund_status === "refunded" && <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Money transferred</span>}
                    {request.admin_decision === "cancel_with_no_refund" && <span className="inline-flex items-center rounded-full bg-[#f6f3f6] px-4 py-3 text-sm font-medium text-[#6e626d]">No refund needed</span>}
                  </div>
                  {!request.admin_decision && !canDecide && <p className="text-right text-xs text-[#9a8d98]">Admin decision unlocks when repayment is received, overdue, or the request reaches awaiting admin decision.</p>}
                  {request.admin_decision === "cancel_and_refunded" && request.refund_status === "pending" && <p className="text-right text-xs text-[#8b7d89]">Refund approved. Click “Money transferred” only after you have actually sent the refund.</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl border border-[#f0e7ed] bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a08f9d]">{label}</p><p className="mt-1 break-all text-sm font-medium text-[#413541]">{value}</p></div>;
}
