"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getBookingNumber } from "@/lib/bookingNumber";

type BookingPayment = {
  id: string;
  bride_id: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  total_price: number | null;
  deposit_amount: number | null;
  payment_proof_path: string | null;
  payment_proof_status: string | null;
  payment_proof_rejection_reason: string | null;
  payment_proof_uploaded_at: string | null;
};

type BookingFinancials = {
  original_service_price: number;
  discount_amount: number;
  discounted_service_price: number;
  travel_fee: number;
  bride_platform_fee: number;
  bride_deposit_service_amount: number;
  bride_deposit_travel_amount: number;
  bride_deposit_amount: number;
  remaining_direct_amount: number;
};

const BEAURA_PAYMENT_NUMBER = "01220346180";

function PriceRow({
  label,
  value,
  strong = false,
  tone = "default",
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "discount";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={strong ? "font-semibold text-[#171018]" : tone === "discount" ? "text-green-700" : "text-[#6f6077]"}>
        {label}
      </span>
      <span className={`shrink-0 text-right ${strong ? "font-semibold text-[#171018]" : tone === "discount" ? "font-medium text-green-700" : "text-[#171018]"}`}>
        {value}
      </span>
    </div>
  );
}

export default function BookingPaymentPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingPayment | null>(null);
  const [financials, setFinancials] = useState<BookingFinancials | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  async function loadBooking() {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error: bookingError } = await supabase
      .from("bookings")
      .select("id, bride_id, status, payment_method, payment_status, total_price, deposit_amount, payment_proof_path, payment_proof_status, payment_proof_rejection_reason, payment_proof_uploaded_at")
      .eq("id", bookingId)
      .eq("bride_id", user.id)
      .maybeSingle();

    if (bookingError || !data) {
      setError(bookingError?.message || "We couldn't find this booking.");
      setLoading(false);
      return;
    }
    setBooking(data as BookingPayment);

    const { data: financialData, error: financialError } = await supabase
      .from("booking_financials")
      .select("original_service_price, discount_amount, discounted_service_price, travel_fee, bride_platform_fee, bride_deposit_service_amount, bride_deposit_travel_amount, bride_deposit_amount, remaining_direct_amount")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (financialError) {
      console.error("Could not load booking financial breakdown:", financialError);
    }
    setFinancials(financialData as BookingFinancials | null);
    setLoading(false);
  }

  async function submitProof() {
    if (!booking || !file || uploading) return;
    setError(null);
    setSuccess(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== booking.bride_id) throw new Error("Please sign in again.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${booking.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: saved, error: saveError } = await supabase.rpc(
        "submit_booking_payment_proof",
        {
          p_booking_id: booking.id,
          p_proof_path: path,
        }
      );
      if (saveError) throw saveError;
      if (saved !== true) {
        throw new Error("Your receipt uploaded, but Beaura could not save it to this booking. Please contact support before trying again.");
      }

      setBooking((current) => current ? { ...current, payment_proof_status: "pending_review", payment_proof_path: path, payment_proof_uploaded_at: new Date().toISOString(), payment_proof_rejection_reason: null } : current);
      setFile(null);
      setSuccess("Your payment proof was submitted and saved. Beaura will review it and update your booking.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload your proof. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const deposit = Number(booking?.deposit_amount ?? Number(booking?.total_price || 0) * 0.5);
  const proofStatus = booking?.payment_proof_status || "not_submitted";
  const money = (value: number | null | undefined) =>
    `EGP ${Number(value || 0).toLocaleString("en-EG", { maximumFractionDigits: 2 })}`;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-16 pt-28 text-[#171018] sm:px-8">
      <Link href="/bride/bookings" className="text-sm text-purple-700 hover:underline">← Back to bookings</Link>
      <div className="mt-6 rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-9">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Beaura payment</p>
        <h1 className="mt-3 text-4xl font-light tracking-[-0.06em]">Complete your deposit</h1>
        {loading ? (
          <p className="mt-8 text-sm text-[#6f6077]">Loading booking details...</p>
        ) : error && !booking ? (
          <p className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : booking ? (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#fffafc] p-4">
                <p className="text-xs text-[#8a7d91]">Order number</p>
                <p className="mt-1 font-semibold">#{getBookingNumber(booking.id)}</p>
              </div>
              <div className="rounded-2xl bg-[#fffafc] p-4">
                <p className="text-xs text-[#8a7d91]">Booking total</p>
                <p className="mt-1 font-semibold">EGP {Number(booking.total_price || 0).toLocaleString()}</p>
              </div>
            </div>

            {financials && (
              <section className="mt-6 rounded-[1.5rem] border border-[#eadff5] p-5 sm:p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-purple-700">Your price breakdown</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">Here’s how your total is calculated</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6f6077]">Your artist’s travel quote is included in this booking. Any promo-code discount is shown separately and applies only when you used a valid promo code.</p>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  {Number(financials.discount_amount) > 0 ? (
                    <>
                      <PriceRow label="Original makeup service" value={money(financials.original_service_price)} />
                      <PriceRow label="Promo-code discount" value={`− ${money(financials.discount_amount)}`} tone="discount" />
                      <PriceRow label="Makeup service after promo code" value={money(financials.discounted_service_price)} />
                    </>
                  ) : (
                    <PriceRow label="Makeup service price" value={money(financials.original_service_price)} />
                  )}
                  <PriceRow label="Artist’s travel fee" value={money(financials.travel_fee)} />
                  <PriceRow label="Beaura platform fee" value={money(financials.bride_platform_fee)} />
                  <div className="border-t border-[#eadff5] pt-3">
                    <PriceRow label="Full booking total" value={money(booking.total_price)} strong />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#fffafc] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-purple-700">Deposit calculation</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <PriceRow label={Number(financials.discount_amount) > 0 ? "50% of makeup service after promo code" : "50% of makeup service"} value={money(financials.bride_deposit_service_amount)} />
                    <PriceRow label="Full travel fee" value={money(financials.bride_deposit_travel_amount)} />
                    <PriceRow label="Beaura platform fee" value={money(financials.bride_platform_fee)} />
                    <div className="border-t border-[#eadff5] pt-3">
                      <PriceRow label="Deposit to pay now" value={money(financials.bride_deposit_amount)} strong />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-[#eadff5] p-4">
                  <div>
                    <p className="text-sm font-medium">Remaining service balance</p>
                    <p className="mt-1 text-xs leading-5 text-[#6f6077]">Paid directly to your makeup artist after your appointment.</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{money(financials.remaining_direct_amount)}</p>
                </div>
              </section>
            )}

            {booking.payment_method !== "transfer" ? (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">This booking does not use InstaPay or mobile wallet payment.</p>
            ) : (
              <>
                <div className="mt-6 rounded-[1.5rem] border border-purple-200 bg-[#f7efff] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-purple-700">50% deposit due</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">EGP {deposit.toLocaleString("en-EG", { maximumFractionDigits: 2 })}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6f6077]">Pay this deposit using InstaPay or a mobile wallet to the Beaura number below after your makeup artist accepts your request.</p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-[#eadff5] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">InstaPay / Mobile Wallet</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-2xl font-semibold tracking-wide">{BEAURA_PAYMENT_NUMBER}</p>
                    <button type="button" onClick={() => navigator.clipboard.writeText(BEAURA_PAYMENT_NUMBER)} className="rounded-full border border-[#eadff5] px-4 py-2 text-sm hover:bg-[#fffafc]">Copy number</button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6f6077]">Send the exact deposit amount using InstaPay or a mobile wallet to the Beaura number above. Keep your payment screenshot so you can upload it below.</p><p className="mt-3 rounded-xl bg-[#fffafc] p-4 text-sm leading-6 text-[#6f6077]">Please include your order number in the payment note, or send it to us on WhatsApp with your payment screenshot.</p>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Please submit your deposit proof within 48 hours of the artist accepting your booking. If you need help, contact Beaura support.
                </div>

                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-medium">Payment proof</h2>
                    <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs capitalize text-purple-700">{proofStatus.replaceAll("_", " ")}</span>
                  </div>
                  {proofStatus === "approved" ? (
                    <p className="mt-3 rounded-2xl bg-green-50 p-4 text-sm text-green-800">Your deposit proof has been approved by Beaura.</p>
                  ) : proofStatus === "pending_review" ? (
                    <p className="mt-3 rounded-2xl bg-[#fffafc] p-4 text-sm text-[#6f6077]">Pending admin verification. Your proof is awaiting review. You can return to this page later to check its status.</p>
                  ) : (
                    <>
                      {proofStatus === "rejected" && (
                        <p className="mt-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">Your previous proof was not approved. {booking.payment_proof_rejection_reason || "Please upload a clearer receipt."}</p>
                      )}
                      <label className="mt-4 block rounded-2xl border border-dashed border-[#cdb9df] bg-[#fffafc] p-5">
                        <span className="block text-sm font-medium">Upload a screenshot of your InstaPay or mobile wallet payment</span>
                        <span className="mt-1 block text-xs text-[#8a7d91]">JPG, PNG, or WebP · Maximum 5 MB</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-4 block w-full text-sm" />
                      </label>
                      {file && <p className="mt-2 text-sm text-[#6f6077]">Selected: {file.name}</p>}
                      <button type="button" onClick={submitProof} disabled={!file || uploading} className="mt-4 w-full rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{uploading ? "Uploading..." : "Submit payment proof"}</button>
                    </>
                  )}
                </div>
              </>
            )}
            {success && <p className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">{success}</p>}
            {error && booking && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          </>
        ) : null}
      </div>
    </main>
  );
}
