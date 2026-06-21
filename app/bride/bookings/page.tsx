"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BookingStatus =
  | "pending"
  | "confirmed_payment_pending"
  | "confirmed"
  | "completed"
  | "disputed"
  | "cancelled";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed_payment_pending",
  "confirmed",
  "completed",
  "disputed",
  "cancelled",
];

type Booking = {
  id: string;
  bride_id: string;
  mua_id: string;
  service_id: string | null;

  booking_date: string | null;
  booking_time: string | null;

  location: string | null;
  location_notes: string | null;
  notes?: string | null;

  status: BookingStatus | string;
  created_at: string;

  service_price?: number | null;
  platform_fee?: number | null;
  tax_fee?: number | null;
  total_price?: number | null;

  payment_method?: "card" | "credit_balance" | string | null;
  use_wallet_credit?: boolean | null;
  wallet_credit_amount?: number | null;
  amount_due_after_wallet?: number | null;
  wallet_charged?: boolean | null;
  wallet_charged_at?: string | null;

  card_paid?: boolean | null;
  card_paid_at?: string | null;
  payment_status?: string | null;

  refund_processed?: boolean | null;
  refund_amount?: number | null;
  refund_processed_at?: string | null;
  cancellation_compensation_amount?: number | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;

  completed_by_bride?: boolean | null;
  completed_by_mua?: boolean | null;
  bride_completed_at?: string | null;
  mua_completed_at?: string | null;
  completed_at?: string | null;

  completion_photo_url?: string | null;

  issue_reported_at?: string | null;
  issue_reported_by?: string | null;
  issue_reason?: string | null;

  mua?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;

  service?: {
    id: string;
    name: string;
    duration_minutes?: number | null;
  } | null;
};

