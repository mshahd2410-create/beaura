"use client";

import { useEffect, useState } from "react";
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

type PaymentMethod = "card" | "credit_balance";

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [walletBalance, setWalletBalance] = useState(0);

  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === serviceId);
  const servicePrice = selectedService?.price ?? 0;
  const platformFee = Math.round(servicePrice * 0.1);
  const taxFee = Math.round(servicePrice * 0.01);
  const totalPrice = servicePrice + platformFee + taxFee;

  const canPayWithCredit = walletBalance >= totalPrice && totalPrice > 0;

  const useWalletCredit = paymentMethod === "credit_balance";
  const walletCreditAmount = useWalletCredit ? totalPrice : 0;
  const amountDueAfterWallet = useWalletCredit ? 0 : totalPrice;

  useEffect(() => {
    if (!open) return;
    loadBrideWallet();
  }, [open]);

  useEffect(() => {
    if (!selectedService) {
      setPaymentMethod("card");
      return;
    }

    if (paymentMethod === "credit_balance" && !canPayWithCredit) {
      setPaymentMethod("card");
    }
  }, [selectedService, totalPrice, walletBalance]);

  if (!open) return null;

  async function loadBrideWallet() {
    setWalletLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setWalletLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("wallets")
      .select("available_balance")
      .eq("user_id", user.id)
      .eq("user_type", "bride")
      .maybeSingle();

    if (error) {
      console.error("BRIDE WALLET LOAD ERROR:", error);
      setWalletBalance(0);
      setWalletLoading(false);
      return;
    }

    setWalletBalance(Number(data?.available_balance || 0));
    setWalletLoading(false);
  }

  function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60000);
  }

  async function submitBooking() {
    setError(null);

    if (!serviceId || !bookingDate || !bookingTime || !location) {
      setError("Please fill all required fields.");
      return;
    }

    if (!selectedService) {
      setError("Please select a valid service.");
      return;
    }

    if (paymentMethod === "credit_balance" && !canPayWithCredit) {
      setError(
        "Your credit balance is not enough for this booking. Please choose card payment."
      );
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

    const startTime = new Date(`${bookingDate}T${bookingTime}`);
    const durationMinutes = selectedService.duration_minutes || 90;
    const endTime = addMinutes(startTime, durationMinutes);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      setError("Please choose a valid date and time.");
      setLoading(false);
      return;
    }

    const { data: conflicts, error: conflictError } = await supabase.rpc(
      "check_mua_time_conflict",
      {
        p_mua_id: muaId,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
      }
    );

    if (conflictError) {
      console.error("AVAILABILITY CHECK ERROR:", conflictError);
      setError(conflictError.message);
      setLoading(false);
      return;
    }

    if (conflicts && conflicts.length > 0) {
      setError(
        "Sorry, this makeup artist already has a booking or blocked time during this slot. Please choose another time."
      );
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      bride_id: user.id,
      mua_id: muaId,
      service_id: serviceId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      service_duration_minutes: durationMinutes,
      location,
      notes: notes || null,

      service_price: servicePrice,
      platform_fee: platformFee,
      tax_fee: taxFee,
      total_price: totalPrice,

      payment_method: paymentMethod,

      use_wallet_credit: useWalletCredit,
      wallet_credit_amount: walletCreditAmount,
      amount_due_after_wallet: amountDueAfterWallet,
      wallet_charged: false,
      wallet_charged_at: null,

      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    resetForm();
    onClose();
  }

  function resetForm() {
    setServiceId("");
    setBookingDate("");
    setBookingTime("");
    setLocation("");
    setNotes("");
    setPaymentMethod("card");
    setError(null);
  }

  function handleClose() {
    resetForm();
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
          Send your date, time, location, and payment preference. The artist will
          confirm or decline before payment is taken.
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

              <div className="mt-3 flex justify-between border-t border-[#eadff5] pt-3 font-semibold text-[#171018]">
                <span>Total</span>
                <span>EGP {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {selectedService && (
            <div className="rounded-[1.5rem] border border-[#eadff5] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
                Payment method
              </p>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit_balance")}
                  disabled={!canPayWithCredit}
                  className={`rounded-[1.3rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    paymentMethod === "credit_balance"
                      ? "border-purple-400 bg-[#f7efff]"
                      : "border-[#eadff5] bg-[#fffafc] hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#171018]">
                        Credit balance
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6f6077]">
                        Available:{" "}
                        {walletLoading
                          ? "Loading..."
                          : `EGP ${walletBalance.toLocaleString()}`}
                      </p>

                      {!canPayWithCredit && (
                        <p className="mt-1 text-xs leading-5 text-red-600">
                          Not enough credit for this booking.
                        </p>
                      )}

                      {canPayWithCredit && (
                        <p className="mt-1 text-xs leading-5 text-[#8a7d91]">
                          Credit will be deducted only if the MUA confirms.
                        </p>
                      )}
                    </div>

                    <span
                      className={`mt-1 h-4 w-4 rounded-full border ${
                        paymentMethod === "credit_balance"
                          ? "border-purple-700 bg-purple-600"
                          : "border-[#cfc3d8] bg-white"
                      }`}
                    />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`rounded-[1.3rem] border p-4 text-left transition ${
                    paymentMethod === "card"
                      ? "border-purple-400 bg-[#f7efff]"
                      : "border-[#eadff5] bg-[#fffafc] hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#171018]">
                        Card
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6f6077]">
                        Pay securely by card after the MUA confirms your booking.
                      </p>
                    </div>

                    <span
                      className={`mt-1 h-4 w-4 rounded-full border ${
                        paymentMethod === "card"
                          ? "border-purple-700 bg-purple-600"
                          : "border-[#cfc3d8] bg-white"
                      }`}
                    />
                  </div>
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
                <PriceRow
                  label={
                    paymentMethod === "credit_balance"
                      ? "Credit balance payment"
                      : "Card payment"
                  }
                  value={
                    paymentMethod === "credit_balance"
                      ? walletCreditAmount
                      : totalPrice
                  }
                />

                <div className="mt-2 flex justify-between border-t border-[#eadff5] pt-2 text-sm font-semibold text-[#171018]">
                  <span>Amount due by card</span>
                  <span>EGP {amountDueAfterWallet.toLocaleString()}</span>
                </div>
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

          {error && (
            <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={submitBooking}
              disabled={loading}
              className="h-12 flex-1 rounded-full bg-[#171018] text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send request"}
            </button>

            <button
              onClick={handleClose}
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

          textarea.input {
            height: auto;
          }

          .input:focus {
            border-color: #a855f7;
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
      <span className="text-[#171018]">
        EGP {Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}