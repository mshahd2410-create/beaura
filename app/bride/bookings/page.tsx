"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BookingStatus = "pending" | "confirmed" | "completed" | "disputed" | "cancelled";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "disputed",
  "cancelled",
];

export default function BrideBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<BookingStatus>("pending");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalType, setModalType] = useState<"complete" | "issue" | null>(null);
  const [issueReason, setIssueReason] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  function normalizeStatus(status: string | null | undefined) {
    return (status || "").toLowerCase().trim();
  }

  async function loadBookings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .eq("bride_id", user.id)
      .order("created_at", { ascending: false });

    const rows = bookingsData || [];

    const muaIds = [...new Set(rows.map((b) => b.mua_id).filter(Boolean))];
    const serviceIds = [...new Set(rows.map((b) => b.service_id).filter(Boolean))];

    const [{ data: muas }, { data: services }] = await Promise.all([
      muaIds.length
        ? supabase.from("mua_profiles").select("id, first_name, last_name").in("id", muaIds)
        : Promise.resolve({ data: [] as any[] }),
      serviceIds.length
        ? supabase.from("mua_services").select("id, name, duration_minutes").in("id", serviceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    setBookings(
      rows.map((b) => ({
        ...b,
        status: normalizeStatus(b.status || "pending"),
        mua: muas?.find((m) => m.id === b.mua_id),
        service: services?.find((s) => s.id === b.service_id),
      }))
    );

    setLoading(false);
  }

  async function uploadCompletionPhoto(bookingId: string) {
    if (!photo) return null;

    const path = `${bookingId}/${crypto.randomUUID()}-${photo.name}`;

    const { error } = await supabase.storage
      .from("booking-completion")
      .upload(path, photo);

    if (error) return null;

    const { data } = supabase.storage.from("booking-completion").getPublicUrl(path);

    return data.publicUrl;
  }

  async function completeBooking() {
    if (!selectedBooking) return;

    setSaving(true);

    const url = await uploadCompletionPhoto(selectedBooking.id);

    await supabase
      .from("bookings")
      .update({
        status: "completed",
        completed_by_bride: true,
        completed_at: new Date().toISOString(),
        completion_photo_url: url || selectedBooking.completion_photo_url || null,
      })
      .eq("id", selectedBooking.id);

    closeModal();
    await loadBookings();
    setSaving(false);
  }

  async function reportIssue() {
    if (!selectedBooking || !issueReason.trim()) return;

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("bookings")
      .update({
        status: "disputed",
        issue_reported_at: new Date().toISOString(),
        issue_reported_by: user?.id || selectedBooking.bride_id,
        issue_reason: issueReason.trim(),
      })
      .eq("id", selectedBooking.id);

    closeModal();
    await loadBookings();
    setSaving(false);
  }

  function openModal(type: "complete" | "issue", booking: any) {
    setSelectedBooking(booking);
    setModalType(type);
  }

  function closeModal() {
    setSelectedBooking(null);
    setModalType(null);
    setIssueReason("");
    setPhoto(null);
  }

  const filtered = bookings.filter((b) => normalizeStatus(b.status) === activeStatus);

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
            Tap “I got my makeup done” when everything is complete, or report an issue if something went wrong.
          </p>
        </div>

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
              {status}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState status={activeStatus} />
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => {
              const muaName =
                `${b.mua?.first_name || ""} ${b.mua?.last_name || ""}`.trim() ||
                "Your makeup artist";

              return (
                <article
                  key={b.id}
                  className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs font-medium text-purple-700 capitalize">
                        {b.status}
                      </span>

                      <h2 className="mt-4 text-3xl font-light tracking-[-0.06em] text-[#171018]">
                        {b.service?.name || "Makeup service"}
                      </h2>

                      <p className="mt-2 text-sm text-[#6f6077]">
                        With <span className="font-medium text-[#171018]">{muaName}</span>
                      </p>

                      <p className="mt-1 text-sm text-[#6f6077]">
                        {b.booking_date || "No date"} · {b.booking_time || "No time"}
                      </p>

                      {b.location_notes && (
                        <p className="mt-4 rounded-2xl bg-[#fffafc] p-4 text-sm italic text-[#6f6077]">
                          “{b.location_notes}”
                        </p>
                      )}

                      {b.issue_reason && (
                        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                          Issue reported: {b.issue_reason}
                        </p>
                      )}
                    </div>

                    {b.status === "confirmed" && (
                      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                        <button
                          onClick={() => openModal("complete", b)}
                          className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          I got my makeup done
                        </button>

                        <button
                          onClick={() => openModal("issue", b)}
                          className="rounded-full border border-[#eadff5] bg-white px-5 py-3 text-sm font-medium text-[#171018] transition hover:border-red-200 hover:text-red-600"
                        >
                          Report issue
                        </button>
                      </div>
                    )}
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
    </main>
  );
}

function EmptyState({ status }: { status: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center shadow-sm">
      <h2 className="text-2xl font-light tracking-[-0.05em]">
        No {status} bookings.
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
          {type === "complete" ? "complete booking" : "report issue"}
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">
          {type === "complete" ? "Got your makeup done?" : "Tell us what happened"}
        </h2>

        {type === "complete" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-[#6f6077]">
              You can optionally upload a photo from the appointment.
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
            {saving ? "Saving..." : type === "complete" ? "Complete" : "Submit issue"}
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