export default function BrideBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<BookingStatus>("pending");

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalType, setModalType] = useState<"complete" | "issue" | null>(null);
  const [issueReason, setIssueReason] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    loadBookings();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel("bride-bookings-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `bride_id=eq.${user.id}`,
          },
          () => loadBookings()
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  function normalizeStatus(status: string | null | undefined) {
    return (status || "pending").toLowerCase().trim();
  }

  function cleanStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  async function loadBookings() {
    setLoading(true);
    setPageError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("bride_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BRIDE BOOKINGS LOAD ERROR:", error);
      setPageError(error.message);
      setBookings([]);
      setLoading(false);
      return;
    }

    const rows = bookingsData || [];

    const muaIds = [...new Set(rows.map((b) => b.mua_id).filter(Boolean))];
    const serviceIds = [
      ...new Set(rows.map((b) => b.service_id).filter(Boolean)),
    ];

    const [{ data: muas }, { data: services }] = await Promise.all([
      muaIds.length
        ? supabase
            .from("mua_profiles")
            .select("id, first_name, last_name")
            .in("id", muaIds)
        : Promise.resolve({ data: [] as any[] }),

      serviceIds.length
        ? supabase
            .from("mua_services")
            .select("id, name, duration_minutes")
            .in("id", serviceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    setBookings(
      rows.map((b) => ({
        ...b,
        status: normalizeStatus(b.status || "pending"),
        mua: muas?.find((m) => m.id === b.mua_id) || null,
        service: services?.find((s) => s.id === b.service_id) || null,
      }))
    );

    setLoading(false);
  }

  async function payNow(booking: Booking) {
    setPayingId(booking.id);
    setPageError(null);

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        card_paid: true,
        card_paid_at: new Date().toISOString(),
        payment_status: "paid",
      })
      .eq("id", booking.id)
      .eq("bride_id", booking.bride_id);

    if (error) {
      setPageError(error.message);
      setPayingId(null);
      return;
    }

    await loadBookings();
    setPayingId(null);
  }

  async function uploadCompletionPhoto(bookingId: string) {
    if (!photo) return null;

    const path = `${bookingId}/${crypto.randomUUID()}-${photo.name}`;

    const { error } = await supabase.storage
      .from("booking-completion")
      .upload(path, photo);

    if (error) {
      console.error("PHOTO UPLOAD ERROR:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("booking-completion")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function completeBooking() {
    if (!selectedBooking) return;

    setSaving(true);
    setPageError(null);

    const url = await uploadCompletionPhoto(selectedBooking.id);

    const { error } = await supabase.rpc("bride_confirm_booking_completed", {
      p_booking_id: selectedBooking.id,
      p_completion_photo_url:
        url || selectedBooking.completion_photo_url || null,
    });

    if (error) {
      setPageError(error.message);
      setSaving(false);
      return;
    }

    closeModal();
    await loadBookings();
    setSaving(false);
  }

  async function reportIssue() {
    if (!selectedBooking || !issueReason.trim()) return;

    setSaving(true);
    setPageError(null);

    const { error } = await supabase.rpc("report_booking_issue", {
      p_booking_id: selectedBooking.id,
      p_reason: issueReason.trim(),
    });

    if (error) {
      setPageError(error.message);
      setSaving(false);
      return;
    }

    closeModal();
    await loadBookings();
    setSaving(false);
  }

  function openCancelModal(booking: Booking) {
    setCancelBooking(booking);
    setCancelReason("I want to cancel this booking.");
  }

  function closeCancelModal() {
    setCancelBooking(null);
    setCancelReason("");
  }

  async function confirmCancelBooking() {
    if (!cancelBooking) return;

    setSaving(true);
    setPageError(null);

    const { error } = await supabase.rpc("bride_cancel_booking_and_refund", {
      p_booking_id: cancelBooking.id,
      p_reason: cancelReason.trim() || "Cancelled by bride",
    });

    if (error) {
      setPageError(error.message);
      setSaving(false);
      return;
    }

    closeCancelModal();
    await loadBookings();
    setSaving(false);
  }

  function openModal(type: "complete" | "issue", booking: Booking) {
    setSelectedBooking(booking);
    setModalType(type);
  }

  function closeModal() {
    setSelectedBooking(null);
    setModalType(null);
    setIssueReason("");
    setPhoto(null);
  }

  function getMuaName(booking: Booking) {
    return (
      `${booking.mua?.first_name || ""} ${
        booking.mua?.last_name || ""
      }`.trim() || "Your makeup artist"
    );
  }

  function getPaymentMethodLabel(booking: Booking) {
    if (booking.payment_method === "credit_balance") return "Credit balance";
    return "Card";
  }

  function getPaymentStatusLabel(booking: Booking) {
    const status = normalizeStatus(booking.status);

    if (booking.payment_method === "credit_balance") {
      return booking.wallet_charged ? "Paid with credit" : "Credit pending";
    }

    if (status === "confirmed_payment_pending") {
      return "Card payment required";
    }

    if (booking.card_paid || booking.payment_status === "paid") {
      return "Paid by card";
    }

    if (status === "confirmed" || status === "completed") {
      return "Paid / confirmed";
    }

    return "Payment pending";
  }

  function canBrideCancel(booking: Booking) {
    const status = normalizeStatus(booking.status);

    return (
      status !== "completed" &&
      status !== "disputed" &&
      !status.includes("cancelled")
    );
  }

  function formatMoney(value: number | string | null | undefined) {
    return `EGP ${Number(value || 0).toLocaleString()}`;
  }

  const filtered = bookings.filter((b) => {
    const status = normalizeStatus(b.status);

    if (activeStatus === "cancelled") {
      return status.includes("cancelled");
    }

    return status === activeStatus;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-4 pt-28 text-[#6f6077]">
        Loading bookings…
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffafc] px-4 pb-28 pt-24 text-[#171018] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
            your bookings
          </p>

          <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] sm:text-7xl">
            Your glam plans.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
            Track requests, pay for confirmed card bookings, cancel when needed,
            mark appointments complete, or report an issue.
          </p>
        </div>

        {pageError && (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-white p-2 shadow-sm">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm capitalize transition ${
                activeStatus === status
                  ? "bg-[#171018] text-white"
                  : "text-[#6f6077] hover:bg-[#f7efff] hover:text-purple-700"
              }`}
            >
              {cleanStatus(status)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState status={activeStatus} />
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => {
              const status = normalizeStatus(b.status);
              const muaName = getMuaName(b);

              return (
                <article
                  key={b.id}
                  className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs font-medium text-purple-700 capitalize">
                          {cleanStatus(status)}
                        </span>

                        <span className="rounded-full border border-[#eadff5] bg-[#fffafc] px-3 py-1 text-xs font-medium text-[#6f6077]">
                          {getPaymentMethodLabel(b)}
                        </span>

                        <span className="rounded-full border border-[#eadff5] bg-white px-3 py-1 text-xs font-medium text-[#6f6077]">
                          {getPaymentStatusLabel(b)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-3xl font-light tracking-[-0.06em] text-[#171018]">
                        {b.service?.name || "Makeup service"}
                      </h2>

                      <p className="mt-2 text-sm text-[#6f6077]">
                        With{" "}
                        <span className="font-medium text-[#171018]">
                          {muaName}
                        </span>
                      </p>

                      <p className="mt-1 text-sm text-[#6f6077]">
                        {b.booking_date || "No date"} ·{" "}
                        {b.booking_time || "No time"}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <InfoCard
                          label="Total"
                          value={formatMoney(b.total_price)}
                        />
                        <InfoCard
                          label="Payment"
                          value={getPaymentMethodLabel(b)}
                        />
                        <InfoCard
                          label="Status"
                          value={getPaymentStatusLabel(b)}
                        />
                      </div>

                      {(b.location_notes || b.notes) && (
                        <p className="mt-4 rounded-2xl bg-[#fffafc] p-4 text-sm italic text-[#6f6077]">
                          “{b.location_notes || b.notes}”
                        </p>
                      )}

                      {b.completed_by_bride && !b.completed_by_mua && (
                        <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                          You confirmed completion. Waiting for the MUA to
                          confirm before payout is released.
                        </p>
                      )}

                      {b.completed_by_mua && !b.completed_by_bride && (
                        <p className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-700">
                          The MUA confirmed completion. Please confirm after
                          your appointment is done.
                        </p>
                      )}

                      {b.refund_processed && (
                        <p className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                          Refund added to wallet: {formatMoney(b.refund_amount)}
                        </p>
                      )}

                      {b.cancellation_compensation_amount &&
                        Number(b.cancellation_compensation_amount) > 0 && (
                          <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                            Cancellation compensation kept for MUA:{" "}
                            {formatMoney(b.cancellation_compensation_amount)}
                          </p>
                        )}

                      {b.issue_reason && (
                        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                          Issue reported: {b.issue_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                      {status === "confirmed_payment_pending" && (
                        <button
                          onClick={() => payNow(b)}
                          disabled={payingId === b.id}
                          className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {payingId === b.id ? "Processing..." : "Pay now"}
                        </button>
                      )}

                      {status === "confirmed" && (
                        <>
                          {!b.completed_by_bride && (
                            <button
                              onClick={() => openModal("complete", b)}
                              className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                            >
                              Confirm I got my makeup done
                            </button>
                          )}

                          <button
                            onClick={() => openModal("issue", b)}
                            className="rounded-full border border-[#eadff5] bg-white px-5 py-3 text-sm font-medium text-[#171018] transition hover:border-red-200 hover:text-red-600"
                          >
                            Report issue
                          </button>
                        </>
                      )}

                      {canBrideCancel(b) && (
                        <button
                          onClick={() => openCancelModal(b)}
                          className="rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Cancel booking
                        </button>
                      )}

                      {status === "completed" && (
                        <span className="rounded-full border border-green-200 bg-green-50 px-5 py-3 text-sm font-medium text-green-700">
                          Completed
                        </span>
                      )}

                      {status === "pending" && (
                        <span className="rounded-full border border-[#eadff5] bg-[#fffafc] px-5 py-3 text-sm font-medium text-[#6f6077]">
                          Waiting for MUA confirmation
                        </span>
                      )}

                      {status === "disputed" && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
                          Under review
                        </span>
                      )}

                      {status.includes("cancelled") && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modalType && selectedBooking && (
        <ActionModal
          type={modalType}
          saving={saving}
          issueReason={issueReason}
          setIssueReason={setIssueReason}
          setPhoto={setPhoto}
          onClose={closeModal}
          onComplete={completeBooking}
          onReport={reportIssue}
        />
      )}

      {cancelBooking && (
        <CancelModal
          booking={cancelBooking}
          reason={cancelReason}
          setReason={setCancelReason}
          saving={saving}
          formatMoney={formatMoney}
          onClose={closeCancelModal}
          onConfirm={confirmCancelBooking}
        />
      )}
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-[#171018]">{value}</p>
    </div>
  );
}

function EmptyState({ status }: { status: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center shadow-sm">
      <h2 className="text-2xl font-light tracking-[-0.05em]">
        No {status.replaceAll("_", " ")} bookings.
      </h2>
      <p className="mt-3 text-sm text-[#6f6077]">
        Your bookings will appear here once their status changes.
      </p>
    </div>
  );
}

function ActionModal({
  type,
  saving,
  issueReason,
  setIssueReason,
  setPhoto,
  onClose,
  onComplete,
  onReport,
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          {type === "complete" ? "confirm completion" : "report issue"}
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">
          {type === "complete"
            ? "Got your makeup done?"
            : "Tell us what happened"}
        </h2>

        {type === "complete" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-[#6f6077]">
              Beaura will wait for the MUA’s confirmation too. The payout is
              released only after both sides confirm completion.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-3 text-sm"
            />
          </div>
        ) : (
          <textarea
            value={issueReason}
            onChange={(e) => setIssueReason(e.target.value)}
            rows={5}
            placeholder="Describe the issue..."
            className="mt-6 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500"
          />
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={type === "complete" ? onComplete : onReport}
            disabled={saving}
            className="flex-1 rounded-full bg-[#171018] py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : type === "complete"
              ? "Confirm completion"
              : "Submit issue"}
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-[#eadff5] py-3 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({
  booking,
  reason,
  setReason,
  saving,
  formatMoney,
  onClose,
  onConfirm,
}: any) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          cancel booking
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">
          Cancel this booking?
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#6f6077]">
          Beaura will calculate your refund automatically based on the
          cancellation policy. Refunds go back to your Beaura wallet first.
        </p>

        <div className="mt-5 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm">
          <p className="font-medium text-[#171018]">
            {booking.service?.name || "Makeup service"}
          </p>
          <p className="mt-1 text-[#6f6077]">
            Total: {formatMoney(booking.total_price)}
          </p>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
            Reason
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500"
          />
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 rounded-full bg-red-600 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Cancelling..." : "Cancel booking"}
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-[#eadff5] py-3 text-sm"
          >
            Keep booking
          </button>
        </div>
      </div>
    </div>
  );
}