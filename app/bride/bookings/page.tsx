"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BrideBookings() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("bride_id", user.id)
      .order("start_time");

    setBookings(data || []);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-light">Your bookings</h1>

      {bookings.map((b) => (
        <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm">
          <p>{b.service_name}</p>
          <p className="text-sm text-gray-500">{b.status}</p>
        </div>
      ))}
    </div>
  );
}