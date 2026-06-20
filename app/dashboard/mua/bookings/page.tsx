"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Booking = {
  id: string;
  bride_id: string;
  service_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
  location: string | null;
  location_notes: string | null;
  status: string;
  created_at: string;
  completion_photo_url?: string | null;
  issue_reason?: string | null;
  bride?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
  } | null;
};

const STATUSES = ["pending", "confirmed", "completed", "disputed", "cancelled"];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  async function fetchBookings() {
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
      .eq("mua_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !bookingsData) {
      console.error("FETCH BOOKINGS ERROR:", error);
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
            .select("id, name")
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

  async function updateStatus(id: string, status: "confirmed" | "cancelled") {
    setUpdatingId(id);

    await supabase.from("bookings").update({ status }).eq("id", id);

    await fetchBookings();
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

    const photoUrl = await uploadCompletionPhoto(selectedBooking.id);

    await supabase
      .from("bookings")
      .update({
        status: "completed",
        completed_by_mua: true,
        completed_at: new Date().toISOString(),
        completion_photo_url:
          photoUrl || selectedBooking.completion_photo_url || null,
      })
      .eq("id", selectedBooking.id);

    closeModal();
    await fetchBookings();
    setUpdatingId(null);
  }

  async function reportIssue() {
    if (!selectedBooking || !issueReason.trim()) return;

    setUpdatingId(selectedBooking.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("bookings")
      .update({
        status: "disputed",
        issue_reported_at: new Date().toISOString(),
        issue_reported_by: user?.id || null,
        issue_reason: issueReason.trim(),
      })
      .eq("id", selectedBooking.id);

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

  const filtered = bookings.filter(
    (b) => normalizeStatus(b.status) === activeStatus
  );

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
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center shadow-sm">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No {activeStatus} bookings.
          </h2>
          <p className="mt-3 text-sm text-[#6f6077]">
            Once bookings move to this status, they’ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const brideName =
              `${b.bride?.first_name || ""} ${b.bride?.last_name || ""}`.trim() ||
              "Bride";

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
                        {status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <InfoCard
                        label="Location"
                        value={b.location || "Not provided"}
                      />
                      <InfoCard
                        label="Notes"
                        value={b.location_notes || "No additional notes"}
                      />
                    </div>

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
                          onClick={() => updateStatus(b.id, "confirmed")}
                          disabled={updatingId === b.id}
                          className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {updatingId === b.id ? "Saving..." : "Confirm"}
                        </button>

                        <button
                          onClick={() => updateStatus(b.id, "cancelled")}
                          disabled={updatingId === b.id}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                        >
                          Decline booking
                        </button>
                      </>
                    )}

                    {status === "confirmed" && (
                      <>
                        <button
                          onClick={() => openModal("complete", b)}
                          className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Complete booking
                        </button>

                        <button
                          onClick={() => openModal("issue", b)}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600"
                        >
                          Report a problem
                        </button>

                        <button
                          onClick={() => updateStatus(b.id, "cancelled")}
                          disabled={updatingId === b.id}
                          className="rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                        >
                          Cancel booking
                        </button>
                      </>
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
      <p className="mt-1 text-sm text-[#171018]">{value}</p>
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
          {type === "complete" ? "complete booking" : "report problem"}
        </p>

        <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">
          {type === "complete"
            ? "Mark this booking complete?"
            : "Tell us what happened"}
        </h2>

        {type === "complete" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-[#6f6077]">
              Uploading a photo is optional.
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
              ? "Complete"
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