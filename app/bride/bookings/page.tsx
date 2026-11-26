"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/createNotification";
import { notifyBookingWhatsApp } from "@/lib/notifyWhatsApp";
import { getBookingNumber } from "@/lib/bookingNumber";

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
const STATUS_TABS = ["all", "pending", "confirmed", "completed", "cancelled", "disputed"] as const;
type BookingTab = (typeof STATUS_TABS)[number];

type Booking = {
  id: string;
  booking_reference: string;
  bride_id: string;
  mua_id: string;
  service_id: string | null;

  booking_date: string | null;
  booking_time: string | null;

  location: string | null;
  location_type?: string | null;
  travel_fee?: number | null;
  travel_fee_quote_status?: string | null;
  location_notes: string | null;
  notes?: string | null;

  status: BookingStatus | string;
  created_at: string;

  service_price?: number | null;
  platform_fee?: number | null;
  tax_fee?: number | null;
  total_price?: number | null;
  deposit?: number | null;
  remaining_balance?: number | null;

  payment_method?: "transfer" | "credit_balance" | string | null;
  payment_proof_status?: string | null;
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
    portfolio_image?: string | null;
  } | null;

  service?: {
    id: string;
    name: string;
    duration_minutes?: number | null;
  } | null;
  financials?: BookingFinancials | null;
};

type BookingFinancials = {
  booking_id: string;
  original_service_price: number | null;
  discount_amount: number | null;
  discounted_service_price: number | null;
  travel_fee: number | null;
  bride_platform_fee: number | null;
  bride_deposit_service_amount: number | null;
  bride_deposit_travel_amount: number | null;
  bride_deposit_amount: number | null;
  remaining_direct_amount: number | null;
};

type ModalType = "complete" | "issue" | "review" | null;

