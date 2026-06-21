"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Booking = {
  id: string;
  bride_id: string;
  service_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
  start_time?: string | null;
  end_time?: string | null;
  service_duration_minutes?: number | null;
  location: string | null;
  location_notes: string | null;
  notes?: string | null;
  status: string;
  created_at: string;

  service_price?: number | null;
  platform_fee?: number | null;
  tax_fee?: number | null;
  total_price?: number | null;
  total_amount?: number | null;

  promo_code_id?: string | null;
  discount_amount?: number | null;
  bride_total_before_discount?: number | null;
  bride_total_after_discount?: number | null;
  mua_payout?: number | null;

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

  bride?: {
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

const STATUSES = [
  "pending",
  "confirmed",
  "confirmed_payment_pending",
  "completed",
  "disputed",
  "cancelled",
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalType, setModalType] = useState<"complete" | "issue" | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [issueReason, setIssueReason] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel("mua-bookings-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `mua_id=eq.${user.id}`,
          },
          () => fetchBookings()
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  function normalizeStatus(status: string | null | undefined) {
    return (status || "").toLowerCase().trim();
  }

  function cleanStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  async function fetchBookings() {
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
      .eq("mua_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !bookingsData) {
      console.error("FETCH BOOKINGS ERROR:", error);
      setPageError(error?.message || "Could not load bookings.");
      setBookings([]);
      setLoading(false);
      return;
    }

    const brideIds = [
      ...new Set(bookingsData.map((b) => b.bride_id).filter(Boolean)),
    ];

    const serviceIds = [
      ...new Set(bookingsData.map((b) => b.service_id).filter(Boolean)),
    ];

    const [{ data: brides }, { data: services }] = await Promise.all([
      brideIds.length
        ? supabase
            .from("bride_profiles")
            .select("id, first_name, last_name")
            .in("id", brideIds)
        : Promise.resolve({ data: [] as any[] }),

      serviceIds.length
        ? supabase
            .from("mua_services")
            .select("id, name, duration_minutes")
            .in("id", serviceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const enriched: Booking[] = bookingsData.map((b) => ({
      ...b,
      status: normalizeStatus(b.status || "pending"),
      bride: brides?.find((br) => br.id === b.bride_id) || null,
      service: services?.find((s) => s.id === b.service_id) || null,
    }));

    setBookings(enriched);
    setLoading(false);
  }

  function getBookingStartEnd(booking: Booking) {
    let start: Date | null = null;
    let end: Date | null = null;

    if (booking.start_time && booking.end_time) {
      start = new Date(booking.start_time);
      end = new Date(booking.end_time);
    } else if (booking.booking_date && booking.booking_time) {
      const duration =
        booking.service_duration_minutes ||
        booking.service?.duration_minutes ||
        120;

      start = new Date(`${booking.booking_date}T${booking.booking_time}`);
      end = new Date(start);
      end.setMinutes(end.getMinutes() + duration);
    }

    if (
      !start ||
      !end ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return null;
    }

    return { start, end };
  }

  async function checkBeforeConfirm(booking: Booking) {
    const range = getBookingStartEnd(booking);

    if (!range) {
      throw new Error("This booking has an invalid date or time.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in.");
    }

    const { data: conflicts, error } = await supabase.rpc(
      "check_mua_time_conflict",
      {
        p_mua_id: user.id,
        p_start_time: range.start.toISOString(),
        p_end_time: range.end.toISOString(),
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    const realConflicts =
      conflicts?.filter((conflict: any) => conflict.conflict_id !== booking.id) ||
      [];

    if (realConflicts.length > 0) {
      throw new Error(
        "This booking overlaps with another booking or blocked time. Please cancel or reschedule one of them."
      );
    }
  }

  async function updateStatus(
    booking: Booking,
    status: "confirmed" | "cancelled"
  ) {
    setUpdatingId(booking.id);
    setPageError(null);

    try {
      if (status === "confirmed") {
        await checkBeforeConfirm(booking);

        const { error } = await supabase.rpc(
          "confirm_booking_and_handle_payment",
          {
            p_booking_id: booking.id,
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        if (booking.promo_code_id && Number(booking.discount_amount || 0) > 0) {
          const { error: promoError } = await supabase.rpc(
            "finalize_booking_promo_usage",
            {
              p_booking_id: booking.id,
            }
          );

          if (promoError) {
            throw new Error(promoError.message);
          }
        }
      }

      if (status === "cancelled") {
        const { error } = await supabase.rpc(
          "mua_cancel_booking_and_refund_bride",
          {
            p_booking_id: booking.id,
            p_reason:
              normalizeStatus(booking.status) === "pending"
                ? "Booking declined by MUA"
                : "Booking cancelled by MUA",
          }
        );

        if (error) {
          throw new Error(error.message);
        }
      }

      await fetchBookings();
    } catch (err: any) {
      setPageError(err.message || "Could not update booking.");
    }

    setUpdatingId(null);
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

    setUpdatingId(selectedBooking.id);
    setPageError(null);

    const photoUrl = await uploadCompletionPhoto(selectedBooking.id);

    const { error } = await supabase.rpc("complete_booking_and_credit_mua", {
      p_booking_id: selectedBooking.id,
      p_completion_photo_url:
        photoUrl || selectedBooking.completion_photo_url || null,
    });

    if (error) {
      setPageError(error.message);
      setUpdatingId(null);
      return;
    }

    closeModal();
    await fetchBookings();
    setUpdatingId(null);
  }

  async function reportIssue() {
    if (!selectedBooking || !issueReason.trim()) return;

    setUpdatingId(selectedBooking.id);
    setPageError(null);

    const { error } = await supabase.rpc("report_booking_issue", {
      p_booking_id: selectedBooking.id,
      p_reason: issueReason.trim(),
    });

    if (error) {
      setPageError(error.message);
      setUpdatingId(null);
      return;
    }

    closeModal();
    await fetchBookings();
    setUpdatingId(null);
  }

  function openModal(type: "complete" | "issue", booking: Booking) {
    setSelectedBooking(booking);
    setModalType(type);
  }

  function closeModal() {
    setSelectedBooking(null);
    setModalType(null);
    setPhoto(null);
    setIssueReason("");
  }

  function getMuaEarning(booking: Booking) {
    if (booking.mua_payout !== null && booking.mua_payout !== undefined) {
      return Number(booking.mua_payout || 0);
    }

    const servicePrice = Number(booking.service_price || 0);
    const platformFee = Number(
      booking.platform_fee || Math.round(servicePrice * 0.1)
    );

    return Math.max(servicePrice - platformFee, 0);
  }

  function getPaymentMethodLabel(booking: Booking) {
    if (booking.payment_method === "credit_balance") return "Credit balance";
    return "Card";
  }

  function getPaymentStatusLabel(booking: Booking) {
    const status = normalizeStatus(booking.status);

    if (booking.payment_method === "credit_balance") {
      return booking.wallet_charged ? "Credit charged" : "Credit pending";
    }

    if (status === "confirmed_payment_pending") {
      return "Card payment pending";
    }

    if (booking.card_paid || booking.payment_status === "paid") {
      return "Card paid";
    }

    if (status === "confirmed" || status === "completed") {
      return "Payment confirmed";
    }

    return "Payment pending";
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
      <section className="rounded-[2rem] border border-[#eadff5] bg-white p-8 shadow-sm">
        <p className="text-sm text-[#6f6077]">Loading bookings…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          Beaura MUA dashboard
        </p>

        <h1 className="mt-3 text-4xl font-light tracking-[-0.07em] text-[#171018]">
          Bookings
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Confirm, decline, complete finished bookings, or report a problem.
          Payout is released only after both you and the bride confirm
          completion.
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
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center shadow-sm">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No {cleanStatus(activeStatus)} bookings.
          </h2>
          <p className="mt-3 text-sm text-[#6f6077]">
            Once bookings move to this status, they’ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const brideName =
              `${b.bride?.first_name || ""} ${
                b.bride?.last_name || ""
              }`.trim() || "Bride";

            const status = normalizeStatus(b.status);

            return (
              <div
                key={b.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171018] text-sm font-semibold text-white">
                        {brideName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h2 className="text-lg font-medium text-[#171018]">
                          {brideName}
                        </h2>

                        <p className="text-sm text-[#6f6077]">
                          {b.service?.name || "Service"} ·{" "}
                          {b.booking_date || "No date"} ·{" "}
                          {b.booking_time || "No time"}
                        </p>
                      </div>

                      <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs font-medium text-purple-700 capitalize">
                        {cleanStatus(status)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <InfoCard
                        label="Location"
                        value={b.location || "Not provided"}
                      />

                      <InfoCard
                        label="Notes"
                        value={
                          b.location_notes ||
                          b.notes ||
                          "No additional notes"
                        }
                      />

                      <InfoCard
                        label="MUA earning"
                        value={formatMoney(getMuaEarning(b))}
                      />

                      <InfoCard
                        label="Payment method"
                        value={getPaymentMethodLabel(b)}
                      />

                      <InfoCard
                        label="Payment status"
                        value={getPaymentStatusLabel(b)}
                      />

                      <InfoCard
                        label="Total booking"
                        value={formatMoney(b.total_price)}
                      />

                      {Number(b.discount_amount || 0) > 0 && (
                        <InfoCard
                          label="Bride promo discount"
                          value={formatMoney(b.discount_amount)}
                        />
                      )}

                      {Number(b.bride_total_before_discount || 0) > 0 &&
                        Number(b.discount_amount || 0) > 0 && (
                          <InfoCard
                            label="Before promo"
                            value={formatMoney(b.bride_total_before_discount)}
                          />
                        )}

                      {b.refund_processed && (
                        <InfoCard
                          label="Bride refund"
                          value={formatMoney(b.refund_amount)}
                        />
                      )}
                    </div>

                    {Number(b.discount_amount || 0) > 0 && (
                      <p className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-700">
                        Bride used a promo discount of{" "}
                        {formatMoney(b.discount_amount)}. Your MUA earning is
                        not reduced by this promotion.
                      </p>
                    )}

                    {b.completed_by_mua && !b.completed_by_bride && (
                      <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                        You confirmed completion. Waiting for the bride to
                        confirm before payout is released.
                      </p>
                    )}

                    {b.completed_by_bride && !b.completed_by_mua && (
                      <p className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-700">
                        The bride confirmed completion. Confirm completion to
                        release your payout.
                      </p>
                    )}

                    {b.refund_processed && (
                      <p className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                        Refund processed for bride:{" "}
                        {formatMoney(b.refund_amount)}
                      </p>
                    )}

                    {b.cancellation_reason && (
                      <p className="mt-3 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm text-[#6f6077]">
                        Cancellation reason: {b.cancellation_reason}
                      </p>
                    )}

                    {b.issue_reason && (
                      <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        Issue reported: {b.issue_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(b, "confirmed")}
                          disabled={updatingId === b.id}
                          className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {updatingId === b.id
                            ? "Saving..."
                            : b.payment_method === "credit_balance"
                            ? "Confirm & charge credit"
                            : "Confirm booking"}
                        </button>

                        <button
                          onClick={() => updateStatus(b, "cancelled")}
                          disabled={updatingId === b.id}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                        >
                          Decline booking
                        </button>
                      </>
                    )}

                    {status === "confirmed" && (
                      <>
                        {!b.completed_by_mua && (
                          <button
                            onClick={() => openModal("complete", b)}
                            className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                          >
                            Confirm completion
                          </button>
                        )}

                        <button
                          onClick={() => openModal("issue", b)}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600"
                        >
                          Report a problem
                        </button>

                        <button
                          onClick={() => updateStatus(b, "cancelled")}
                          disabled={updatingId === b.id}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                        >
                          Cancel booking
                        </button>
                      </>
                    )}

                    {status === "confirmed_payment_pending" && (
                      <>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-700">
                          Waiting for bride card payment
                        </span>

                        <button
                          onClick={() => openModal("issue", b)}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600"
                        >
                          Report a problem
                        </button>

                        <button
                          onClick={() => updateStatus(b, "cancelled")}
                          disabled={updatingId === b.id}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                        >
                          Cancel booking
                        </button>
                      </>
                    )}

                    {status.includes("cancelled") && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
                        Cancelled
                      </span>
                    )}

                    {status === "completed" && (
                      <span className="rounded-full border border-green-200 bg-green-50 px-5 py-3 text-sm font-medium text-green-700">
                        Completed
                      </span>
                    )}

                    {status === "disputed" && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
                        Under review
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalType && selectedBooking && (
        <ActionModal
          type={modalType}
          saving={updatingId === selectedBooking.id}
          issueReason={issueReason}
          setIssueReason={setIssueReason}
          setPhoto={setPhoto}
          onClose={closeModal}
          onComplete={completeBooking}
          onReport={reportIssue}
        />
      )}
    </section>
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
      <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          {type === "complete" ? "confirm completion" : "report problem"}
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">
          {type === "complete"
            ? "Confirm this booking is done?"
            : "Tell us what happened"}
        </h2>

        {type === "complete" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-[#6f6077]">
              Once you confirm completion, Beaura will wait for the bride’s
              confirmation too. Your wallet is credited only after both sides
              confirm.
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
            placeholder="Describe the problem..."
            className="mt-6 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500"
          />
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={type === "complete" ? onComplete : onReport}
            disabled={saving}
            className="flex-1 rounded-full bg-[#171018] py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : type === "complete"
              ? "Confirm completion"
              : "Submit problem"}
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