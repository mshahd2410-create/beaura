"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/createNotification";
import { getBookingNumber } from "@/lib/bookingNumber";
import { Eye, Search, X } from "lucide-react";

type Booking = {
  id: string;
  booking_reference: string;
  booking_date: string | null;
  booking_time: string | null;
  status: string | null;
  bride_id: string | null;
  mua_id: string | null;
  service_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;

  service_price: number | null;
  platform_fee: number | null;
  tax_fee: number | null;
  total_price: number | null;

  payment_method?: string | null;
  payment_status?: string | null;
  card_paid?: boolean | null;
  card_paid_at?: string | null;
  wallet_charged?: boolean | null;
  wallet_charged_at?: string | null;
  wallet_credit_amount?: number | null;
  amount_due_after_wallet?: number | null;
  payment_proof_status?: string | null;

  refund_processed?: boolean | null;
  refund_amount?: number | null;
  refund_processed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;

  completion_photo_url?: string | null;
  issue_reason?: string | null;

  bride?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;

  mua?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;

  service?: {
    id: string;
    name: string | null;
    price: number | null;
    duration_minutes: number | null;
  } | null;
};

type StatusFilter =
  | "all"
  | "pending"
  | "confirmed_payment_pending"
  | "confirmed"
  | "completed"
  | "disputed"
  | "cancelled";

