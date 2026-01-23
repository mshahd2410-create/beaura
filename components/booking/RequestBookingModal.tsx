"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  muaId: string;
  services: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  }[];
};

export default function RequestBookingModal({
  open,
  onClose,
  muaId,
  services,
}: Props) {
  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const selectedService = services.find((s) => s.id === serviceId);

  const servicePrice = selectedService?.price ?? 0;
  const platformFee = Math.round(servicePrice * 0.1);
  const taxFee = Math.round(servicePrice * 0.01);
  const totalPrice = servicePrice + platformFee + taxFee;

  async function submitBooking() {
    setError(null);

    if (!serviceId || !bookingDate || !bookingTime) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("bookings")
      .insert({
        bride_id: user.id,
        mua_id: muaId,
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        location_notes: locationNotes || null,
        service_price: servicePrice,
        platform_fee: platformFee,
        tax_fee: taxFee,
        total_price: totalPrice,
        status: "pending",
      });

    if (insertError) {
      console.error("BOOKING INSERT ERROR:", insertError);
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md space-y-6">
        <h2 className="text-xl font-light">Request booking</h2>

        {/* SERVICE */}
        <div>
          <label className="text-sm text-gray-600">Service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.duration_minutes} min · EGP {s.price}
              </option>
            ))}
          </select>
        </div>

        {/* PRICE BREAKDOWN */}
        {selectedService && (
          <div className="rounded-2xl border border-gray-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Service price</span>
              <span>EGP {servicePrice}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Platform fee (10%)</span>
              <span>EGP {platformFee}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Tax (1%)</span>
              <span>EGP {taxFee}</span>
            </div>

            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total</span>
              <span>EGP {totalPrice}</span>
            </div>
          </div>
        )}

        {/* DATE */}
        <div>
          <label className="text-sm text-gray-600">Date</label>
          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* TIME */}
        <div>
          <label className="text-sm text-gray-600">Time</label>
          <input
            type="time"
            value={bookingTime}
            onChange={(e) => setBookingTime(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* NOTES */}
        <div>
          <label className="text-sm text-gray-600">Location notes</label>
          <textarea
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm rounded-full border border-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={submitBooking}
            disabled={loading}
            className="px-5 py-2 text-sm rounded-full bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}