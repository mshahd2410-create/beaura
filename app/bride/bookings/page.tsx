"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BookingStatus = "pending" | "confirmed" | "cancelled";

export default function BrideBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] =
    useState<BookingStatus>("pending");

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
      console.error("BRIDE BOOKINGS ERROR:", error);
      setBookings([]);
      setLoading(false);
      return;
    }

    const muaIds = [...new Set(bookingsData.map(b => b.mua_id))];
    const serviceIds = [...new Set(bookingsData.map(b => b.service_id))];

    const { data: muas } = await supabase
      .from("mua_profiles")
      .select("id, first_name, last_name")
      .in("id", muaIds);

    const { data: services } = await supabase
      .from("mua_services")
      .select("id, name, duration_minutes")
      .in("id", serviceIds);

    const enriched = bookingsData.map(b => ({
      ...b,
      mua: muas?.find(m => m.id === b.mua_id),
      service: services?.find(s => s.id === b.service_id),
    }));

    setBookings(enriched);
    setLoading(false);
  }

  const filtered = bookings.filter(
    b => b.status === activeStatus
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-gray-500">
        Loading your bookings…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pt-24 pb-32">
      {/* TITLE */}
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-3xl font-light tracking-tight text-black">
          Your bookings ✨
        </h1>
        <p className="text-sm text-gray-500">
          Manage your beauty moments effortlessly
        </p>
      </div>

      {/* STATUS TABS */}
      <div className="flex justify-center gap-3 mb-10">
        {(["pending", "confirmed", "cancelled"] as BookingStatus[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`
                px-5 py-2 rounded-full text-sm capitalize transition
                ${
                  activeStatus === status
                    ? "bg-purple-600 text-white"
                    : "border border-purple-200 text-purple-600 hover:bg-purple-50"
                }
              `}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* BOOKINGS */}
      <div className="max-w-3xl mx-auto space-y-6">
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No {activeStatus} bookings yet 💜
          </div>
        )}

        {filtered.map((b) => (
          <div
            key={b.id}
            className="
              rounded-3xl
              border border-purple-100
              p-6
              shadow-[0_12px_30px_rgba(124,58,237,0.08)]
              space-y-3
            "
          >
            <div className="flex justify-between items-center">
              <p className="font-medium text-black">
                {b.service?.name}
              </p>
              <span className="text-xs text-purple-600 capitalize">
                {b.status}
              </span>
            </div>

            <p className="text-sm text-gray-600">
              with{" "}
              <span className="font-medium text-black">
                {b.mua?.first_name} {b.mua?.last_name}
              </span>
            </p>

            <p className="text-sm text-gray-500">
              {b.booking_date} · {b.booking_time}
            </p>

            {b.location_notes && (
              <p className="text-xs text-gray-500 italic">
                “{b.location_notes}”
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}