const FILTERS: StatusFilter[] = [
  "all",
  "pending",
  "confirmed_payment_pending",
  "confirmed",
  "completed",
  "disputed",
  "cancelled",
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    loadBookings();

    const channel = supabase
      .channel("admin-bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => loadBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function normalizeStatus(status: string | null | undefined) {
    return (status || "pending").toLowerCase().trim();
  }

  function cleanText(value: string | null | undefined) {
    return (value || "—").replaceAll("_", " ");
  }

  async function loadBookings() {
    setLoading(true);
    setPageError(null);

    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BOOKINGS LOAD ERROR:", error);
      setPageError(error.message);
      setLoading(false);
      return;
    }

    const raw = (bookingsData || []) as Booking[];

    const brideIds = Array.from(
      new Set(raw.map((b) => b.bride_id).filter(Boolean))
    ) as string[];

    const muaIds = Array.from(
      new Set(raw.map((b) => b.mua_id).filter(Boolean))
    ) as string[];

    const serviceIds = Array.from(
      new Set(raw.map((b) => b.service_id).filter(Boolean))
    ) as string[];

    const [bridesRes, muasRes, servicesRes] = await Promise.all([
      brideIds.length
        ? supabase
            .from("bride_profiles")
            .select("id, first_name, last_name")
            .in("id", brideIds)
        : Promise.resolve({ data: [] as any[] }),

      muaIds.length
        ? supabase
            .from("mua_profiles")
            .select("id, first_name, last_name")
            .in("id", muaIds)
        : Promise.resolve({ data: [] as any[] }),

      serviceIds.length
        ? supabase
            .from("mua_services")
            .select("id, name, price, duration_minutes")
            .in("id", serviceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    setBookings(
      raw.map((booking) => ({
        ...booking,
        status: normalizeStatus(booking.status),
        bride:
          bridesRes.data?.find((b: any) => b.id === booking.bride_id) || null,
        mua: muasRes.data?.find((m: any) => m.id === booking.mua_id) || null,
        service:
          servicesRes.data?.find((s: any) => s.id === booking.service_id) ||
          null,
      }))
    );

    setLoading(false);
  }

  async function resendBookingWhatsApp(id: string) {
    setUpdatingId(id);
    setPageError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Your admin session expired. Please sign in again.");
      const response = await fetch("/api/admin/booking-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ bookingId: id, event: "whatsapp_confirmation" }),
      });
      const result = await response.json();
      if (!response.ok || result.whatsapp?.success !== true) {
        throw new Error(result.whatsapp?.error || result.error || "WhatsApp confirmation could not be sent.");
      }
      setPageError("WhatsApp confirmation accepted by Meta for sending.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : String(error));
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateBookingStatus(id: string, status: string) {
    setUpdatingId(id);
    setPageError(null);

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      setPageError(error.message);
      setUpdatingId(null);
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );

    if (selectedBooking?.id === id) {
      setSelectedBooking({ ...selectedBooking, status });
    }

    // A booking confirmation must trigger the approved bride WhatsApp template.
    // The API also sends the existing confirmation emails and reports each result.
    if (status === "confirmed") {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          throw new Error("Your admin session expired. Please sign in again.");
        }

        const notificationResponse = await fetch("/api/admin/booking-notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ bookingId: id, event: "confirmed" }),
        });
        const notificationResult = await notificationResponse.json();

        if (notificationResult.whatsapp?.success !== true) {
          const whatsappError =
            notificationResult.whatsapp?.error ||
            notificationResult.error ||
            "WhatsApp confirmation could not be verified.";
          setPageError(`Booking confirmed, but the bride's WhatsApp message was not sent: ${whatsappError}`);
          console.error("Booking confirmation notification issue:", notificationResult);
        } else if (notificationResult.failed?.length) {
          setPageError("Booking confirmed and WhatsApp accepted, but one or more confirmation emails failed.");
          console.error("Booking confirmation email issue:", notificationResult.failed);
        } else if (!notificationResponse.ok) {
          setPageError("Booking confirmed, but the notification service returned an unexpected response. Check server logs.");
          console.error("Booking confirmation notification response:", notificationResult);
        }
      } catch (notificationError) {
        const message =
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError);
        setPageError(`Booking confirmed, but the confirmation notification could not be sent: ${message}`);
        console.error("Booking confirmation notification request failed:", notificationError);
      }
    }

    setUpdatingId(null);
  }

  function openCancelModal(booking: Booking) {
    setCancelBooking(booking);
    setCancelReason(
      "Booking cancelled by Beaura admin. Refund added to bride wallet if payment was already collected."
    );
  }

  function closeCancelModal() {
    setCancelBooking(null);
    setCancelReason("");
  }

  async function confirmCancelAndRefund() {
    if (!cancelBooking) return;

    setUpdatingId(cancelBooking.id);
    setPageError(null);

    const cancellationReason = cancelReason.trim() || "Cancelled by Beaura admin";
    const { error } = await supabase.rpc(
      "admin_cancel_booking_and_refund_bride",
      {
        p_booking_id: cancelBooking.id,
        p_reason: cancellationReason,
      }
    );

    if (error) {
      setPageError(error.message);
      setUpdatingId(null);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const notificationMessage = `Your booking for ${cancelBooking.service?.name || "the selected service"} has been cancelled. Reason: ${cancellationReason}`;
      const notificationResults = await Promise.all([
        cancelBooking.bride_id ? createNotification({
          userId: cancelBooking.bride_id,
          actorId: user.id,
          bookingId: cancelBooking.id,
          type: "booking_cancelled",
          title: "Booking cancelled",
          message: notificationMessage,
          href: "/bride/bookings",
        }) : Promise.resolve({ success: false }),
        cancelBooking.mua_id ? createNotification({
          userId: cancelBooking.mua_id,
          actorId: user.id,
          bookingId: cancelBooking.id,
          type: "booking_cancelled",
          title: "Booking cancelled",
          message: notificationMessage,
          href: "/dashboard/mua/bookings",
        }) : Promise.resolve({ success: false }),
      ]);
      if (notificationResults.some((result) => !result.success)) {
        setPageError("Booking was cancelled, but one or more in-app notifications could not be sent.");
      }
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error("Your session expired. Please sign in again.");
      }
      const emailResponse = await fetch("/api/admin/booking-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ bookingId: cancelBooking.id, event: "cancelled", reason: cancellationReason }),
      });
      const emailResult = await emailResponse.json();
      if (!emailResponse.ok || emailResult.failed?.length) {
        setPageError("Booking was cancelled, but email delivery needs attention. Please check the email service.");
        console.error("Booking cancellation email issue:", emailResult);
      }
    } catch (emailError) {
      setPageError("Booking was cancelled, but email delivery could not be confirmed.");
      console.error("Booking cancellation email request failed:", emailError);
    }

    closeCancelModal();
    setSelectedBooking(null);
    await loadBookings();
    setUpdatingId(null);
  }

  const filteredBookings = useMemo(() => {
    const query = search.toLowerCase();

    return bookings.filter((booking) => {
      const brideName =
        `${booking.bride?.first_name || ""} ${
          booking.bride?.last_name || ""
        }`.toLowerCase();

      const muaName =
        `${booking.mua?.first_name || ""} ${
          booking.mua?.last_name || ""
        }`.toLowerCase();

      const serviceName = booking.service?.name?.toLowerCase() || "";
      const id = booking.id.toLowerCase();
      const status = normalizeStatus(booking.status);

      const paymentMethod = booking.payment_method?.toLowerCase() || "";
      const paymentStatus = booking.payment_status?.toLowerCase() || "";

      const matchesSearch =
        brideName.includes(query) ||
        muaName.includes(query) ||
        serviceName.includes(query) ||
        id.includes(query) ||
        paymentMethod.includes(query) ||
        paymentStatus.includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "cancelled"
          ? status.includes("cancelled")
          : status === filter);

      return matchesSearch && matchesFilter;
    });
  }, [bookings, search, filter]);

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => normalizeStatus(b.status) === "pending")
      .length,
    cardPending: bookings.filter(
      (b) => normalizeStatus(b.status) === "confirmed_payment_pending"
    ).length,
    confirmed: bookings.filter((b) => normalizeStatus(b.status) === "confirmed")
      .length,
    completed: bookings.filter((b) => normalizeStatus(b.status) === "completed")
      .length,
    disputed: bookings.filter((b) => normalizeStatus(b.status) === "disputed")
      .length,
  };

  function formatMoney(value: number | null | undefined) {
    if (value === null || value === undefined) return "EGP 0";
    return `EGP ${Number(value).toLocaleString()}`;
  }

  function formatDate(date: string | null | undefined) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getBrideName(booking: Booking) {
    return (
      `${booking.bride?.first_name || ""} ${
        booking.bride?.last_name || ""
      }`.trim() || "Unknown client"
    );
  }

  function getMuaName(booking: Booking) {
    return (
      `${booking.mua?.first_name || ""} ${
        booking.mua?.last_name || ""
      }`.trim() || "Unknown MUA"
    );
  }

  function getPaymentMethod(booking: Booking) {
    if (booking.payment_method === "credit_balance") return "Beaura Wallet";
    return "Transfer";
  }

  function getPaymentStatus(booking: Booking) {
    const status = normalizeStatus(booking.status);

    if (booking.payment_method === "credit_balance") {
      return booking.wallet_charged ? "Credit charged" : "Credit pending";
    }

    if (status === "confirmed_payment_pending") {
      return booking.payment_proof_status === "pending_review" ? "Deposit proof under review" : booking.payment_proof_status === "approved" ? "Deposit approved" : booking.payment_proof_status === "rejected" ? "Proof rejected" : "50% deposit pending";
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

  function canCancel(booking: Booking) {
    const status = normalizeStatus(booking.status);
    return (
      !status.includes("cancelled") &&
      status !== "completed" &&
      !booking.refund_processed
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          booking control
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Bookings
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Monitor bookings, review payments, and cancel bookings with automatic
          bride wallet refund when payment was already collected.
        </p>
        <Link href="/admin/payment-proofs" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
          Review transfer proofs
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">Open queue</span>
        </Link>
      </div>

      {pageError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Total" value={counts.total} />
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Card pending" value={counts.cardPending} />
        <Stat label="Confirmed" value={counts.confirmed} />
        <Stat label="Completed" value={counts.completed} />
        <Stat label="Disputed" value={counts.disputed} />
      </div>

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
              size={17}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bride, MUA, service, booking ID, payment..."
              className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
            {FILTERS.map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm capitalize ${
                  filter === value
                    ? "bg-[#171018] text-white"
                    : "text-[#6f6077] hover:bg-[#f7efff]"
                }`}
              >
                {cleanText(value)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading bookings...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No bookings found.
          </h2>
          <p className="mt-3 text-sm text-[#6f6077]">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs font-medium capitalize text-purple-700">
                      {cleanText(booking.status)}
                    </span>
                    <span className="rounded-full border border-[#eadff5] bg-[#fffafc] px-3 py-1 text-xs text-[#6f6077]">
                      {getPaymentMethod(booking)}
                    </span>
                    <span className="rounded-full border border-[#eadff5] bg-white px-3 py-1 text-xs text-[#6f6077]">
                      {getPaymentStatus(booking)}
                    </span>
                    <span className="text-xs text-[#8a7d91]">
                      #{getBookingNumber(booking.booking_reference)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-light tracking-[-0.05em] text-[#171018]">
                    {booking.service?.name || "Service"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                    {getBrideName(booking)} with {getMuaName(booking)}
                  </p>

                  <p className="mt-1 text-sm text-[#6f6077]">
                    {formatDate(booking.booking_date)} ·{" "}
                    {booking.booking_time || "—"} ·{" "}
                    {formatMoney(booking.total_price)}
                  </p>

                  {booking.refund_processed && (
                    <p className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
                      Refund processed: {formatMoney(booking.refund_amount)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2 text-sm"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  {normalizeStatus(booking.status) === "pending" && booking.payment_method !== "transfer" && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, "confirmed")}
                      disabled={updatingId === booking.id}
                      className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 disabled:opacity-50"
                    >
                      {updatingId === booking.id ? "Saving..." : "Confirm booking"}
                    </button>
                  )}

                  {booking.payment_method === "transfer" && normalizeStatus(booking.status) === "confirmed_payment_pending" && (
                    <Link
                      href="/admin/payment-proofs"
                      className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 transition hover:bg-[#f7efff]"
                    >
                      Review deposit
                    </Link>
                  )}

                  {normalizeStatus(booking.status) === "confirmed" && (
                    <>
                      <button
                        onClick={() => resendBookingWhatsApp(booking.id)}
                        disabled={updatingId === booking.id}
                        className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 disabled:opacity-50"
                      >
                        {updatingId === booking.id ? "Sending..." : "Resend WhatsApp"}
                      </button>
                      <span className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                        Awaiting both completion confirmations
                      </span>
                    </>
                  )}

                  {canCancel(booking) && (
                    <button
                      onClick={() => openCancelModal(booking)}
                      disabled={updatingId === booking.id}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                    >
                      Cancel & refund
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadff5] bg-white px-5 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                  booking details
                </p>
                <h2 className="mt-1 text-2xl font-light tracking-[-0.05em]">
                  #{getBookingNumber(selectedBooking.booking_reference)}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <Section title="People">
                <Detail label="Client" value={getBrideName(selectedBooking)} />
                <Detail label="MUA" value={getMuaName(selectedBooking)} />
              </Section>

              <Section title="Booking info">
                <Detail
                  label="Status"
                  value={cleanText(selectedBooking.status)}
                />
                <Detail
                  label="Service"
                  value={selectedBooking.service?.name || "—"}
                />
                <Detail
                  label="Date"
                  value={formatDate(selectedBooking.booking_date)}
                />
                <Detail
                  label="Time"
                  value={selectedBooking.booking_time || "—"}
                />
                <Detail
                  label="Location"
                  value={selectedBooking.location || "No location provided"}
                />
                <Detail
                  label="Notes"
                  value={selectedBooking.notes || "No notes provided"}
                  large
                />
              </Section>

              <Section title="Payment">
                <Detail
                  label="Payment method"
                  value={getPaymentMethod(selectedBooking)}
                />
                <Detail
                  label="Payment status"
                  value={getPaymentStatus(selectedBooking)}
                />
                <Detail
                  label="Wallet charged"
                  value={selectedBooking.wallet_charged ? "Yes" : "No"}
                />
                <Detail
                  label="Legacy card paid"
                  value={selectedBooking.card_paid ? "Yes" : "No"}
                />
                <Detail
                  label="Amount due after wallet"
                  value={formatMoney(selectedBooking.amount_due_after_wallet)}
                />
              </Section>

              <Section title="Price breakdown">
                <Detail
                  label="Service price"
                  value={formatMoney(selectedBooking.service_price)}
                />
                <Detail
                  label="Platform fee"
                  value={formatMoney(selectedBooking.platform_fee)}
                />
                <Detail
                  label="Tax"
                  value={formatMoney(selectedBooking.tax_fee)}
                />
                <Detail
                  label="Total"
                  value={formatMoney(selectedBooking.total_price)}
                />
              </Section>

              <Section title="Refund">
                <Detail
                  label="Refund processed"
                  value={selectedBooking.refund_processed ? "Yes" : "No"}
                />
                <Detail
                  label="Refund amount"
                  value={formatMoney(selectedBooking.refund_amount)}
                />
                <Detail
                  label="Refund date"
                  value={formatDate(selectedBooking.refund_processed_at || null)}
                />
                <Detail
                  label="Cancellation reason"
                  value={selectedBooking.cancellation_reason || "—"}
                  large
                />
              </Section>

              {selectedBooking.issue_reason && (
                <Section title="Issue report">
                  <Detail
                    label="Issue"
                    value={selectedBooking.issue_reason}
                    large
                  />
                </Section>
              )}

              <Section title="Completion photo">
                {selectedBooking.completion_photo_url ? (
                  <img
                    src={selectedBooking.completion_photo_url}
                    alt="Completion"
                    className="w-full rounded-[2rem] object-cover"
                  />
                ) : (
                  <p className="text-sm text-[#6f6077]">
                    No completion photo uploaded.
                  </p>
                )}
              </Section>

              <div className="flex flex-wrap gap-3 pb-6">
                <button
                  onClick={() =>
                    updateBookingStatus(selectedBooking.id, "completed")
                  }
                  className="rounded-full border border-green-200 px-5 py-3 text-sm text-green-700"
                >
                  Mark completed
                </button>
                {canCancel(selectedBooking) && (
                  <button
                    onClick={() => openCancelModal(selectedBooking)}
                    className="rounded-full border border-red-200 px-5 py-3 text-sm text-red-600"
                  >
                    Cancel & refund
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {cancelBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
              cancel booking
            </p>

            <h2 className="mt-3 text-3xl font-light tracking-[-0.06em] text-[#171018]">
              Cancel and refund?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#6f6077]">
              If payment was already collected, the refund will be added to the
              bride wallet as Beaura credit. The bride can later request a cash
              refund from her wallet.
            </p>

            <div className="mt-5 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm">
              <p className="font-medium text-[#171018]">
                {cancelBooking.service?.name || "Service"}
              </p>
              <p className="mt-1 text-[#6f6077]">
                {getBrideName(cancelBooking)} ·{" "}
                {formatMoney(cancelBooking.total_price)}
              </p>
              <p className="mt-1 text-[#6f6077]">
                Payment: {getPaymentMethod(cancelBooking)} ·{" "}
                {getPaymentStatus(cancelBooking)}
              </p>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
                Admin cancellation reason
              </span>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 text-sm outline-none focus:border-purple-500"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmCancelAndRefund}
                disabled={updatingId === cancelBooking.id}
                className="flex-1 rounded-full bg-red-600 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {updatingId === cancelBooking.id
                  ? "Processing..."
                  : "Cancel & refund"}
              </button>

              <button
                onClick={closeCancelModal}
                className="flex-1 rounded-full border border-[#eadff5] py-3 text-sm"
              >
                Keep booking
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <h2 className="mt-3 text-4xl font-light tracking-[-0.06em] text-[#171018]">
        {value}
      </h2>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#eadff5] bg-[#fffafc] p-5">
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-purple-700">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Detail({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-7 text-[#171018] ${
          large ? "" : "break-all"
        }`}
      >
        {value}
      </p>
    </div>
  );
}