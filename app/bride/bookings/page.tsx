"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "disputed";

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

  async function loadBookings() {
    setLoading(true);

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

    if (error || !bookingsData) {
      setBookings([]);
      setLoading(false);
      return;
    }

    await autoCompleteExpiredBookings(bookingsData);

    const muaIds = [...new Set(bookingsData.map((b) => b.mua_id).filter(Boolean))];
    const serviceIds = [...new Set(bookingsData.map((b) => b.service_id).filter(Boolean))];

    const [{ data: muas }, { data: services }] = await Promise.all([
      muaIds.length
        ? supabase.from("mua_profiles").select("id, first_name, last_name").in("id", muaIds)
        : Promise.resolve({ data: [] as any[] }),
      serviceIds.length
        ? supabase.from("mua_services").select("id, name, duration_minutes").in("id", serviceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const refreshed = await supabase
      .from("bookings")
      .select("*")
      .eq("bride_id", user.id)
      .order("created_at", { ascending: false });

    const source = refreshed.data || bookingsData;

    const enriched = source.map((b) => ({
      ...b,
      mua: muas?.find((m) => m.id === b.mua_id),
      service: services?.find((s) => s.id === b.service_id),
    }));

    setBookings(enriched);
    setLoading(false);
  }

  async function autoCompleteExpiredBookings(rows: any[]) {
    const expired = rows.filter((b) => {
      if (b.status !== "confirmed") return false;
      if (!b.booking_date || !b.booking_time) return false;

      const end = getEventDate(b);
      const deadline = new Date(end.getTime() + 48 * 60 * 60 * 1000);

      return new Date() > deadline;
    });

    for (const booking of expired) {
      await supabase
        .from("bookings")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", booking.id);
    }
  }

  function getEventDate(b: any) {
    return new Date(`${b.booking_date}T${b.booking_time || "00:00"}`);
  }

  function canTakeAfterEventAction(b: any) {
    if (b.status !== "confirmed") return false;
    if (!b.booking_date || !b.booking_time) return false;

    const eventDate = getEventDate(b);
    const deadline = new Date(eventDate.getTime() + 48 * 60 * 60 * 1000);
    const now = new Date();

    return now >= eventDate && now <= deadline;
  }

  function getWindowText(b: any) {
    if (!b.booking_date || !b.booking_time) return "Available after the event.";

    const eventDate = getEventDate(b);
    const deadline = new Date(eventDate.getTime() + 48 * 60 * 60 * 1000);

    if (new Date() < eventDate) return "Available after the event.";
    if (new Date() > deadline) return "48-hour window closed.";

    return `Issue window closes ${deadline.toLocaleString()}`;
  }

  async function uploadCompletionPhoto(bookingId: string) {
    if (!photo) return null;

    const path = `${bookingId}/${crypto.randomUUID()}-${photo.name}`;

    const { error } = await supabase.storage
      .from("booking-completion")
      .upload(path, photo);

    if (error) return null;

    const { data } = supabase.storage
      .from("booking-completion")
      .getPublicUrl(path);

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

    await supabase
      .from("bookings")
      .update({
        status: "disputed",
        issue_reported_at: new Date().toISOString(),
        issue_reported_by: selectedBooking.bride_id,
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

  const filtered = bookings.filter((b) => b.status === activeStatus);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-[#6f6077]">
        Loading your bookings…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffafc] px-5 pb-32 pt-24 text-[#171018] sm:px-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[2.5rem] border border-[#eadff5] bg-white p-7 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
            your bookings
          </p>

          <h1 className="mt-3 text-5xl font-light tracking-[-0.08em]">
            Your glam plans.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
            Confirm completed bookings or report an issue within 48 hours after
            the appointment.
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
          <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
            <h2 className="text-2xl font-light tracking-[-0.05em]">
              No {activeStatus} bookings.
            </h2>
            <p className="mt-3 text-sm text-[#6f6077]">
              Your bookings will appear here when their status changes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs font-medium text-purple-700 capitalize">
                        {b.status}
                      </span>

                      {b.status === "confirmed" && (
                        <span className="text-xs text-[#8a7d91]">
                          {getWindowText(b)}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-2xl font-light tracking-[-0.05em]">
                      {b.service?.name || "Makeup service"}
                    </h2>

                    <p className="mt-2 text-sm text-[#6f6077]">
                      With{" "}
                      <span className="font-medium text-[#171018]">
                        {b.mua?.first_name} {b.mua?.last_name}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-[#6f6077]">
                      {b.booking_date || "No date"} · {b.booking_time || "No time"}
                    </p>

                    {b.location_notes && (
                      <p className="mt-3 rounded-2xl bg-[#fffafc] p-4 text-sm italic text-[#6f6077]">
                        “{b.location_notes}”
                      </p>
                    )}

                    {b.issue_reason && (
                      <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        Issue reported: {b.issue_reason}
                      </p>
                    )}
                  </div>

                  {canTakeAfterEventAction(b) && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openModal("complete", b)}
                        className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        Complete booking
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
              </div>
            ))}
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
          {type === "complete" ? "complete booking" : "report issue"}
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">
          {type === "complete" ? "Mark this booking complete?" : "Tell us what happened"}
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

        <div className="mt-6 flex gap-3">
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