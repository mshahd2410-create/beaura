"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("mua_id", user.id)
      .order("event_date", { ascending: true });

    if (!error) setBookings(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    fetchBookings();
  }

  if (loading)
    return (
      <p className="text-gray-600">
        Loading bookings…
      </p>
    );

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
        <p className="text-gray-500">
          No bookings yet.
        </p>
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
                {b.bride_name}
              </p>
              <p className="text-sm text-gray-600">
                {b.service} · {b.event_date}
              </p>
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
                    onClick={() =>
                      updateStatus(b.id, "confirmed")
                    }
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
                    onClick={() =>
                      updateStatus(b.id, "cancelled")
                    }
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