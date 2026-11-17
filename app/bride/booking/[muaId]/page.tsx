
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  UserRound,
} from "lucide-react";

type PaymentMethod = "card" | "credit_balance";

type GroupTier = {
  id: string;
  min_people: number;
  max_people: number;
  price_per_person: number;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  group_pricing_enabled: boolean;
  group_tiers: GroupTier[];
};

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

export default function BookingPage() {
  const params = useParams<{ muaId: string }>();
  const router = useRouter();
  const muaId = params.muaId;

  const [mua, setMua] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [serviceId, setServiceId] = useState("");
  const [groupSize, setGroupSize] = useState(1);

  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("card");

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] =
    useState<PromoCode | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);

  const selectedService = services.find(
    (service) => service.id === serviceId
  );

  const matchingGroupTier = useMemo(() => {
    if (!selectedService || groupSize < 2) return null;

    return (
      selectedService.group_tiers.find(
        (tier) =>
          groupSize >= tier.min_people &&
          groupSize <= tier.max_people
      ) || null
    );
  }, [selectedService, groupSize]);

  const groupPricingRequired =
    !!selectedService?.group_pricing_enabled && groupSize >= 2;

  const invalidGroupSize =
    groupPricingRequired && !matchingGroupTier;

  // Group tier prices are PER PERSON.
  // The service price used for the booking is the full group total.
  // For one person, the normal service price applies.
  const servicePrice = selectedService
    ? matchingGroupTier
      ? matchingGroupTier.price_per_person * groupSize
      : selectedService.price
    : 0;

  // All fees and payouts use the full service amount.
  const platformFee = Math.round(servicePrice * 0.1);
  const taxFee = Math.round(servicePrice * 0.01);

  const totalBeforeDiscount =
    servicePrice + platformFee + taxFee;

  const totalAfterDiscount = Math.max(
    totalBeforeDiscount - promoDiscount,
    0
  );

  const muaPayout = Math.round(servicePrice * 0.9);

  const canPayWithCredit =
    walletBalance >= totalAfterDiscount &&
    totalAfterDiscount > 0;

  const useWalletCredit =
    paymentMethod === "credit_balance";

  const walletCreditAmount = useWalletCredit
    ? totalAfterDiscount
    : 0;

  const amountDueAfterWallet = useWalletCredit
    ? 0
    : totalAfterDiscount;

  const artistName =
    `${mua?.first_name || ""} ${mua?.last_name || ""}`.trim() ||
    "Makeup artist";

  useEffect(() => {
    if (!muaId) return;

    void loadArtist();
    void loadBrideWallet();
  }, [muaId]);

  useEffect(() => {
    if (
      paymentMethod === "credit_balance" &&
      !canPayWithCredit
    ) {
      setPaymentMethod("card");
    }
  }, [paymentMethod, canPayWithCredit]);

  useEffect(() => {
    if (!appliedPromo || totalBeforeDiscount <= 0) return;

    const discount = calculatePromoDiscount(
      appliedPromo,
      totalBeforeDiscount
    );

    setPromoDiscount(discount);
    setPromoSuccess(
      `Promo ${appliedPromo.code} applied. You saved EGP ${discount.toLocaleString("en-EG")}.`
    );
  }, [appliedPromo, totalBeforeDiscount]);

  async function loadArtist() {
    setPageLoading(true);

    try {
      const { data, error } = await supabase
        .from("mua_profiles")
        .select(`
          id,
          first_name,
          last_name,
          email,
          verified,
          status,
          mua_services (
            id,
            name,
            price,
            duration_minutes,
            group_pricing_enabled,
            mua_service_group_tiers (
              id,
              min_people,
              max_people,
              price_per_person
            )
          )
        `)
        .eq("id", muaId)
        .eq("verified", true)
        .eq("status", "active")
        .single();

      if (error || !data) {
        console.error("ARTIST LOAD ERROR:", error);
        setMua(null);
        return;
      }

      const formattedServices: Service[] = (
        data.mua_services || []
      ).map((service: any) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price || 0),
        duration_minutes: Number(
          service.duration_minutes || 90
        ),
        group_pricing_enabled: !!service.group_pricing_enabled,
        group_tiers: (service.mua_service_group_tiers || [])
          .map((tier: any) => ({
            id: tier.id,
            min_people: Number(tier.min_people),
            max_people: Number(tier.max_people),
            price_per_person: Number(tier.price_per_person),
          }))
          .sort(
            (a: GroupTier, b: GroupTier) =>
              a.min_people - b.min_people
          ),
      }));

      setMua(data);
      setServices(formattedServices);

      if (formattedServices.length > 0) {
        setServiceId(formattedServices[0].id);
      }
    } catch (loadError) {
      console.error("ARTIST LOAD CRASHED:", loadError);
      setMua(null);
    } finally {
      setPageLoading(false);
    }
  }

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

      setWalletBalance(
        Number(data?.available_balance || 0)
      );
    } catch (walletError) {
      console.warn("BRIDE WALLET LOAD CRASHED:", walletError);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  }

  function calculatePromoDiscount(
    promo: PromoCode,
    baseTotal: number
  ) {
    let discount = 0;

    if (promo.discount_type === "percentage") {
      discount = Math.round(
        baseTotal * (Number(promo.discount_value) / 100)
      );
    }

    if (promo.discount_type === "fixed") {
      discount = Math.round(
        Number(promo.discount_value)
      );
    }

    return Math.min(discount, baseTotal);
  }

  function removePromo() {
    setPromoCodeInput("");
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoError(null);
    setPromoSuccess(null);
  }

  function addMinutes(date: Date, minutes: number) {
    return new Date(
      date.getTime() + minutes * 60000
    );
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
  }

  async function getMuaProfile(id: string) {
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
  }

  function getEmailServiceName() {
    if (!selectedService) return "Makeup service";

    return groupSize > 1
      ? `${selectedService.name} (${groupSize} people)`
      : selectedService.name;
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
        console.warn("MUA EMAIL NOT SENT: Missing email.");
        return;
      }

      const emailRes = await fetch(
        "/api/emails/booking-request-created",
        {
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
            serviceName: getEmailServiceName(),
            location: bookingData.location,
            totalPrice: bookingData.total_price,
          }),
        }
      );

      if (!emailRes.ok) {
        console.warn(
          "MUA BOOKING EMAIL FAILED:",
          await emailRes.text()
        );
      }
    } catch (emailError) {
      console.warn("MUA EMAIL CRASHED:", emailError);
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
        console.warn("BRIDE EMAIL NOT SENT: Missing email.");
        return;
      }

      const emailRes = await fetch(
        "/api/emails/new-booking",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brideEmail: brideProfile.email,
            brideName: getFullName(brideProfile, "beautiful"),
            muaName: getFullName(
              muaProfile,
              "your makeup artist"
            ),
            bookingDate: bookingData.booking_date,
            bookingTime: bookingData.booking_time,
            serviceName: getEmailServiceName(),
            location: bookingData.location,
            totalPrice: bookingData.total_price,
          }),
        }
      );

      if (!emailRes.ok) {
        console.warn(
          "BRIDE BOOKING EMAIL FAILED:",
          await emailRes.text()
        );
      }
    } catch (emailError) {
      console.warn("BRIDE EMAIL CRASHED:", emailError);
    }
  }

  async function applyPromoCode() {
    setPromoError(null);
    setPromoSuccess(null);

    if (!selectedService) {
      setPromoError("Please select a service first.");
      return;
    }

    if (invalidGroupSize) {
      setPromoError(
        "Please choose a valid group size first."
      );
      return;
    }

    const normalizedCode =
      promoCodeInput.trim().toUpperCase();

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

      if (
        promo.expires_at &&
        new Date(promo.expires_at) < new Date()
      ) {
        setPromoError("This promo code has expired.");
        return;
      }

      if (
        promo.max_uses !== null &&
        promo.used_count >= promo.max_uses
      ) {
        setPromoError(
          "This promo code has reached its usage limit."
        );
        return;
      }

      const discount = calculatePromoDiscount(
        promo,
        totalBeforeDiscount
      );

      if (discount <= 0) {
        setPromoError(
          "This promo code cannot be applied."
        );
        return;
      }

      setAppliedPromo(promo);
      setPromoDiscount(discount);
      setPromoSuccess(
        `Promo ${promo.code} applied. You saved EGP ${discount.toLocaleString("en-EG")}.`
      );
    } catch (promoError) {
      console.warn("PROMO APPLY CRASHED:", promoError);
      setPromoError(
        "Something went wrong while applying the promo code."
      );
    } finally {
      setPromoLoading(false);
    }
  }

  async function submitBooking() {
    if (loading) return;

    setError(null);

    if (
      !serviceId ||
      !bookingDate ||
      !bookingTime ||
      !location.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!selectedService) {
      setError("Please select a valid service.");
      return;
    }

    if (invalidGroupSize) {
      setError(
        "Please choose a group size covered by the artist's group pricing."
      );
      return;
    }

    if (
      paymentMethod === "credit_balance" &&
      !canPayWithCredit
    ) {
      setError(
        "Your credit balance is not enough. Please choose card payment."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      const startTime = new Date(
        `${bookingDate}T${bookingTime}`
      );

      const durationMinutes =
        selectedService.duration_minutes || 90;

      const endTime = addMinutes(
        startTime,
        durationMinutes
      );

      if (
        Number.isNaN(startTime.getTime()) ||
        Number.isNaN(endTime.getTime())
      ) {
        setError("Please choose a valid date and time.");
        return;
      }

      const { data: conflicts, error: conflictError } =
        await supabase.rpc(
          "check_mua_time_conflict",
          {
            p_mua_id: muaId,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
          }
        );

      if (conflictError) {
        console.warn(
          "AVAILABILITY CHECK ERROR:",
          conflictError
        );
        setError(conflictError.message);
        return;
      }

      if (conflicts && conflicts.length > 0) {
        setError(
          "Sorry, this makeup artist already has a booking or blocked time during this slot. Please choose another time."
        );
        return;
      }

      const [brideProfile, muaProfile] =
        await Promise.all([
          getBrideProfile(user.id),
          getMuaProfile(muaId),
        ]);

      const brideProfileWithFallback: BasicProfile =
        brideProfile
          ? {
              ...brideProfile,
              email:
                brideProfile.email || user.email || null,
            }
          : {
              id: user.id,
              first_name: null,
              last_name: null,
              email: user.email || null,
            };

      const { data: bookingData, error: insertError } =
        await supabase
          .from("bookings")
          .insert({
            bride_id: user.id,
            mua_id: muaId,
            service_id: serviceId,

            // Save the number of people in the booking.
            group_size: groupSize,

            booking_date: bookingDate,
            booking_time: bookingTime,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            service_duration_minutes: durationMinutes,
            location: location.trim(),
            notes: notes || null,

            // Full group service amount when group pricing applies.
            service_price: servicePrice,
            platform_fee: platformFee,
            tax_fee: taxFee,
            total_price: totalAfterDiscount,

            promo_code_id: appliedPromo?.id || null,
            discount_amount: promoDiscount,
            bride_total_before_discount: totalBeforeDiscount,
            bride_total_after_discount: totalAfterDiscount,

            // Artist payout is based on the full service amount.
            mua_payout: muaPayout,

            payment_method: paymentMethod,
            use_wallet_credit: useWalletCredit,
            wallet_credit_amount: walletCreditAmount,
            amount_due_after_wallet: amountDueAfterWallet,
            wallet_charged: false,
            wallet_charged_at: null,

            status: "pending",
          })
          .select(
            "id, booking_date, booking_time, location, total_price"
          )
          .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      const finalBookingData =
        bookingData as BookingData;

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

      setBookingComplete(true);
    } catch (bookingError) {
      console.warn(
        "BOOKING SUBMIT CRASHED:",
        bookingError
      );

      setError(
        "Something went wrong while sending the booking request."
      );
    } finally {
      setLoading(false);
    }
  }

  // LOADING
  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-6 py-24">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-5 w-32 rounded bg-[#eadff5]" />
          <div className="h-12 w-2/3 rounded bg-[#eadff5]" />
          <div className="h-64 rounded-[2rem] bg-white" />
          <div className="h-64 rounded-[2rem] bg-white" />
        </div>
      </main>
    );
  }

  // ARTIST NOT FOUND
  if (!mua) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-6 py-24 text-center text-[#171018]">
        <h1 className="text-3xl font-light">
          Artist not found
        </h1>

        <p className="mt-3 text-sm text-[#806f85]">
          This artist may no longer be available.
        </p>

        <button
          onClick={() => router.back()}
          className="mt-8 rounded-full bg-[#171018] px-7 py-3 text-sm text-white"
        >
          Go back
        </button>
      </main>
    );
  }

  // SUCCESS PAGE
  if (bookingComplete) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-5 py-20 text-[#171018]">
        <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-[#eadff5] bg-white px-7 py-14 text-center sm:px-14">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#f7efff] text-purple-700">
            <CheckCircle2 size={38} />
          </div>

          <p className="mt-7 text-xs uppercase tracking-[0.25em] text-purple-700">
            Request sent
          </p>

          <h1 className="mt-5 text-4xl font-light leading-tight tracking-[-0.06em] sm:text-5xl">
            Your glam request is on its way.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#806f85]">
            Your booking request has been sent to{" "}
            <strong>{artistName}</strong>. You'll be notified
            when the artist responds.
          </p>

          <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-[#fffafc] p-5 text-left">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#806f85]">Service</span>
              <strong>{selectedService?.name}</strong>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-[#806f85]">People</span>
              <strong>{groupSize}</strong>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-[#806f85]">Total</span>
              <strong>
                EGP {totalAfterDiscount.toLocaleString("en-EG")}
              </strong>
            </div>
          </div>

          <button
            onClick={() => router.push("/bride")}
            className="mt-9 rounded-full bg-[#171018] px-9 py-4 text-sm font-medium text-white transition hover:opacity-90"
          >
            Back to Beaura
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffafc] pb-24 text-[#171018]">
      {/* HEADER */}
      <header className="border-b border-[#eee5f1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[#806f85] transition hover:text-[#171018]"
          >
            <ArrowLeft size={17} />
            Back to artist
          </button>

          <span className="text-sm font-semibold tracking-[0.18em]">
            BEAURA
          </span>

          <span className="text-xs text-[#806f85]">
            Booking
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 lg:pt-16">
        {/* PAGE INTRO */}
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-purple-700">
            Your beauty experience starts here
          </p>

          <h1 className="mt-5 text-5xl font-light leading-[1.05] tracking-[-0.075em] sm:text-6xl lg:text-7xl">
            Let's book your
            <br />
            <span className="text-[#9876a9]">glam time.</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-[#806f85] sm:text-base">
            You're booking with{" "}
            <strong className="font-semibold text-[#171018]">
              {artistName}
            </strong>
            . Choose your service, tell us when and where,
            and send your request.
          </p>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_370px] xl:gap-14">
          <div className="min-w-0 space-y-8">

            {/* STEP 1: SERVICE */}
            <SectionCard
              number="01"
              title="Choose your service"
              description="What kind of glam are you looking for?"
              icon={<Sparkles size={20} />}
            >
              {services.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((service) => {
                    const selected =
                      service.id === serviceId;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => {
                          setServiceId(service.id);
                          setGroupSize(1);
                          removePromo();
                        }}
                        disabled={loading}
                        className={`rounded-2xl border p-5 text-left transition ${
                          selected
                            ? "border-purple-400 bg-[#f8f1fc] ring-1 ring-purple-200"
                            : "border-[#eadff5] bg-white hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {service.name}
                            </p>

                            <p className="mt-2 text-xs text-[#806f85]">
                              {service.duration_minutes} minutes
                            </p>
                          </div>

                          <span
                            className={`grid h-6 w-6 place-items-center rounded-full border ${
                              selected
                                ? "border-purple-600 bg-purple-600 text-white"
                                : "border-[#d9cadd] bg-white"
                            }`}
                          >
                            {selected && (
                              <CheckCircle2 size={15} />
                            )}
                          </span>
                        </div>

                        <div className="mt-5 flex items-end justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[#9876a9]">
                              Starting from
                            </p>
                            <p className="mt-1 text-xl font-medium">
                              EGP {service.price.toLocaleString("en-EG")}
                            </p>
                          </div>

                          {service.group_pricing_enabled && (
                            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-purple-700">
                              Group pricing
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-2xl bg-[#fffafc] p-5 text-sm text-[#806f85]">
                  This artist hasn't added any services yet.
                </p>
              )}
            </SectionCard>

            {/* STEP 2: GROUP BOOKING */}
            {selectedService?.group_pricing_enabled && (
              <SectionCard
                number="02"
                title="Who's getting glam?"
                description="Book for yourself or bring your group. For group bookings, each person pays the artist's configured price per person."
                icon={<Users size={20} />}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setGroupSize(1)}
                    disabled={loading}
                    className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                      groupSize === 1
                        ? "border-purple-400 bg-[#f8f1fc] ring-1 ring-purple-200"
                        : "border-[#eadff5] bg-white hover:border-purple-300"
                    }`}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f7efff] text-purple-700">
                      <UserRound size={20} />
                    </span>

                    <span>
                      <span className="block text-sm font-medium">
                        Just me
                      </span>
                      <span className="mt-1 block text-xs text-[#806f85]">
                        One person
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const firstTier =
                        selectedService.group_tiers[0];

                      setGroupSize(
                        firstTier
                          ? Math.max(2, firstTier.min_people)
                          : 2
                      );
                    }}
                    disabled={loading}
                    className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                      groupSize >= 2
                        ? "border-purple-400 bg-[#f8f1fc] ring-1 ring-purple-200"
                        : "border-[#eadff5] bg-white hover:border-purple-300"
                    }`}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f7efff] text-purple-700">
                      <Users size={20} />
                    </span>

                    <span>
                      <span className="block text-sm font-medium">
                        Group booking
                      </span>
                      <span className="mt-1 block text-xs text-[#806f85]">
                        Two or more people
                      </span>
                    </span>
                  </button>
                </div>

                {groupSize >= 2 && (
                  <div className="mt-7">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          How many people?
                        </p>
                        <p className="mt-1 text-xs text-[#806f85]">
                          Enter your group size below.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setGroupSize(Math.max(2, groupSize - 1))
                          }
                          disabled={loading || groupSize <= 2}
                          className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-white text-lg disabled:opacity-40"
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min={2}
                          step={1}
                          value={groupSize}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setGroupSize(
                              Math.max(
                                2,
                                Math.floor(value || 2)
                              )
                            );
                          }}
                          disabled={loading}
                          className="h-12 w-20 rounded-xl border border-[#eadff5] bg-white text-center text-lg font-semibold outline-none focus:border-purple-400"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setGroupSize(groupSize + 1)
                          }
                          disabled={loading}
                          className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-white text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="mt-7">
                      <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#9876a9]">
                        Available group prices
                      </p>

                      {selectedService.group_tiers.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedService.group_tiers.map(
                            (tier) => {
                              const isSelected =
                                groupSize >= tier.min_people &&
                                groupSize <= tier.max_people;

                              const tierGroupTotal =
                                tier.price_per_person * groupSize;

                              return (
                                <button
                                  key={tier.id}
                                  type="button"
                                  onClick={() =>
                                    setGroupSize(
                                      Math.max(
                                        2,
                                        tier.min_people
                                      )
                                    )
                                  }
                                  disabled={loading}
                                  className={`rounded-2xl border p-5 text-left transition ${
                                    isSelected
                                      ? "border-purple-400 bg-[#f8f1fc] ring-1 ring-purple-200"
                                      : "border-[#eadff5] bg-white hover:border-purple-300"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium">
                                      {tier.min_people === tier.max_people
                                        ? `${tier.min_people} people`
                                        : `${tier.min_people}–${tier.max_people} people`}
                                    </span>

                                    {isSelected && (
                                      <CheckCircle2
                                        size={18}
                                        className="text-purple-700"
                                      />
                                    )}
                                  </div>

                                  <p className="mt-4 text-2xl font-medium tracking-tight">
                                    EGP{" "}
                                    {tier.price_per_person.toLocaleString("en-EG")}
                                  </p>

                                  <p className="mt-1 text-xs text-[#806f85]">
                                    Per person
                                  </p>

                                  {isSelected && (
                                    <p className="mt-3 border-t border-purple-200 pt-3 text-sm font-medium text-purple-800">
                                      Group total for {groupSize}: EGP{" "}
                                      {tierGroupTotal.toLocaleString("en-EG")}
                                    </p>
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                          The artist has enabled group booking but
                          hasn't added group price tiers yet.
                        </p>
                      )}
                    </div>

                    {invalidGroupSize && (
                      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-700">
                          No group price for {groupSize} people.
                        </p>
                        <p className="mt-1 text-xs leading-5 text-red-600">
                          Please choose a group size within one
                          of the available price ranges.
                        </p>
                      </div>
                    )}

                    {matchingGroupTier && (
                      <div className="mt-5 rounded-2xl bg-[#f7efff] p-5">
                        <p className="text-xs uppercase tracking-[0.15em] text-purple-700">
                          Your selected group price
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-[#806f85]">
                              Price per person
                            </p>
                            <p className="mt-1 text-xl font-semibold">
                              EGP{" "}
                              {matchingGroupTier.price_per_person.toLocaleString("en-EG")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-[#806f85]">
                              Total for {groupSize} people
                            </p>
                            <p className="mt-1 text-3xl font-semibold tracking-tight">
                              EGP {servicePrice.toLocaleString("en-EG")}
                            </p>
                          </div>
                        </div>

                        <span className="mt-4 inline-block rounded-full bg-white px-3 py-2 text-xs font-medium text-purple-700">
                          {matchingGroupTier.price_per_person.toLocaleString("en-EG")} × {groupSize} people
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            )}

            {/* STEP 3: DATE AND LOCATION */}
            <SectionCard
              number={selectedService?.group_pricing_enabled ? "03" : "02"}
              title="When and where?"
              description="Tell the artist when and where you need your makeup done."
              icon={<CalendarDays size={20} />}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Booking date">
                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9876a9]"
                    />
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toLocaleDateString("en-CA")}
                      onChange={(e) =>
                        setBookingDate(e.target.value)
                      }
                      disabled={loading}
                      className="booking-input pl-11"
                    />
                  </div>
                </Field>

                <Field label="Preferred time">
                  <div className="relative">
                    <Clock
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9876a9]"
                    />
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) =>
                        setBookingTime(e.target.value)
                      }
                      disabled={loading}
                      className="booking-input pl-11"
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Location or venue address">
                  <div className="relative">
                    <MapPin
                      size={17}
                      className="pointer-events-none absolute left-4 top-4 text-[#9876a9]"
                    />
                    <input
                      value={location}
                      onChange={(e) =>
                        setLocation(e.target.value)
                      }
                      placeholder="Enter your address or venue name"
                      disabled={loading}
                      className="booking-input pl-11"
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Additional notes (optional)">
                  <textarea
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value)
                    }
                    placeholder="Share any details the artist should know..."
                    rows={4}
                    disabled={loading}
                    className="booking-input min-h-[120px] resize-none py-4"
                  />
                </Field>
              </div>
            </SectionCard>

            {/* STEP 4: PROMO CODE */}
            {selectedService && (
              <SectionCard
                number={selectedService.group_pricing_enabled ? "04" : "03"}
                title="A little something extra?"
                description="Have a promo code? Apply it here."
                icon={<Sparkles size={20} />}
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(
                        e.target.value.toUpperCase()
                      );
                      setPromoError(null);
                      setPromoSuccess(null);
                    }}
                    placeholder="Enter promo code"
                    disabled={!!appliedPromo || loading}
                    className="booking-input flex-1"
                  />

                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={removePromo}
                      disabled={loading}
                      className="rounded-full border border-[#eadff5] px-7 py-3 text-sm transition hover:bg-[#fffafc]"
                    >
                      Remove code
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyPromoCode}
                      disabled={
                        promoLoading ||
                        loading ||
                        invalidGroupSize
                      }
                      className="rounded-full bg-[#171018] px-8 py-3 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {promoLoading ? "Checking..." : "Apply code"}
                    </button>
                  )}
                </div>

                {promoError && (
                  <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                    {promoError}
                  </p>
                )}

                {promoSuccess && (
                  <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                    {promoSuccess}
                  </p>
                )}
              </SectionCard>
            )}

            {/* STEP 5: PAYMENT */}
            {selectedService && (
              <SectionCard
                number={selectedService.group_pricing_enabled ? "05" : "04"}
                title="Payment preference"
                description="Choose how you would prefer to pay."
                icon={<ShieldCheck size={20} />}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <PaymentOption
                    title="Credit balance"
                    description={
                      walletLoading
                        ? "Loading your balance..."
                        : `Available balance: EGP ${walletBalance.toLocaleString("en-EG")}`
                    }
                    selected={
                      paymentMethod === "credit_balance"
                    }
                    disabled={
                      !canPayWithCredit || loading
                    }
                    onClick={() =>
                      setPaymentMethod("credit_balance")
                    }
                  />

                  <PaymentOption
                    title="Card"
                    description="Pay securely by card after the artist confirms your booking."
                    selected={paymentMethod === "card"}
                    disabled={loading}
                    onClick={() =>
                      setPaymentMethod("card")
                    }
                  />
                </div>

                {paymentMethod === "credit_balance" &&
                  !canPayWithCredit && (
                    <p className="mt-4 text-sm text-red-600">
                      Your available balance isn't enough for
                      this booking.
                    </p>
                  )}

                <p className="mt-5 text-xs leading-6 text-[#806f85]">
                  Your booking request is sent to the artist for
                  confirmation. Payment is not taken when you
                  submit this request.
                </p>
              </SectionCard>
            )}
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <aside className="lg:sticky lg:top-8">
            <div className="overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white shadow-sm">
              <div className="bg-[#f7efff] px-7 py-7">
                <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                  Your booking
                </p>

                <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">
                  Booking summary
                </h2>

                <p className="mt-2 text-sm text-[#806f85]">
                  A little overview before you send your request.
                </p>
              </div>

              <div className="space-y-6 p-7">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9876a9]">
                    Makeup artist
                  </p>
                  <p className="mt-2 text-lg font-medium">
                    {artistName}
                  </p>
                </div>

                <div className="h-px bg-[#eee5f1]" />

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9876a9]">
                    Selected service
                  </p>

                  <p className="mt-2 font-medium">
                    {selectedService?.name || "Choose a service"}
                  </p>

                  {selectedService && (
                    <p className="mt-1 text-xs text-[#806f85]">
                      {selectedService.duration_minutes} minutes
                    </p>
                  )}
                </div>

                {selectedService?.group_pricing_enabled && (
                  <>
                    <div className="h-px bg-[#eee5f1]" />

                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#9876a9]">
                        Group size
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <Users
                          size={17}
                          className="text-purple-700"
                        />
                        <p className="font-medium">
                          {groupSize}{" "}
                          {groupSize === 1 ? "person" : "people"}
                        </p>
                      </div>

                      {groupSize > 1 && matchingGroupTier && (
                        <div className="mt-2 space-y-1 text-xs text-[#806f85]">
                          <p>
                            EGP{" "}
                            {matchingGroupTier.price_per_person.toLocaleString("en-EG")}{" "}
                            per person
                          </p>
                          <p>
                            Group service total: EGP{" "}
                            {servicePrice.toLocaleString("en-EG")}
                          </p>
                        </div>
                      )}

                      {groupSize > 1 && invalidGroupSize && (
                        <p className="mt-2 text-xs text-red-600">
                          No price available for this group size.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="h-px bg-[#eee5f1]" />

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-[#9876a9]">
                    Appointment details
                  </p>

                  <SummaryDetail
                    icon={<CalendarDays size={16} />}
                    value={bookingDate || "Date not selected"}
                  />

                  <SummaryDetail
                    icon={<Clock size={16} />}
                    value={bookingTime || "Time not selected"}
                  />

                  <SummaryDetail
                    icon={<MapPin size={16} />}
                    value={location || "Location not entered"}
                  />
                </div>

                <div className="h-px bg-[#eee5f1]" />

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-[#9876a9]">
                    Price breakdown
                  </p>

                  <PriceRow
                    label={
                      matchingGroupTier
                        ? "Group service total"
                        : "Service price"
                    }
                    value={servicePrice}
                  />

                  <PriceRow
                    label="Platform fee"
                    value={platformFee}
                  />

                  <PriceRow
                    label="Tax"
                    value={taxFee}
                  />

                  {promoDiscount > 0 && (
                    <PriceRow
                      label="Promo discount"
                      value={-promoDiscount}
                    />
                  )}

                  <div className="border-t border-[#eadff5] pt-4">
                    <div className="flex items-end justify-between gap-3">
                      <span className="text-sm font-medium">
                        Total
                      </span>

                      <span className="text-2xl font-semibold tracking-tight">
                        EGP {totalAfterDiscount.toLocaleString("en-EG")}
                      </span>
                    </div>

                    {promoDiscount > 0 && (
                      <p className="mt-2 text-xs leading-5 text-[#806f85]">
                        The promo discount does not affect the
                        artist's payout.
                      </p>
                    )}
                  </div>
                </div>

                {selectedService && (
                  <div className="rounded-2xl bg-[#fffafc] p-5">
                    <p className="text-xs text-[#806f85]">
                      {paymentMethod === "credit_balance"
                        ? "Credit balance payment"
                        : "Amount due by card"}
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      EGP{" "}
                      {(paymentMethod === "credit_balance"
                        ? walletCreditAmount
                        : amountDueAfterWallet
                      ).toLocaleString("en-EG")}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitBooking}
                  disabled={
                    loading ||
                    !selectedService ||
                    invalidGroupSize ||
                    services.length === 0
                  }
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#171018] px-6 text-sm font-medium text-white transition hover:bg-[#4a3553] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Sending request..."
                    : "Send booking request"}

                  {!loading && <ChevronRight size={17} />}
                </button>

                <div className="flex items-start gap-2 text-xs leading-5 text-[#806f85]">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0"
                  />
                  <p>
                    Your request goes to the artist for
                    confirmation. No payment is taken at this
                    stage.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* INPUT STYLES */}
      <style jsx global>{`
        .booking-input {
          width: 100%;
          min-height: 52px;
          border: 1px solid #eadff5;
          border-radius: 14px;
          background: #ffffff;
          padding: 13px 16px;
          color: #171018;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .booking-input::placeholder {
          color: #b1a4b8;
        }

        .booking-input:focus {
          border-color: #a77bbd;
          box-shadow: 0 0 0 3px rgba(167, 123, 189, 0.12);
        }

        .booking-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}

// REUSABLE SECTION
function SectionCard({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-[0_8px_35px_rgba(60,35,70,0.025)] sm:p-8 lg:p-9">
      <div className="mb-7 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f7efff] text-purple-700">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9876a9]">
            Step {number}
          </p>

          <h2 className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#806f85]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

// REUSABLE FIELD
function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.13em] text-[#806f85]">
        {label}
      </span>
      {children}
    </label>
  );
}

// PRICE ROW
function PriceRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const isNegative = value < 0;

  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[#806f85]">{label}</span>

      <span
        className={
          isNegative
            ? "font-medium text-green-700"
            : "font-medium text-[#171018]"
        }
      >
        {isNegative ? "- " : ""}
        EGP {Math.abs(value).toLocaleString("en-EG")}
      </span>
    </div>
  );
}

// PAYMENT OPTION
function PaymentOption({
  title,
  description,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-purple-400 bg-[#f8f1fc] ring-1 ring-purple-200"
          : "border-[#eadff5] bg-white hover:border-purple-300"
      }`}
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-2 text-xs leading-5 text-[#806f85]">
          {description}
        </p>
      </div>

      <span
        className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
          selected
            ? "border-purple-700 bg-purple-700"
            : "border-[#d9cadd] bg-white"
        }`}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full bg-white" />
        )}
      </span>
    </button>
  );
}

// SUMMARY DETAIL
function SummaryDetail({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-[#9876a9]">{icon}</span>
      <span className="break-words text-[#806f85]">
        {value}
      </span>
    </div>
  );
}
