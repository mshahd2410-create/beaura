"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  // 🔴 REALTIME LISTENER (NO UI CHANGE)
  useEffect(() => {
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel("mua-bookings-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `mua_id=eq.${user.id}`,
          },
          () => {
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, []);

  async function fetchBookings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // 1️⃣ Fetch bookings
    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("mua_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("FETCH BOOKINGS ERROR:", error);
      setBookings([]);
      setLoading(false);
      return;
    }

    if (!bookingsData || bookingsData.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    // 2️⃣ Collect IDs
    const brideIds = [...new Set(bookingsData.map((b) => b.bride_id))];
    const serviceIds = [...new Set(bookingsData.map((b) => b.service_id))];

    // 3️⃣ Fetch brides
    const { data: brides } = await supabase
      .from("bride_profiles")
      .select("id, first_name, last_name")
      .in("id", brideIds);

    // 4️⃣ Fetch services
    const { data: services } = await supabase
      .from("mua_services")
      .select("id, name")
      .in("id", serviceIds);

    // 5️⃣ Merge
    const enriched = bookingsData.map((b) => ({
      ...b,
      bride: brides?.find((br) => br.id === b.bride_id),
      service: services?.find((s) => s.id === b.service_id),
    }));

    setBookings(enriched);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
  }

  if (loading) {
    return <p className="text-gray-600">Loading bookings…</p>;
  }

  return (
    <section
      className="
        bg-white
        rounded-3xl
        p-8
        border border-black/5
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
      "
    >
      <h2 className="text-xl font-light text-black mb-6">
        Bookings
      </h2>

      {bookings.length === 0 && (
        <p className="text-gray-500">No bookings yet.</p>
      )}

      <div className="space-y-4">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="
              border border-black/5
              rounded-2xl
              p-5
              flex
              justify-between
              items-center
              transition
              hover:shadow-[0_10px_30px_rgba(124,58,237,0.12)]
            "
          >
            <div>
              <p className="font-medium text-black">
                {b.bride?.first_name} {b.bride?.last_name}
              </p>

              <p className="text-sm text-gray-600">
                {b.service?.name} · {b.booking_date} · {b.booking_time}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Location: {b.location}
              </p>

              {b.location_notes && (
                <p className="text-xs text-gray-500 mt-1">
                  Notes: {b.location_notes}
                </p>
              )}

              <p className="text-xs mt-2 text-gray-500">
                Status:{" "}
                <strong className="text-black">
                  {b.status}
                </strong>
              </p>
            </div>

            <div className="flex gap-2">
              {b.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="
                      px-4
                      py-1.5
                      text-sm
                      rounded-full
                      bg-black
                      text-white
                      hover:bg-purple-600
                      transition
                    "
                  >
                    Confirm
                  </button>

                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="
                      px-4
                      py-1.5
                      text-sm
                      rounded-full
                      border
                      border-black/10
                      text-gray-700
                      hover:border-purple-600
                      hover:text-purple-600
                      transition
                    "
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}