"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/createNotification";

type ProofBooking = {
  id: string;
  bride_id: string;
  mua_id: string;
  total_price: number | null;
  deposit_amount?: number | null;
  payment_proof_path: string | null;
  payment_proof_status: string | null;
  payment_proof_uploaded_at: string | null;
  payment_proof_rejection_reason: string | null;
  booking_date: string | null;
  booking_time: string | null;
  bride?: { first_name: string | null; last_name: string | null; phone?: string | null } | null;
  proofUrl?: string | null;
};

export default function AdminPaymentProofsPage() {
  const [items, setItems] = useState<ProofBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProofs();
    const channel = supabase.channel("admin-payment-proofs")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => loadProofs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadProofs() {
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase
      .from("bookings")
      .select("id, bride_id, mua_id, total_price, deposit_amount, payment_proof_path, payment_proof_status, payment_proof_uploaded_at, payment_proof_rejection_reason, booking_date, booking_time")
      .in("payment_proof_status", ["pending_review", "rejected"])
      .order("payment_proof_uploaded_at", { ascending: true });
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as ProofBooking[];
    const brideIds = [...new Set(rows.map((row) => row.bride_id).filter(Boolean))];
    const { data: brides, error: brideError } = brideIds.length
      ? await supabase.from("bride_profiles").select("id, first_name, last_name, phone").in("id", brideIds)
      : { data: [] as any[], error: null };
    if (brideError) {
      setError(brideError.message);
      setLoading(false);
      return;
    }

    const hydrated = await Promise.all(rows.map(async (row) => {
      let proofUrl: string | null = null;
      if (row.payment_proof_path) {
        const { data: signed } = await supabase.storage.from("payment-proofs").createSignedUrl(row.payment_proof_path, 60 * 10);
        proofUrl = signed?.signedUrl || null;
      }
      const bride = brides?.find((profile: any) => profile.id === row.bride_id) || null;
      return { ...row, bride, proofUrl };
    }));
    setItems(hydrated);
    setLoading(false);
  }

  async function review(item: ProofBooking, decision: "approved" | "rejected") {
    setBusyId(item.id);
    setError(null);
    setMessage(null);
    const rejectionReason = (reason[item.id] || "").trim();
    if (decision === "rejected" && !rejectionReason) {
      setError("Add a reason before rejecting a payment proof.");
      setBusyId(null);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again.");
      setBusyId(null);
      return;
    }
    let reviewError: { message: string } | null = null;

    if (decision === "approved") {
      // Approval must run through the database transaction so the booking,
      // financial snapshot, and MUA deposit transfer are created atomically.
      const { error: approvalError } = await supabase.rpc(
        "admin_approve_booking_payment_proof",
        {
          p_booking_id: item.id,
          p_admin_notes: null,
        }
      );
      reviewError = approvalError;
    } else {
      // Rejection does not create financial records or confirm the booking.
      const { data: updated, error: rejectionError } = await supabase
        .from("bookings")
        .update({
          payment_proof_status: "rejected",
          payment_proof_reviewed_at: new Date().toISOString(),
          payment_proof_reviewed_by: user.id,
          payment_proof_rejection_reason: rejectionReason,
        })
        .eq("id", item.id)
        .eq("payment_proof_status", "pending_review")
        .select("id")
        .maybeSingle();

      reviewError = rejectionError;
      if (!rejectionError && !updated) {
        reviewError = {
          message: "This proof has already changed. Refresh the queue and try again.",
        };
      }
    }

    if (reviewError) {
      setError(reviewError.message);
      setBusyId(null);
      await loadProofs();
      return;
    }

    const notificationMessage = decision === "approved"
      ? "The transfer receipt was approved. The booking is now confirmed."
      : `The transfer receipt was rejected. Reason: ${rejectionReason}`;
    const notificationTargets = decision === "approved"
      ? [
          createNotification({
            userId: item.bride_id,
            actorId: user.id,
            bookingId: item.id,
            type: "booking_confirmed",
            title: "Booking confirmed",
            message: notificationMessage,
            href: "/bride/bookings",
          }),
          createNotification({
            userId: item.mua_id,
            actorId: user.id,
            bookingId: item.id,
            type: "booking_confirmed",
            title: "Booking confirmed",
            message: notificationMessage,
            href: "/dashboard/mua/bookings",
          }),
        ]
      : [
          createNotification({
            userId: item.bride_id,
            actorId: user.id,
            bookingId: item.id,
            type: "booking_rejected",
            title: "Payment proof needs attention",
            message: notificationMessage,
            href: `/bride/bookings/${item.id}/payment`,
          }),
        ];
    const notificationResults = await Promise.all(notificationTargets);
    const notificationFailed = notificationResults.some((result) => !result.success);

    let emailWarning = "";
    if (decision === "approved") {
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
          body: JSON.stringify({ bookingId: item.id, event: "confirmed" }),
        });
        const emailResult = await emailResponse.json();
        if (!emailResponse.ok || emailResult.failed?.length) {
          emailWarning = " Email delivery needs attention.";
          console.error("Booking confirmation email issue:", emailResult);
        }
      } catch (emailError) {
        emailWarning = " Email delivery needs attention.";
        console.error("Booking confirmation email request failed:", emailError);
      }
    }

    setMessage(
      (decision === "approved" ? "Deposit approved and booking confirmed." : "Proof rejected. The bride can upload a new receipt.") +
      (notificationFailed ? " Some in-app notifications could not be sent." : "") +
      emailWarning
    );
    await loadProofs();
    setBusyId(null);
  }

  const money = (value: number | null) => `EGP ${Number(value || 0).toLocaleString("en-EG", { maximumFractionDigits: 2 })}`;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 pb-16 pt-10 text-[#171018] sm:px-8">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Admin · payments</p>
        <h1 className="mt-3 text-4xl font-light tracking-[-0.06em]">Transfer proof review</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f6077]">Review each bride's Deposit due receipt. Approving a proof records the deposit approval only; it does not mark the full booking as paid.</p>
        <Link href="/admin/bookings" className="mt-5 inline-flex rounded-full border border-[#eadff5] px-5 py-3 text-sm text-[#6f6077] hover:bg-[#fffafc]">← Back to bookings</Link>
      </div>
      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {loading ? <p className="p-8 text-center text-sm text-[#6f6077]">Loading proofs...</p> : items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">No transfer proofs waiting for review.</div>
      ) : items.map((item) => {
        const brideName = `${item.bride?.first_name || ""} ${item.bride?.last_name || ""}`.trim() || "Bride";
        return (
          <article key={item.id} className="grid gap-6 rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm lg:grid-cols-[1fr_280px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs capitalize text-purple-700">{(item.payment_proof_status || "").replaceAll("_", " ")}</span>
                <span className="text-xs text-[#8a7d91]">Order #{item.id.slice(0, 8)}</span>
              </div>
              <h2 className="mt-3 text-2xl font-medium">{brideName}</h2>
              <p className="mt-1 text-sm text-[#6f6077]">{item.bride?.phone || "Phone not available"}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#fffafc] p-4"><p className="text-xs text-[#8a7d91]">Booking total</p><p className="mt-1 font-medium">{money(item.total_price)}</p></div>
                <div className="rounded-2xl bg-[#f7efff] p-4"><p className="text-xs text-purple-700">50% deposit</p><p className="mt-1 font-semibold">{money(item.deposit_amount ?? Number(item.total_price || 0) * 0.5)}</p></div>
              </div>
              <p className="mt-3 text-xs text-[#8a7d91]">Uploaded: {item.payment_proof_uploaded_at ? new Date(item.payment_proof_uploaded_at).toLocaleString() : "—"}</p>
              {item.payment_proof_status === "rejected" && item.payment_proof_rejection_reason && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">Previous rejection: {item.payment_proof_rejection_reason}</p>}
              {item.payment_proof_status === "pending_review" && (
                <div className="mt-5 space-y-3">
                  <textarea value={reason[item.id] || ""} onChange={(e) => setReason((prev) => ({ ...prev, [item.id]: e.target.value }))} rows={2} placeholder="Reason (required only when rejecting)" className="w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] p-3 text-sm outline-none focus:border-purple-500" />
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => review(item, "approved")} disabled={busyId === item.id} className="rounded-full bg-[#171018] px-5 py-3 text-sm text-white disabled:opacity-50">{busyId === item.id ? "Saving..." : "Approve deposit proof"}</button>
                    <button onClick={() => review(item, "rejected")} disabled={busyId === item.id} className="rounded-full border border-red-200 px-5 py-3 text-sm text-red-700 disabled:opacity-50">Reject proof</button>
                  </div>
                </div>
              )}
            </div>
            <div>
              {item.proofUrl ? <a href={item.proofUrl} target="_blank" rel="noreferrer" className="block"><img src={item.proofUrl} alt={`Transfer proof for order ${item.id.slice(0, 8)}`} className="max-h-80 w-full rounded-2xl border border-[#eadff5] object-contain" /><span className="mt-2 block text-center text-sm text-purple-700 underline">Open full image</span></a> : <p className="rounded-2xl bg-[#fffafc] p-6 text-sm text-[#6f6077]">Proof image unavailable. Check storage access.</p>}
            </div>
          </article>
        );
      })}
    </main>
  );
}
