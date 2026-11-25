
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/createNotification";
import { getBookingNumber } from "@/lib/bookingNumber";

type Booking = {
  id: string;
  booking_reference: string;
  bride_id: string;
  mua_id: string;
  service_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
  start_time?: string | null;
  end_time?: string | null;
  service_duration_minutes?: number | null;
  location: string | null;
  location_type?: string | null;
  travel_fee?: number | null;
  travel_fee_quote_status?: string | null;
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

  payment_method?: string | null;
  use_wallet_credit?: boolean | null;
  wallet_credit_amount?: number | null;
  amount_due_after_wallet?: number | null;
  wallet_charged?: boolean | null;
  wallet_charged_at?: string | null;

  card_paid?: boolean | null;
  card_paid_at?: string | null;
  payment_status?: string | null;
  payment_proof_status?: string | null;

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

type ModalType = "complete" | "issue" | null;

const STATUSES = [
  "pending",
  "confirmed",
  "confirmed_payment_pending",
  "completed",
  "disputed",
  "cancelled",
];

const MAX_PHOTO_SIZE_MB = 8;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [travelQuoteDrafts, setTravelQuoteDrafts] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [issueReason, setIssueReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

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

  function isWalletPayment(booking: Booking) {
    const method = normalizeStatus(booking.payment_method);
    return method === "wallet" || method === "credit_balance";
  }

  async function fetchBookings() {
    setLoading(true);
    setPageError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBookings([]);
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
    } catch (err: any) {
      console.error("UNEXPECTED FETCH BOOKINGS ERROR:", err);
      setPageError(err?.message || "Could not load bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
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
        const isStudio = booking.location_type === "own_studio";
        const quote = isStudio ? 0 : Number(travelQuoteDrafts[booking.id]);
        if (!isStudio && (!Number.isFinite(quote) || quote < 0 || travelQuoteDrafts[booking.id]?.trim() === "")) {
          throw new Error("Enter a valid travel quote of EGP 0 or more.");
        }
        const { error } = isStudio
          ? await supabase.rpc("confirm_booking_and_handle_payment", {
              p_booking_id: booking.id,
            })
          : await supabase.rpc("mua_submit_travel_fee_quote", {
              p_booking_id: booking.id,
              p_travel_fee: quote,
            });
        if (error) throw new Error(error.message);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const notice = isStudio
            ? "Your makeup artist accepted your studio booking. You can now continue to payment."
            : "Your makeup artist sent your travel quote. Review it and accept or decline it in your bookings.";
          const result = await createNotification({
            userId: booking.bride_id,
            actorId: user.id,
            bookingId: booking.id,
            type: "travel_fee_quote",
            title: isStudio ? "Studio booking accepted" : "Your travel quote is ready",
            message: notice,
            href: "/bride/bookings",
          });
          if (!result.success) setPageError("Quote saved, but the bride notification could not be sent.");
        }
      }

      if (status === "cancelled") {
        const cancellationReason =
          normalizeStatus(booking.status) === "pending"
            ? "Booking declined by MUA"
            : "Booking cancelled by MUA";
        const { error } = await supabase.rpc(
          "mua_cancel_booking_and_refund_bride",
          {
            p_booking_id: booking.id,
            p_reason: cancellationReason,
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const notice = `This booking was cancelled by the makeup artist. Reason: ${cancellationReason}`;
          const results = await Promise.all([
            createNotification({
              userId: booking.bride_id,
              actorId: user.id,
              bookingId: booking.id,
              type: "booking_cancelled",
              title: "Booking cancelled",
              message: notice,
              href: "/bride/bookings",
            }),
            createNotification({
              userId: booking.mua_id,
              actorId: user.id,
              bookingId: booking.id,
              type: "booking_cancelled",
              title: "Booking cancelled",
              message: notice,
              href: "/dashboard/mua/bookings",
            }),
          ]);
          if (results.some((result) => !result.success)) {
            setPageError("Booking cancelled, but an in-app notification could not be sent.");
          }
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/booking-notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}),
              },
              body: JSON.stringify({ bookingId: booking.id, event: "cancelled", reason: cancellationReason }),
            });
            const result = await response.json();
            if (!response.ok || result.failed?.length) {
              setPageError("Booking cancelled, but email delivery needs attention.");
              console.error("MUA cancellation email issue:", result);
            }
          } catch (emailError) {
            setPageError("Booking cancelled, but email delivery could not be confirmed.");
            console.error("MUA cancellation email failed:", emailError);
          }
        }
      }

      await fetchBookings();
    } catch (err: any) {
      console.error("UPDATE BOOKING ERROR:", err);
      setPageError(err?.message || "Could not update booking.");
    } finally {
      setUpdatingId(null);
    }
  }

  function createSafePhotoPath(bookingId: string, file: File) {
    const safeFileName = file.name
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    const randomId =
      typeof globalThis !== "undefined" &&
      globalThis.crypto &&
      "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return `${bookingId}/${randomId}-${safeFileName || "completion-photo.jpg"}`;
  }

  async function uploadCompletionPhoto(bookingId: string, file: File) {
    const path = createSafePhotoPath(bookingId, file);

    const { error } = await supabase.storage
      .from("booking-completion")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (error) {
      console.error("PHOTO UPLOAD ERROR:", error);
      throw new Error(error.message || "Could not upload completion photo.");
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
    setModalError(null);

    try {
      if (!photo) {
        setModalError("Please upload a completion photo before confirming.");
        return;
      }

      if (!photo.type.startsWith("image/")) {
        setModalError("Please upload an image file only.");
        return;
      }

      if (photo.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        setModalError(`Photo must be smaller than ${MAX_PHOTO_SIZE_MB}MB.`);
        return;
      }

      const photoUrl = await uploadCompletionPhoto(selectedBooking.id, photo);

      const { error } = await supabase.rpc("complete_booking_and_credit_mua", {
        p_booking_id: selectedBooking.id,
        p_completion_photo_url: photoUrl,
      });

      if (error) {
        throw new Error(error.message);
      }

      closeModal();
      await fetchBookings();
    } catch (err: any) {
      console.error("COMPLETE BOOKING ERROR:", err);
      setModalError(err?.message || "Could not complete booking.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function reportIssue() {
    if (!selectedBooking) return;

    setUpdatingId(selectedBooking.id);
    setPageError(null);
    setModalError(null);

    try {
      if (!issueReason.trim()) {
        setModalError("Please describe the problem before submitting.");
        return;
      }

      const { error } = await supabase.rpc("report_booking_issue", {
        p_booking_id: selectedBooking.id,
        p_reason: issueReason.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      closeModal();
      await fetchBookings();
    } catch (err: any) {
      console.error("REPORT ISSUE ERROR:", err);
      setModalError(err?.message || "Could not report problem.");
    } finally {
      setUpdatingId(null);
    }
  }

  function openModal(type: "complete" | "issue", booking: Booking) {
    setSelectedBooking(booking);
    setModalType(type);
    setPhoto(null);
    setIssueReason("");
    setModalError(null);
    setPageError(null);
  }

  function closeModal() {
    setSelectedBooking(null);
    setModalType(null);
    setPhoto(null);
    setIssueReason("");
    setModalError(null);
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
    return isWalletPayment(booking) ? "Beaura Wallet" : "InstaPay / Mobile Wallet";
  }

  function getPaymentStatusLabel(booking: Booking) {
    const status = normalizeStatus(booking.status);

    if (isWalletPayment(booking)) {
      return booking.wallet_charged ? "Credit charged" : "Credit pending";
    }

    if (status === "confirmed_payment_pending") {
      if (booking.payment_proof_status === "approved") return "Deposit approved";
      if (booking.payment_proof_status === "pending_review") {
        return "Deposit proof under review";
      }
      if (booking.payment_proof_status === "rejected") {
        return "Deposit proof rejected";
      }
      return "Waiting for 50% deposit";
    }

    if (booking.card_paid || booking.payment_status === "paid") {
      return "Paid";
    }

    if (
      booking.payment_method === "transfer" &&
      booking.payment_proof_status === "approved"
    ) {
      return "50% deposit approved · balance pending";
    }

    if (status === "confirmed" || status === "completed") {
      return "Payment status needs review";
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
                        <p className="mb-1 text-xs font-semibold tracking-wide text-purple-700">
                          Booking # {getBookingNumber(b.booking_reference)}
                        </p>
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
                          b.location_notes || b.notes || "No additional notes"
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
                        value={formatMoney(b.total_price || b.total_amount)}
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
                            value={formatMoney(
                              b.bride_total_before_discount
                            )}
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

                    {b.completion_photo_url && (
                      <a
                        href={b.completion_photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-full border border-[#eadff5] px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-[#f7efff]"
                      >
                        View completion photo
                      </a>
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
                        {b.location_type !== "own_studio" && (
                          <div className="w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">Review this booking&apos;s address</p>
                            <p className="mt-2 text-sm font-medium text-[#171018]">{b.location || "No address was provided"}</p>
                            <p className="mt-2 text-xs leading-5 text-[#6f6077]">
                              Enter the travel fee for this specific booking after reviewing the bride&apos;s address. Do not use a default location fee. The bride will see your quote and must accept it before payment begins.
                            </p>
                            <label className="mt-3 block max-w-sm">
                              <span className="mb-1 block text-xs font-medium text-[#6f6077]">Your travel quote (EGP)</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={travelQuoteDrafts[b.id] ?? ""}
                                onChange={(event) => setTravelQuoteDrafts((current) => ({ ...current, [b.id]: event.target.value }))}
                                placeholder="Enter your quote for this address"
                                className="h-11 w-full rounded-xl border border-[#eadff5] bg-white px-3 text-sm outline-none focus:border-purple-400"
                              />
                            </label>
                          </div>
                        )}
                        <button
                          onClick={() => updateStatus(b, "confirmed")}
                          disabled={updatingId === b.id}
                          className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {updatingId === b.id
                            ? "Saving..."
                            : b.location_type === "own_studio"
                              ? "Accept studio booking"
                              : "Send travel quote"}
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
                            disabled={updatingId === b.id}
                            className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            Confirm completion
                          </button>
                        )}

                        <button
                          onClick={() => openModal("issue", b)}
                          disabled={updatingId === b.id}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
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
                          {b.payment_proof_status === "approved"
                            ? "Deposit proof approved"
                            : b.payment_proof_status === "pending_review"
                              ? "Deposit proof under review"
                              : b.payment_proof_status === "rejected"
                                ? "Deposit proof rejected"
                                : "Waiting for bride’s 50% deposit"}
                        </span>

                        <button
                          onClick={() => openModal("issue", b)}
                          disabled={updatingId === b.id}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
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
          photo={photo}
          setPhoto={setPhoto}
          modalError={modalError}
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

type ActionModalProps = {
  type: "complete" | "issue";
  saving: boolean;
  issueReason: string;
  setIssueReason: (value: string) => void;
  photo: File | null;
  setPhoto: (file: File | null) => void;
  modalError: string | null;
  onClose: () => void;
  onComplete: () => void;
  onReport: () => void;
};

function ActionModal({
  type,
  saving,
  issueReason,
  setIssueReason,
  photo,
  setPhoto,
  modalError,
  onClose,
  onComplete,
  onReport,
}: ActionModalProps) {
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          {type === "complete" ? "confirm completion" : "report problem"}
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em] text-[#171018]">
          {type === "complete"
            ? "Confirm this booking is done?"
            : "Tell us what happened"}
        </h2>

        {modalError && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {modalError}
          </div>
        )}

        {type === "complete" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-[#6f6077]">
              Upload a completion photo, then confirm the booking. Beaura will
              wait for the bride’s confirmation too before releasing payout.
            </p>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#171018]">
                Completion photo required
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={saving}
                className="w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-3 text-sm disabled:opacity-60"
              />
            </label>

            {photo && (
              <p className="rounded-2xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
                Selected: {photo.name}
              </p>
            )}
          </div>
        ) : (
          <textarea
            value={issueReason}
            onChange={(e) => setIssueReason(e.target.value)}
            rows={5}
            disabled={saving}
            placeholder="Describe the problem..."
            className="mt-6 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500 disabled:opacity-60"
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
            disabled={saving}
            className="flex-1 rounded-full border border-[#eadff5] py-3 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
