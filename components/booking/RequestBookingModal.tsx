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
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
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

    if (!serviceId || !bookingDate || !bookingTime || !location) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      bride_id: user.id,
      mua_id: muaId,
      service_id: serviceId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      location: location,
notes: notes || null,
      service_price: servicePrice,
      platform_fee: platformFee,
      tax_fee: taxFee,
      total_price: totalPrice,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setServiceId("");
    setBookingDate("");
    setBookingTime("");
    setLocation("");
    setNotes("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-2xl sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          booking request
        </p>

        <h2 className="mt-3 text-4xl font-light leading-[0.9] tracking-[-0.07em] text-[#171018]">
          Request your glam time.
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#6f6077]">
          Send your date, time, location, and service request. The artist will confirm or decline.
        </p>

        <div className="mt-7 space-y-4">
          <Field label="Service">
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="input"
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_minutes} min · EGP {s.price}
                </option>
              ))}
            </select>
          </Field>

          {selectedService && (
            <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4 text-sm">
              <PriceRow label="Service price" value={servicePrice} />
              <PriceRow label="Platform fee" value={platformFee} />
              <PriceRow label="Tax" value={taxFee} />
              <div className="mt-3 flex justify-between border-t border-[#eadff5] pt-3 font-semibold">
                <span>Total</span>
                <span>EGP {totalPrice}</span>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Time">
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address or venue name"
              className="input"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the artist should know?"
              rows={4}
              className="input min-h-[110px] resize-none py-3"
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={submitBooking}
              disabled={loading}
              className="h-12 flex-1 rounded-full bg-[#171018] text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send request"}
            </button>

            <button
              onClick={onClose}
              className="h-12 flex-1 rounded-full border border-[#eadff5] text-sm font-medium text-[#171018]"
            >
              Cancel
            </button>
          </div>
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            height: 48px;
            border-radius: 1rem;
            border: 1px solid #eadff5;
            background: #fffafc;
            padding: 0 1rem;
            font-size: 0.875rem;
            color: #171018;
            outline: none;
          }
          .input:focus {
            border-color: #a855f7;
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
        {label}
      </span>
      {children}
    </label>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between py-1 text-[#6f6077]">
      <span>{label}</span>
      <span className="text-[#171018]">EGP {value}</span>
    </div>
  );
}