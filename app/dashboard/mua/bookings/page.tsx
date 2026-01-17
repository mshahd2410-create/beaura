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
    await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    fetchBookings();
  }

  if (loading) return <p>Loading bookings…</p>;

  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-xl mb-6">Bookings</h2>

      {bookings.length === 0 && (
        <p className="text-gray-500">
          No bookings yet.
        </p>
      )}

      <div className="space-y-4">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{b.bride_name}</p>
              <p className="text-sm text-gray-500">
                {b.service} · {b.event_date}
              </p>
              <p className="text-xs mt-1">
                Status: <strong>{b.status}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              {b.status === "pending" && (
                <>
                  <button
                    onClick={() =>
                      updateStatus(b.id, "confirmed")
                    }
                    className="px-3 py-1 text-sm rounded-full bg-black text-white"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() =>
                      updateStatus(b.id, "cancelled")
                    }
                    className="px-3 py-1 text-sm rounded-full border"
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
