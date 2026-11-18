"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CancellationRequest = {
  id: string;
  booking_id: string;
  requested_by: string;
  requested_by_role: "bride" | "mua";
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
};

export default function CancellationRequestsPage() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
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
      .neq("request_status", "closed")
      .order("requested_at", { ascending: true });
    if (requestError) {
      setError(requestError.message);
      setLoading(false);
      return;
    }
    const rows = (data || []) as CancellationRequest[];
    const ids = [...new Set(rows.map((row) => row.booking_id))];
    const { data: bookingRows, error: bookingError } = ids.length
      ? await supabase
          .from("bookings")
          .select("id, bride_id, mua_id, booking_date, booking_time, service_price, deposit_amount, travel_fee, status")
          .in("id", ids)
      : { data: [], error: null };
    if (bookingError) {
      setError(bookingError.message);
      setLoading(false);
      return;
    }
    setRequests(rows);
    setBookings(Object.fromEntries((bookingRows || []).map((row) => [row.id, row as Booking])));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-cancellation-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_cancellation_requests" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

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
        ? "Cancellation approved and refund processed."
        : "Booking cancelled without a refund.");
      await load();
    }
    setBusyId(null);
  }

  const money = (amount: number | null | undefined) =>
    `EGP ${Number(amount || 0).toLocaleString("en-EG", { maximumFractionDigits: 2 })}`;

  return (
    <main className="mx-auto max-w-6xl space-y-6 text-[#171018]">
      <header className="rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Admin · cancellations</p>
        <h1 className="mt-3 text-4xl font-light tracking-[-0.06em]">Cancellation requests</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6f6077]">
          Review eligible bride cancellation requests, check the deposit repayment status, and record the final decision.
        </p>
      </header>
      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {loading ? (
        <p className="rounded-2xl border border-[#eadff5] bg-white p-8 text-sm text-[#6f6077]">Loading requests…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">No open cancellation requests.</div>
      ) : requests.map((request) => {
        const booking = bookings[request.booking_id];
        return (
          <article key={request.id} className="space-y-4 rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-purple-700">{request.requested_by_role} request</p>
                <h2 className="mt-1 text-lg font-medium">Booking #{request.booking_id.slice(0, 8)}</h2>
                <p className="mt-1 text-xs text-[#8a7d91]">Submitted {new Date(request.requested_at).toLocaleString()}</p>
              </div>
              <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs text-purple-700">{request.request_status.replaceAll("_", " ")}</span>
            </div>
            <p className="text-sm leading-6 text-[#6f6077]">{request.reason}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-[#fffafc] p-4"><p className="text-xs text-[#8a7d91]">Appointment</p><p className="mt-1 text-sm font-medium">{booking?.booking_date || request.event_date || "—"} {booking?.booking_time || ""}</p></div>
              <div className="rounded-2xl bg-[#fffafc] p-4"><p className="text-xs text-[#8a7d91]">Deposit</p><p className="mt-1 text-sm font-medium">{money(booking?.deposit_amount)}</p></div>
              <div className="rounded-2xl bg-[#fffafc] p-4"><p className="text-xs text-[#8a7d91]">MUA repayment</p><p className="mt-1 text-sm font-medium">{money(request.mua_repayment_amount)}</p></div>
              <div className="rounded-2xl bg-[#fffafc] p-4"><p className="text-xs text-[#8a7d91]">Repayment status</p><p className="mt-1 text-sm font-medium">{request.repayment_status.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-[#8a7d91]">Deadline: {request.repayment_deadline ? new Date(request.repayment_deadline).toLocaleString() : "—"}</p></div>
            </div>
            <textarea
              value={notes[request.id] || ""}
              onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
              rows={2}
              placeholder="Admin notes (optional)"
              className="w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-3 text-sm outline-none focus:border-purple-500"
            />
            <div className="flex flex-wrap gap-3">
              <button disabled={busyId === request.id} onClick={() => void decide(request, "cancel_and_refunded")} className="rounded-full bg-[#171018] px-5 py-3 text-sm text-white disabled:opacity-50">{busyId === request.id ? "Saving…" : "Cancel and mark refunded"}</button>
              <button disabled={busyId === request.id} onClick={() => void decide(request, "cancel_with_no_refund")} className="rounded-full border border-[#eadff5] px-5 py-3 text-sm text-[#6f6077] disabled:opacity-50">Cancel with no refund</button>
            </div>
          </article>
        );
      })}
    </main>
  );
}
