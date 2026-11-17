"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BookingPayment = {
  id: string;
  bride_id: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  total_price: number | null;
  payment_proof_path: string | null;
  payment_proof_status: string | null;
  payment_proof_rejection_reason: string | null;
  payment_proof_uploaded_at: string | null;
};

const BEAURA_PAYMENT_NUMBER = "01220346180";

export default function BookingPaymentPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingPayment | null>(null);
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
      .select("id, bride_id, status, payment_method, payment_status, total_price, payment_proof_path, payment_proof_status, payment_proof_rejection_reason, payment_proof_uploaded_at")
      .eq("id", bookingId)
      .eq("bride_id", user.id)
      .maybeSingle();

    if (bookingError || !data) {
      setError(bookingError?.message || "We couldn't find this booking.");
      setLoading(false);
      return;
    }
    setBooking(data as BookingPayment);
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

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_proof_path: path,
          payment_proof_status: "pending_review",
          payment_proof_uploaded_at: new Date().toISOString(),
          payment_proof_reviewed_at: null,
          payment_proof_reviewed_by: null,
          payment_proof_rejection_reason: null,
        })
        .eq("id", booking.id)
        .eq("bride_id", user.id);
      if (updateError) throw updateError;

      setFile(null);
      setSuccess("Your transfer proof was submitted. Beaura will review it and update your booking.");
      await loadBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload your proof. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const deposit = Number(booking?.total_price || 0) * 0.5;
  const proofStatus = booking?.payment_proof_status || "not_submitted";

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
                <p className="text-xs text-[#8a7d91]">Booking number</p>
                <p className="mt-1 font-semibold">#{booking.id.slice(0, 8)}</p>
              </div>
              <div className="rounded-2xl bg-[#fffafc] p-4">
                <p className="text-xs text-[#8a7d91]">Booking total</p>
                <p className="mt-1 font-semibold">EGP {Number(booking.total_price || 0).toLocaleString()}</p>
              </div>
            </div>

            {booking.payment_method !== "transfer" ? (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">This booking does not use transfer payment.</p>
            ) : (
              <>
                <div className="mt-6 rounded-[1.5rem] border border-purple-200 bg-[#f7efff] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-purple-700">50% deposit due</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">EGP {deposit.toLocaleString("en-EG", { maximumFractionDigits: 2 })}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6f6077]">Please send this deposit to the Beaura payment number below after your makeup artist accepts your request.</p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-[#eadff5] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">Beaura payment number</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-2xl font-semibold tracking-wide">{BEAURA_PAYMENT_NUMBER}</p>
                    <button type="button" onClick={() => navigator.clipboard.writeText(BEAURA_PAYMENT_NUMBER)} className="rounded-full border border-[#eadff5] px-4 py-2 text-sm hover:bg-[#fffafc]">Copy number</button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6f6077]">Use your preferred transfer or wallet app to send the exact deposit amount. Keep your transfer receipt so you can upload it below.</p>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Please submit your deposit proof within 48 hours of the artist accepting your booking. If you need help, contact Beaura support.
                </div>

                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-medium">Transfer proof</h2>
                    <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs capitalize text-purple-700">{proofStatus.replaceAll("_", " ")}</span>
                  </div>
                  {proofStatus === "approved" ? (
                    <p className="mt-3 rounded-2xl bg-green-50 p-4 text-sm text-green-800">Your deposit proof has been approved by Beaura.</p>
                  ) : proofStatus === "pending_review" ? (
                    <p className="mt-3 rounded-2xl bg-[#fffafc] p-4 text-sm text-[#6f6077]">Your proof is awaiting review. You can return to this page later to check its status.</p>
                  ) : (
                    <>
                      {proofStatus === "rejected" && (
                        <p className="mt-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">Your previous proof was not approved. {booking.payment_proof_rejection_reason || "Please upload a clearer receipt."}</p>
                      )}
                      <label className="mt-4 block rounded-2xl border border-dashed border-[#cdb9df] bg-[#fffafc] p-5">
                        <span className="block text-sm font-medium">Upload a screenshot of your transfer</span>
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
