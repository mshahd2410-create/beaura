"use client";

import { useEffect, useState, type ReactNode } from "react";
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

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

type BasicProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type BookingData = {
  id: string;
  booking_date: string | null;
  booking_time: string | null;
  location: string | null;
  total_price: number | null;
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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [walletBalance, setWalletBalance] = useState(0);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === serviceId);

  const servicePrice = selectedService?.price ?? 0;
  const platformFee = Math.round(servicePrice * 0.1);
  const taxFee = Math.round(servicePrice * 0.01);

  const totalBeforeDiscount = servicePrice + platformFee + taxFee;
  const totalAfterDiscount = Math.max(totalBeforeDiscount - promoDiscount, 0);
  const muaPayout = Math.round(servicePrice * 0.9);

  const canPayWithCredit =
    walletBalance >= totalAfterDiscount && totalAfterDiscount > 0;

  const useWalletCredit = paymentMethod === "credit_balance";
  const walletCreditAmount = useWalletCredit ? totalAfterDiscount : 0;
  const amountDueAfterWallet = useWalletCredit ? 0 : totalAfterDiscount;

  useEffect(() => {
    if (!open) return;
    loadBrideWallet();
  }, [open]);

  useEffect(() => {
    if (!selectedService) {
      setPaymentMethod("card");
      removePromo();
      return;
    }

    if (paymentMethod === "credit_balance" && !canPayWithCredit) {
      setPaymentMethod("card");
    }
  }, [
    selectedService,
    totalAfterDiscount,
    walletBalance,
    paymentMethod,
    canPayWithCredit,
  ]);

  useEffect(() => {
    if (!appliedPromo || totalBeforeDiscount <= 0) return;

    const newDiscount = calculatePromoDiscount(
      appliedPromo,
      totalBeforeDiscount
    );

    setPromoDiscount(newDiscount);
  }, [appliedPromo, totalBeforeDiscount]);

  if (!open) return null;

  async function loadBrideWallet() {
    setWalletLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("wallets")
        .select("available_balance")
        .eq("user_id", user.id)
        .eq("user_type", "bride")
        .maybeSingle();

      if (error) {
        console.warn("BRIDE WALLET LOAD ERROR:", error);
        setWalletBalance(0);
        return;
      }

      setWalletBalance(Number(data?.available_balance || 0));
    } catch (walletError) {
      console.warn("BRIDE WALLET LOAD CRASHED:", walletError);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  }

  function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function calculatePromoDiscount(promo: PromoCode, baseTotal: number) {
    let discount = 0;

    if (promo.discount_type === "percentage") {
      discount = Math.round(baseTotal * (Number(promo.discount_value) / 100));
    }

    if (promo.discount_type === "fixed") {
      discount = Math.round(Number(promo.discount_value));
    }

    return Math.min(discount, baseTotal);
  }

  function getFullName(
    profile: BasicProfile | null | undefined,
    fallback: string
  ) {
    const name = `${profile?.first_name || ""} ${
      profile?.last_name || ""
    }`.trim();

    return name || fallback;
  }

  async function getBrideProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("bride_profiles")
        .select("id, first_name, last_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("BRIDE PROFILE EMAIL LOAD ERROR:", error);
        return null;
      }

      return data as BasicProfile | null;
    } catch (profileError) {
      console.warn("BRIDE PROFILE EMAIL LOAD CRASHED:", profileError);
      return null;
    }
  }

  async function getMuaProfile(id: string) {
    try {
      const { data, error } = await supabase
        .from("mua_profiles")
        .select("id, first_name, last_name, email")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.warn("MUA PROFILE EMAIL LOAD ERROR:", error);
        return null;
      }

      return data as BasicProfile | null;
    } catch (profileError) {
      console.warn("MUA PROFILE EMAIL LOAD CRASHED:", profileError);
      return null;
    }
  }

  async function sendNewBookingEmailToMua({
    muaProfile,
    brideProfile,
    bookingData,
  }: {
    muaProfile: BasicProfile | null;
    brideProfile: BasicProfile | null;
    bookingData: BookingData;
  }) {
    try {
      if (!muaProfile?.email) {
        console.warn(
          "MUA EMAIL NOT SENT: MUA email is missing. Make sure mua_profiles.email is filled."
        );
        return;
      }

      console.log("CALLING MUA EMAIL API...");

      const emailRes = await fetch("/api/emails/booking-request-created", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          muaEmail: muaProfile.email,
          muaName: getFullName(muaProfile, "artist"),
          brideName: getFullName(brideProfile, "A bride"),
          bookingDate: bookingData.booking_date,
          bookingTime: bookingData.booking_time,
          serviceName: selectedService?.name || "Makeup service",
          location: bookingData.location,
          totalPrice: bookingData.total_price,
        }),
      });

      const rawText = await emailRes.text();

      let emailResult: unknown = rawText;

      try {
        emailResult = JSON.parse(rawText);
      } catch {
        // Keep raw text if response is not JSON.
      }

      console.log("MUA EMAIL STATUS:", emailRes.status);
      console.log("MUA EMAIL RESPONSE:", emailResult);

      if (!emailRes.ok) {
        console.warn("MUA EMAIL FAILED. STATUS:", emailRes.status);
        console.warn("MUA EMAIL FAILED. RESPONSE:", emailResult);
      }
    } catch (emailError) {
      console.warn("MUA NEW BOOKING EMAIL CRASHED:", emailError);
    }
  }

  async function sendBookingRequestEmailToBride({
    muaProfile,
    brideProfile,
    bookingData,
  }: {
    muaProfile: BasicProfile | null;
    brideProfile: BasicProfile | null;
    bookingData: BookingData;
  }) {
    try {
      if (!brideProfile?.email) {
        console.warn(
          "BRIDE EMAIL NOT SENT: Bride email is missing. Bride profile email and auth user email were both empty."
        );
        return;
      }

      console.log("CALLING BRIDE EMAIL API...");

      const emailRes = await fetch("/api/emails/new-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brideEmail: brideProfile.email,
          brideName: getFullName(brideProfile, "beautiful"),
          muaName: getFullName(muaProfile, "your makeup artist"),
          bookingDate: bookingData.booking_date,
          bookingTime: bookingData.booking_time,
          serviceName: selectedService?.name || "Makeup service",
          location: bookingData.location,
          totalPrice: bookingData.total_price,
        }),
      });

      const rawText = await emailRes.text();

      let emailResult: unknown = rawText;

      try {
        emailResult = JSON.parse(rawText);
      } catch {
        // Keep raw text if response is not JSON.
      }

      console.log("BRIDE EMAIL STATUS:", emailRes.status);
      console.log("BRIDE EMAIL RESPONSE:", emailResult);

      if (!emailRes.ok) {
        console.warn("BRIDE EMAIL FAILED. STATUS:", emailRes.status);
        console.warn("BRIDE EMAIL FAILED. RESPONSE:", emailResult);
      }
    } catch (emailError) {
      console.warn("BRIDE BOOKING REQUEST EMAIL CRASHED:", emailError);
    }
  }

  async function applyPromoCode() {
    setPromoError(null);
    setPromoSuccess(null);

    if (!selectedService) {
      setPromoError("Please select a service before applying a promo code.");
      return;
    }

    const normalizedCode = promoCodeInput.trim().toUpperCase();

    if (!normalizedCode) {
      setPromoError("Please enter a promo code.");
      return;
    }

    setPromoLoading(true);

    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (error) {
        setPromoError(error.message);
        return;
      }

      if (!data) {
        setPromoError("This promo code does not exist.");
        return;
      }

      const promo = data as PromoCode;

      if (!promo.is_active) {
        setPromoError("This promo code is not active.");
        return;
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        setPromoError("This promo code has expired.");
        return;
      }

      if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
        setPromoError("This promo code has reached its usage limit.");
        return;
      }

      const discount = calculatePromoDiscount(promo, totalBeforeDiscount);

      if (discount <= 0) {
        setPromoError("This promo code cannot be applied to this booking.");
        return;
      }

      setAppliedPromo(promo);
      setPromoDiscount(discount);
      setPromoSuccess(
        `Promo ${promo.code} applied. You saved EGP ${discount.toLocaleString()}.`
      );
    } catch (promoApplyError) {
      console.warn("PROMO APPLY CRASHED:", promoApplyError);
      setPromoError("Something went wrong while applying the promo code.");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setPromoCodeInput("");
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoError(null);
    setPromoSuccess(null);
  }

  async function submitBooking() {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      const startTime = new Date(`${bookingDate}T${bookingTime}`);
      const durationMinutes = selectedService.duration_minutes || 90;
      const endTime = addMinutes(startTime, durationMinutes);

      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
        setError("Please choose a valid date and time.");
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
        console.warn("AVAILABILITY CHECK ERROR:", conflictError);
        setError(conflictError.message);
        return;
      }

      if (conflicts && conflicts.length > 0) {
        setError(
          "Sorry, this makeup artist already has a booking or blocked time during this slot. Please choose another time."
        );
        return;
      }

      const [brideProfile, muaProfile] = await Promise.all([
        getBrideProfile(user.id),
        getMuaProfile(muaId),
      ]);

      const brideProfileWithFallback: BasicProfile = brideProfile
        ? {
            ...brideProfile,
            email: brideProfile.email || user.email || null,
          }
        : {
            id: user.id,
            first_name: null,
            last_name: null,
            email: user.email || null,
          };

      console.log("BRIDE PROFILE FOR EMAIL:", brideProfileWithFallback);
      console.log("MUA PROFILE FOR EMAIL:", muaProfile);
      console.log("BRIDE EMAIL VALUE:", brideProfileWithFallback.email);
      console.log("MUA EMAIL VALUE:", muaProfile?.email);

      const { data: bookingData, error: insertError } = await supabase
        .from("bookings")
        .insert({
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

          total_price: totalAfterDiscount,

          promo_code_id: appliedPromo?.id || null,
          discount_amount: promoDiscount,
          bride_total_before_discount: totalBeforeDiscount,
          bride_total_after_discount: totalAfterDiscount,

          mua_payout: muaPayout,

          payment_method: paymentMethod,

          use_wallet_credit: useWalletCredit,
          wallet_credit_amount: walletCreditAmount,
          amount_due_after_wallet: amountDueAfterWallet,
          wallet_charged: false,
          wallet_charged_at: null,

          status: "pending",
        })
        .select("id, booking_date, booking_time, location, total_price")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      const finalBookingData = bookingData as BookingData;

      console.log("BOOKING CREATED:", finalBookingData);
      console.log("BOOKING CREATED — starting email calls");

      await sendNewBookingEmailToMua({
        muaProfile,
        brideProfile: brideProfileWithFallback,
        bookingData: finalBookingData,
      });

      await sendBookingRequestEmailToBride({
        muaProfile,
        brideProfile: brideProfileWithFallback,
        bookingData: finalBookingData,
      });

      resetForm();
      onClose();
    } catch (bookingError) {
      console.warn("BOOKING SUBMIT CRASHED:", bookingError);
      setError("Something went wrong while sending the booking request.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setServiceId("");
    setBookingDate("");
    setBookingTime("");
    setLocation("");
    setNotes("");
    setPaymentMethod("card");
    removePromo();
    setError(null);
  }

  function handleClose() {
    if (loading) return;
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
              disabled={loading}
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

              {promoDiscount > 0 && (
                <PriceRow label="Promo discount" value={-promoDiscount} />
              )}

              <div className="mt-3 flex justify-between border-t border-[#eadff5] pt-3 font-semibold text-[#171018]">
                <span>Total</span>
                <span>EGP {totalAfterDiscount.toLocaleString()}</span>
              </div>

              {promoDiscount > 0 && (
                <p className="mt-2 text-xs leading-5 text-[#6f6077]">
                  Original total: EGP {totalBeforeDiscount.toLocaleString()}.
                  MUA payout is not affected by this discount.
                </p>
              )}
            </div>
          )}

          {selectedService && (
            <div className="rounded-[1.5rem] border border-[#eadff5] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
                Promo code
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value.toUpperCase());
                    setPromoError(null);
                    setPromoSuccess(null);
                  }}
                  placeholder="BEAURA10"
                  disabled={!!appliedPromo || loading}
                  className="input flex-1"
                />

                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={removePromo}
                    disabled={loading}
                    className="h-12 rounded-full border border-[#eadff5] px-4 text-sm font-medium text-[#171018] disabled:opacity-60"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyPromoCode}
                    disabled={promoLoading || loading}
                    className="h-12 rounded-full bg-[#171018] px-5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {promoLoading ? "Checking..." : "Apply"}
                  </button>
                )}
              </div>

              {promoError && (
                <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs leading-5 text-red-600">
                  {promoError}
                </p>
              )}

              {promoSuccess && (
                <p className="mt-3 rounded-2xl bg-green-50 p-3 text-xs leading-5 text-green-700">
                  {promoSuccess}
                </p>
              )}
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
                  disabled={!canPayWithCredit || loading}
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
                  disabled={loading}
                  className={`rounded-[1.3rem] border p-4 text-left transition disabled:opacity-60 ${
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
                      : totalAfterDiscount
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
                disabled={loading}
              />
            </Field>

            <Field label="Time">
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="input"
                disabled={loading}
              />
            </Field>
          </div>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address or venue name"
              className="input"
              disabled={loading}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the artist should know?"
              rows={4}
              className="input min-h-[110px] resize-none py-3"
              disabled={loading}
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
              disabled={loading}
              className="h-12 flex-1 rounded-full border border-[#eadff5] text-sm font-medium text-[#171018] disabled:opacity-60"
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

          .input:disabled {
            opacity: 0.65;
            cursor: not-allowed;
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
  children: ReactNode;
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
  const isNegative = value < 0;

  return (
    <div className="flex justify-between py-1 text-[#6f6077]">
      <span>{label}</span>
      <span className={isNegative ? "text-green-700" : "text-[#171018]"}>
        {isNegative ? "- " : ""}
        EGP {Math.abs(Number(value || 0)).toLocaleString()}
      </span>
    </div>
  );
}