export default function BrideBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<BookingTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [issueReason, setIssueReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewedMuaIds, setReviewedMuaIds] = useState<string[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    loadBookings(true);

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

  async function loadBookings(showLoading = false) {
    if (showLoading) setLoading(true);
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
        .eq("bride_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("BRIDE BOOKINGS LOAD ERROR:", error);
        setPageError(error.message);
        return;
      }

      const rows = bookingsData || [];

      const muaIds = [...new Set(rows.map((b) => b.mua_id).filter(Boolean))];

      const serviceIds = [
        ...new Set(rows.map((b) => b.service_id).filter(Boolean)),
      ];

      const bookingIds = rows.map((b) => b.id).filter(Boolean);
      const [{ data: muas }, { data: services }, { data: portfolio }, { data: existingReviews }, { data: financialRows, error: financialError }] = await Promise.all([
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

        muaIds.length
          ? supabase.from("mua_portfolio").select("mua_id, image_path").in("mua_id", muaIds)
          : Promise.resolve({ data: [] as any[] }),

        muaIds.length
          ? supabase.from("mua_reviews").select("mua_id").eq("bride_id", user.id).in("mua_id", muaIds)
          : Promise.resolve({ data: [] as any[] }),

        bookingIds.length
          ? supabase
              .from("booking_financials")
              .select("booking_id, original_service_price, discount_amount, discounted_service_price, travel_fee, bride_platform_fee, bride_deposit_service_amount, bride_deposit_travel_amount, bride_deposit_amount, remaining_direct_amount")
              .in("booking_id", bookingIds)
          : Promise.resolve({ data: [] as BookingFinancials[], error: null }),
      ]);

      if (financialError) {
        console.error("BRIDE BOOKING FINANCIALS LOAD ERROR:", financialError);
      }
      const financialMap = new Map(
        ((financialRows || []) as BookingFinancials[]).map((row) => [row.booking_id, row])
      );

      setReviewedMuaIds([...new Set((existingReviews || []).map((review: any) => review.mua_id).filter(Boolean))]);

      const enriched: Booking[] = rows.map((b) => {
        const artist = muas?.find((m) => m.id === b.mua_id);
        const firstPortfolioImage = portfolio?.find((item) => item.mua_id === b.mua_id)?.image_path;
        return {
          ...b,
          status: normalizeStatus(b.status || "pending"),
          mua: artist ? {
            ...artist,
            portfolio_image: firstPortfolioImage
              ? supabase.storage.from("mua-portfolio").getPublicUrl(firstPortfolioImage).data.publicUrl
              : null,
          } : null,
          service: services?.find((s) => s.id === b.service_id) || null,
          financials: financialMap.get(b.id) || null,
        };
      });

      setBookings(enriched);
    } catch (err: any) {
      console.error("UNEXPECTED BRIDE BOOKINGS LOAD ERROR:", err);
      setPageError(err?.message || "Could not load bookings.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function respondToTravelQuote(booking: Booking, accept: boolean) {
    if (saving) return;
    setSaving(true);
    setPageError(null);
    try {
      const { error } = await supabase.rpc("bride_respond_to_travel_fee_quote", {
        p_booking_id: booking.id,
        p_accept: accept,
      });
      if (error) throw new Error(error.message);
      if (accept) {
        const whatsappNotice = await notifyBookingWhatsApp(booking.id, "payment_required");
        if (!whatsappNotice.success) console.warn("Bride WhatsApp payment instructions alert failed:", whatsappNotice.error);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const result = await createNotification({
          userId: booking.mua_id,
          actorId: user.id,
          bookingId: booking.id,
          type: accept ? "travel_fee_accepted" : "travel_fee_declined",
          title: accept ? "Travel quote accepted" : "Travel quote declined",
          message: accept
            ? "The bride accepted your travel quote. The booking can proceed to payment."
            : "The bride declined your travel quote. The booking has been cancelled.",
          href: "/dashboard/mua/bookings",
        });
        if (!result.success) setPageError("Your response was saved, but the MUA notification could not be sent.");
      }
      await loadBookings();
    } catch (err: any) {
      setPageError(err?.message || "Could not save your response.");
    } finally {
      setSaving(false);
    }
  }

  async function completeBooking() {
    if (!selectedBooking) return;

    setSaving(true);
    setPageError(null);
    setModalError(null);

    try {
      const { error } = await supabase.rpc("bride_confirm_booking_completed", {
        p_booking_id: selectedBooking.id,

        // Bride does NOT upload photo.
        // This only preserves the MUA uploaded photo if it already exists.
        p_completion_photo_url: selectedBooking.completion_photo_url || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const notice = await createNotification({
          userId: selectedBooking.mua_id,
          actorId: user.id,
          bookingId: selectedBooking.id,
          type: "completion_pending",
          title: "Bride confirmed appointment completion",
          message: "The bride confirmed that the makeup appointment is complete. Confirm completion from your bookings to finish the process.",
          href: "/dashboard/mua/bookings",
        });
        if (!notice.success) setPageError("Completion was saved, but the makeup artist notification could not be sent.");
      }

      closeModal();
      await loadBookings();
    } catch (err: any) {
      console.error("BRIDE COMPLETE BOOKING ERROR:", err);
      setModalError(err?.message || "Could not confirm completion.");
    } finally {
      setSaving(false);
    }
  }

  async function submitReview() {
    if (!selectedBooking || !selectedBooking.mua_id) return;
    if (!reviewText.trim()) {
      setModalError("Please write a short review before submitting.");
      return;
    }
    setSaving(true);
    setModalError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again to submit your review.");
      const { error } = await supabase.from("mua_reviews").insert({
        mua_id: selectedBooking.mua_id,
        bride_id: user.id,
        rating: reviewRating,
        review_text: reviewText.trim(),
      });
      if (error) throw new Error(error.message);
      setReviewedMuaIds((current) => [...new Set([...current, selectedBooking.mua_id])]);
      setSelectedBooking(null);
      setModalType(null);
      setReviewText("");
      setReviewRating(5);
    } catch (error: any) {
      setModalError(error?.message || "Could not submit your review.");
    } finally {
      setSaving(false);
    }
  }

  async function reportIssue() {
    if (!selectedBooking) return;

    setSaving(true);
    setPageError(null);
    setModalError(null);

    try {
      if (!issueReason.trim()) {
        setModalError("Please describe the issue before submitting.");
        return;
      }

      const { error } = await supabase.rpc("report_booking_issue", {
        p_booking_id: selectedBooking.id,
        p_reason: issueReason.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const notice = await createNotification({
          userId: selectedBooking.mua_id,
          actorId: user.id,
          bookingId: selectedBooking.id,
          type: "dispute_opened",
          title: "Bride reported an issue",
          message: "The bride reported an issue with this booking. Please review the booking and contact Beaura if action is needed.",
          href: "/dashboard/mua/bookings",
        });
        if (!notice.success) setPageError("Your issue report was saved, but the makeup artist notification could not be sent.");
      }

      closeModal();
      await loadBookings();
    } catch (err: any) {
      console.error("REPORT ISSUE ERROR:", err);
      setModalError(err?.message || "Could not report issue.");
    } finally {
      setSaving(false);
    }
  }

  function openCancelModal(booking: Booking) {
    setCancelBooking(booking);
    setCancelReason("I want to cancel this booking.");
    setPageError(null);
    setModalError(null);
  }

  function closeCancelModal() {
    setCancelBooking(null);
    setCancelReason("");
    setModalError(null);
  }

  async function confirmCancelBooking() {
    if (!cancelBooking) return;

    setSaving(true);
    setPageError(null);
    setModalError(null);

    try {
      const cancellationReason = cancelReason.trim() || "Cancelled by bride";
      const { data: cancellationResult, error } = await supabase.rpc("bride_cancel_booking_and_refund", {
        p_booking_id: cancelBooking.id,
        p_reason: cancellationReason,
      });

      if (error) {
        throw new Error(error.message);
      }

      const isCancellationRequest =
        cancellationResult?.request_created === true ||
        cancellationResult?.request_status === "requested" ||
        cancellationResult?.request_status === "awaiting_mua_repayment";

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const notice = isCancellationRequest
          ? "The bride submitted a cancellation request. Please review it and return the full deposit Beaura transferred to your wallet within 48 hours."
          : `This booking was cancelled by the bride. Reason: ${cancellationReason}`;
        const results = await Promise.all([
          createNotification({
            userId: cancelBooking.bride_id,
            actorId: user.id,
            bookingId: cancelBooking.id,
            type: isCancellationRequest ? "admin_update" : "booking_cancelled",
            title: isCancellationRequest ? "Cancellation request submitted" : "Booking cancelled",
            message: isCancellationRequest
              ? "Your cancellation request has been submitted. The makeup artist has 48 hours to return the deposit transferred by Beaura."
              : notice,
            href: "/bride/bookings",
          }),
          createNotification({
            userId: cancelBooking.mua_id,
            actorId: user.id,
            bookingId: cancelBooking.id,
            type: isCancellationRequest ? "admin_update" : "booking_cancelled",
            title: isCancellationRequest ? "Cancellation request received" : "Booking cancelled",
            message: notice,
            href: "/dashboard/mua/bookings",
          }),
        ]);
        if (results.some((result) => !result.success)) {
          setPageError("Your cancellation action was saved, but an in-app notification could not be sent.");
        }
        if (!isCancellationRequest) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/booking-notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}),
              },
              body: JSON.stringify({ bookingId: cancelBooking.id, event: "cancelled", reason: cancellationReason }),
            });
            const result = await response.json();
            if (!response.ok || result.failed?.length) {
              setPageError("Booking cancelled, but email delivery needs attention.");
              console.error("Bride cancellation email issue:", result);
            }
          } catch (emailError) {
            setPageError("Booking cancelled, but email delivery could not be confirmed.");
            console.error("Bride cancellation email failed:", emailError);
          }
        }
      }

      closeCancelModal();
      await loadBookings();
    } catch (err: any) {
      console.error("BRIDE CANCEL BOOKING ERROR:", err);
      setModalError(err?.message || "Could not cancel booking.");
    } finally {
      setSaving(false);
    }
  }

  function openModal(type: "complete" | "issue", booking: Booking) {
    setSelectedBooking(booking);
    setModalType(type);
    setIssueReason("");
    setPageError(null);
    setModalError(null);
  }

  function closeModal() {
    setSelectedBooking(null);
    setModalType(null);
    setIssueReason("");
    setModalError(null);
  }

  function getMuaName(booking: Booking) {
    return (
      `${booking.mua?.first_name || ""} ${
        booking.mua?.last_name || ""
      }`.trim() || "Your makeup artist"
    );
  }

  function getPaymentMethodLabel(booking: Booking) {
    if (booking.payment_method === "credit_balance") return "Beaura Wallet";
    return "InstaPay / Mobile Wallet";
  }

  function getPaymentStatusLabel(booking: Booking) {
    const status = normalizeStatus(booking.status);

    if (booking.payment_method === "credit_balance") {
      return booking.wallet_charged ? "Paid with credit" : "Credit pending";
    }

    if (status === "confirmed_payment_pending") {
      return booking.payment_proof_status === "pending_review"
        ? "Deposit proof under review"
        : booking.payment_proof_status === "approved"
        ? "Deposit approved"
        : booking.payment_proof_status === "rejected"
        ? "Proof rejected — action required"
        : "50% deposit required";
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

  const filtered = [...bookings.filter((b) => {
    const status = normalizeStatus(b.status);
    const matchesStatus = activeStatus === "all" ||
      (activeStatus === "cancelled" ? status.includes("cancelled") :
        activeStatus === "confirmed" ? ["confirmed", "confirmed_payment_pending"].includes(status) : status === activeStatus);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      getMuaName(b).toLowerCase().includes(query) ||
      (b.service?.name || "").toLowerCase().includes(query) ||
      getBookingNumber(b.booking_reference).toLowerCase().includes(query) ||
      (b.location || "").toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  })].sort((a, b) => {
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "date-soonest") return new Date(a.booking_date || "9999-12-31").getTime() - new Date(b.booking_date || "9999-12-31").getTime();
    if (sortBy === "date-latest") return new Date(b.booking_date || "0001-01-01").getTime() - new Date(a.booking_date || "0001-01-01").getTime();
    if (sortBy === "price-low") return Number(a.total_price || 0) - Number(b.total_price || 0);
    if (sortBy === "price-high") return Number(b.total_price || 0) - Number(a.total_price || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-purple-700">Your bookings</p>
            <h1 className="mt-2 text-3xl font-medium tracking-[-0.05em] text-[#171018]">Bookings</h1>
            <p className="mt-1 text-sm text-[#6f6077]">Your appointments and their latest status.</p>
          </div>
          <button type="button" onClick={() => loadBookings(true)} className="rounded-full border border-[#eadff5] px-4 py-2.5 text-sm font-medium text-[#6f6077] transition hover:bg-[#f7efff] hover:text-purple-700">Refresh</button>
        </div>

        {pageError && (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-white p-2 shadow-sm">
          {STATUS_TABS.map((status) => {
            const count = status === "all" ? bookings.length : bookings.filter((item) => {
              const current = normalizeStatus(item.status);
              return status === "cancelled" ? current.includes("cancelled") :
                status === "confirmed" ? ["confirmed", "confirmed_payment_pending"].includes(current) : current === status;
            }).length;
            const label = status === "all" ? "All" : status === "disputed" ? "Needs review" : cleanStatus(status);
            return (
              <button key={status} onClick={() => setActiveStatus(status)} className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm capitalize transition ${activeStatus === status ? "bg-[#171018] text-white" : "text-[#6f6077] hover:bg-[#f7efff] hover:text-purple-700"}`}>
                {label}<span className={`rounded-full px-2 py-0.5 text-[11px] ${activeStatus === status ? "bg-white/15 text-white" : "bg-[#f7efff] text-purple-700"}`}>{count}</span>
              </button>
            );
          })}
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
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#eadff5] bg-[#fffafc] px-3 py-1 text-xs font-semibold tracking-wide text-[#6f6077]">
                          Booking # {getBookingNumber(b.booking_reference)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs font-medium text-purple-700 capitalize">
                          {cleanStatus(status)}
                        </span>

                      </div>

                      <h2 className="mt-4 text-3xl font-light tracking-[-0.06em] text-[#171018]">
                        {b.service?.name || "Makeup service"}
                      </h2>

                      <div className="mt-3 flex items-center gap-3">
                        {b.mua?.portfolio_image ? (
                          <img src={b.mua.portfolio_image} alt={muaName} className="h-12 w-12 rounded-2xl object-cover" />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7efff] text-sm font-semibold text-purple-700">
                            {muaName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-[#6f6077]">Makeup artist</p>
                          <p className="font-medium text-[#171018]">{muaName}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-2xl bg-[#fffafc] p-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#8a7d91]">Appointment</p>
                          <p className="mt-1 text-sm font-medium text-[#171018]">{b.booking_date || "Date to be confirmed"}</p>
                          <p className="text-sm text-[#6f6077]">{b.booking_time || "Time to be confirmed"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#8a7d91]">Booking total</p>
                          <p className="mt-1 text-lg font-semibold text-[#171018]">{formatMoney(b.total_price ?? b.service_price)}</p>
                          {Number(b.deposit || 0) > 0 && <p className="mt-1 text-xs text-[#6f6077]">Deposit: {formatMoney(b.deposit)}</p>}
                          {Number(b.remaining_balance || 0) > 0 && <p className="mt-1 text-xs text-[#6f6077]">Remaining: {formatMoney(b.remaining_balance)}</p>}
                        </div>
                      </div>

                      {b.financials && (
                        <details className="mt-3 rounded-2xl border border-[#eadff5] bg-white px-4 py-3">
                          <summary className="cursor-pointer text-sm font-medium text-purple-700">
                            View full price breakdown
                          </summary>
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-[#6f6077]">Makeup service</span>
                              <span>{formatMoney(b.financials.original_service_price)}</span>
                            </div>
                            {Number(b.financials.discount_amount || 0) > 0 && (
                              <>
                                <div className="flex justify-between gap-4 text-green-700">
                                  <span>Promo-code discount</span>
                                  <span>− {formatMoney(b.financials.discount_amount)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-[#6f6077]">Service after discount</span>
                                  <span>{formatMoney(b.financials.discounted_service_price)}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between gap-4">
                              <span className="text-[#6f6077]">Artist travel fee</span>
                              <span>{formatMoney(b.financials.travel_fee)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[#6f6077]">Beaura platform fee</span>
                              <span>{formatMoney(b.financials.bride_platform_fee)}</span>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-[#eadff5] pt-2 font-semibold text-[#171018]">
                              <span>Full booking total</span>
                              <span>{formatMoney(b.total_price)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[#6f6077]">Deposit due</span>
                              <span>{formatMoney(b.financials.bride_deposit_amount)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[#6f6077]">Remaining service balance</span>
                              <span>{formatMoney(b.financials.remaining_direct_amount)}</span>
                            </div>
                          </div>
                        </details>
                      )}

                      <p className="mt-3 text-xs font-medium text-[#6f6077]">{getPaymentStatusLabel(b)}</p>

                      {b.travel_fee_quote_status === "pending_bride_approval" && (
                        <div className="mt-4 rounded-2xl border border-purple-200 bg-[#f7efff] p-5">
                          <p className="text-sm font-medium text-purple-900">Your makeup artist has quoted travel for this address.</p>
                          <p className="mt-2 text-2xl font-semibold text-[#171018]">{formatMoney(b.travel_fee)}</p>
                          <p className="mt-2 text-xs leading-5 text-[#6f6077]">This fee was entered by the artist for your specific booking. Review it before accepting. Only after acceptance will Beaura calculate your final total and deposit. Declining cancels the booking; no payment has been taken.</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button type="button" onClick={() => respondToTravelQuote(b, true)} disabled={saving} className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving..." : "Accept quote"}</button>
                            <button type="button" onClick={() => respondToTravelQuote(b, false)} disabled={saving} className="rounded-full border border-red-200 px-5 py-3 text-sm font-medium text-red-700 disabled:opacity-50">Decline & cancel booking</button>
                          </div>
                        </div>
                      )}

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

                      {b.completion_photo_url && (
                        <a
                          href={b.completion_photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex rounded-full border border-[#eadff5] px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-[#f7efff]"
                        >
                          View MUA completion photo
                        </a>
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

                      {b.cancellation_reason && (
                        <p className="mt-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm text-[#6f6077]">
                          Cancellation reason: {b.cancellation_reason}
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
                        <Link
                          href={`/bride/bookings/${b.id}/payment`}
                          className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          {b.payment_proof_status === "pending_review" ? "View proof status" : b.payment_proof_status === "approved" ? "View deposit status" : "Action required · Pay deposit"}
                        </Link>
                      )}

                      {status === "confirmed" && (
                        <>
                          {!b.completed_by_bride && (
                            <button
                              onClick={() => openModal("complete", b)}
                              disabled={saving}
                              className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                            >
                              Confirm I got my makeup done
                            </button>
                          )}

                          <button
                            onClick={() => openModal("issue", b)}
                            disabled={saving}
                            className="rounded-full border border-[#eadff5] bg-white px-5 py-3 text-sm font-medium text-[#171018] transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                          >
                            Report issue
                          </button>
                        </>
                      )}

                      {canBrideCancel(b) && b.travel_fee_quote_status !== "pending_bride_approval" && (
                        <button
                          onClick={() => openCancelModal(b)}
                          disabled={saving}
                          className="rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Cancel booking
                        </button>
                      )}

                      {status === "completed" && (
                        <>
                          <span className="rounded-full border border-green-200 bg-green-50 px-5 py-3 text-sm font-medium text-green-700">Completed</span>
                          {reviewedMuaIds.includes(b.mua_id) ? (
                            <span className="rounded-full border border-[#eadff5] bg-[#fffafc] px-5 py-3 text-sm font-medium text-purple-700">Review submitted</span>
                          ) : (
                            <button type="button" onClick={() => { setSelectedBooking(b); setModalType("review"); setReviewRating(5); setReviewText(""); setModalError(null); }} className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white">Review artist</button>
                          )}
                        </>
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

      {modalType === "review" && selectedBooking && (
        <ReviewModal rating={reviewRating} setRating={setReviewRating} reviewText={reviewText} setReviewText={setReviewText} saving={saving} error={modalError} onClose={closeModal} onSubmit={submitReview} />
      )}

      {modalType && modalType !== "review" && selectedBooking && (
        <ActionModal
          type={modalType}
          saving={saving}
          issueReason={issueReason}
          setIssueReason={setIssueReason}
          modalError={modalError}
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
          modalError={modalError}
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

type ActionModalProps = {
  type: "complete" | "issue";
  saving: boolean;
  issueReason: string;
  setIssueReason: (value: string) => void;
  modalError: string | null;
  onClose: () => void;
  onComplete: () => void;
  onReport: () => void;
};

function ReviewModal({
  rating, setRating, reviewText, setReviewText, saving, error, onClose, onSubmit,
}: {
  rating: number; setRating: (value: number) => void; reviewText: string;
  setReviewText: (value: string) => void; saving: boolean; error: string | null;
  onClose: () => void; onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Bride feedback</p>
        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em] text-[#171018]">Review your artist</h2>
        <p className="mt-2 text-sm text-[#6f6077]">Your review will appear on the artist’s public Beaura profile.</p>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-5 flex gap-2" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`} className="rounded-lg p-1">
              <Star size={28} className={value <= rating ? "fill-[#d4a843] text-[#d4a843]" : "text-[#d8cddd]"} />
            </button>
          ))}
        </div>
        <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} maxLength={1000} rows={5} placeholder="Share what you liked about your experience..." className="mt-4 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500" />
        <p className="mt-1 text-right text-xs text-[#8a7d91]">{reviewText.length}/1000</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onSubmit} disabled={saving || !reviewText.trim()} className="flex-1 rounded-full bg-[#171018] py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Submitting..." : "Submit review"}</button>
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-full border border-[#eadff5] py-3 text-sm disabled:opacity-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ActionModal({
  type,
  saving,
  issueReason,
  setIssueReason,
  modalError,
  onClose,
  onComplete,
  onReport,
}: ActionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          {type === "complete" ? "confirm completion" : "report issue"}
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em] text-[#171018]">
          {type === "complete"
            ? "Got your makeup done?"
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
              Confirm only after your appointment is finished. Beaura will wait
              for the MUA’s confirmation too. The payout is released only after
              both sides confirm completion.
            </p>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-700">
              No photo is required from the bride. Photo proof is only uploaded
              by the MUA.
            </div>
          </div>
        ) : (
          <textarea
            value={issueReason}
            onChange={(e) => setIssueReason(e.target.value)}
            rows={5}
            disabled={saving}
            placeholder="Describe the issue..."
            className="mt-6 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500 disabled:opacity-60"
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

type CancelModalProps = {
  booking: Booking;
  reason: string;
  setReason: (value: string) => void;
  saving: boolean;
  modalError: string | null;
  formatMoney: (value: number | string | null | undefined) => string;
  onClose: () => void;
  onConfirm: () => void;
};

function CancelModal({
  booking,
  reason,
  setReason,
  saving,
  modalError,
  formatMoney,
  onClose,
  onConfirm,
}: CancelModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          cancel booking
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em] text-[#171018]">
          Cancel this booking?
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#6f6077]">
          Beaura will calculate your refund automatically based on the
          cancellation policy. Refunds go back to your Beaura wallet first.
        </p>

        {modalError && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {modalError}
          </div>
        )}

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
            disabled={saving}
            className="w-full resize-none rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500 disabled:opacity-60"
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
            disabled={saving}
            className="flex-1 rounded-full border border-[#eadff5] py-3 text-sm disabled:opacity-60"
          >
            Keep booking
          </button>
        </div>
      </div>
    </div>
  );
}