"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  Sparkles,
  Clock3,
  ArrowRight,
  Star,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import SupportHelpButton from "@/components/support/SupportHelpButton";

type Booking = {
  id: string;
  bride_id: string;
  event_date: string | null;
  status: string | null;
  total_amount?: number | null;
  total_price?: number | null;
  service_price?: number | null;
  platform_fee?: number | null;
  created_at?: string | null;
  bride_profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

type MuaProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  instagram: string | null;
  experience: string | null;
  experience_years: number | null;
  cities: string[] | null;
  verified: boolean | null;
  beaura_tier: string | null;
};

type MuaService = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
};

type MuaWallet = {
  id: string;
  user_id: string;
  user_type: string;
  available_balance: number;
  pending_balance: number;
  frozen_balance: number;
  total_earned: number;
  total_withdrawn: number;
  updated_at: string | null;
};

export default function MuaDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [muaName, setMuaName] = useState("beautiful");
  const [profile, setProfile] = useState<MuaProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<MuaService[]>([]);
  const [profilePhone, setProfilePhone] = useState("");
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [acceptedLocations, setAcceptedLocations] = useState<string[]>([]);
  const [walletData, setWalletData] = useState<MuaWallet | null>(null);

  useEffect(() => {
    loadDashboard();

    const channel = supabase
      .channel("mua-dashboard-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mua_services" },
        () => {
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mua_profiles" },
        () => {
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mua_portfolio" },
        () => loadDashboard()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mua_service_locations" },
        () => loadDashboard()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mua_private" },
        () => loadDashboard()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets" },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [
      { data: profileData },
      { data: bookingsData },
      { data: servicesData },
      { data: wallet },
      { data: privateData },
      { count: portfolioRows },
      { data: locationRows },
    ] = await Promise.all([
      supabase
        .from("mua_profiles")
        .select(
          "id, first_name, last_name, bio, instagram, experience, experience_years, cities, verified, beaura_tier"
        )
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("bookings")
        .select(
          `
          id,
          event_date,
          status,
          total_amount,
          total_price,
          service_price,
          platform_fee,
          created_at,
          bride_id
        `
        )
        .eq("mua_id", user.id)
        .order("event_date", { ascending: true }),

      supabase
        .from("mua_services")
        .select("id, name, price, duration_minutes")
        .eq("mua_id", user.id),

      supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_type", "mua")
        .maybeSingle(),

      supabase
        .from("mua_private")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("mua_portfolio")
        .select("id", { count: "exact", head: true })
        .eq("mua_id", user.id),

      supabase
        .from("mua_service_locations")
        .select("location_type")
        .eq("mua_id", user.id)
        .eq("is_accepted", true),
    ]);

    const bookingRows = (bookingsData || []) as Booking[];
    const brideIds = [...new Set(bookingRows.map((booking) => booking.bride_id).filter(Boolean))];
    const { data: brideNames, error: brideNamesError } = brideIds.length
      ? await supabase.rpc("get_mua_client_names", { p_bride_ids: brideIds })
      : { data: [], error: null };

    if (brideNamesError) {
      console.error("Could not load booking client names:", brideNamesError);
    }

    const bookingsWithNames = bookingRows.map((booking) => {
      const bride = brideNames?.find((item: any) => item.bride_id === booking.bride_id);
      return {
        ...booking,
        bride_profiles: bride
          ? { first_name: bride.first_name, last_name: bride.last_name }
          : null,
      };
    });

    setProfile((profileData as MuaProfile) || null);
    setBookings(bookingsWithNames);
    setServices((servicesData as MuaService[]) || []);
    setWalletData((wallet as MuaWallet) || null);
    setProfilePhone(privateData?.phone || "");
    setPortfolioCount(portfolioRows || 0);
    setAcceptedLocations((locationRows || []).map((row: { location_type: string }) => row.location_type));

    if (profileData?.first_name) {
      setMuaName(profileData.first_name);
    }

    setLoading(false);
  }

  const upcomingBookings = useMemo(() => {
    const now = new Date();

    return bookings.filter((booking) => {
      if (!booking.event_date) return false;
      return (
        new Date(booking.event_date) >= now && booking.status !== "cancelled"
      );
    });
  }, [bookings]);

  const pendingBookings = useMemo(() => {
    return bookings.filter((booking) => booking.status === "pending");
  }, [bookings]);

  const confirmedBookings = useMemo(() => {
    return bookings.filter((booking) => booking.status === "confirmed");
  }, [bookings]);

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return bookings
      .filter((booking) => {
        if (booking.status !== "confirmed") return false;
        if (!booking.event_date) return false;

        const eventDate = new Date(booking.event_date);
        return (
          eventDate.getMonth() === currentMonth &&
          eventDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, booking) => {
        const servicePrice = Number(
          booking.service_price || booking.total_amount || booking.total_price || 0
        );
        const platformFee = Number(booking.platform_fee || 0);

        return sum + Math.max(servicePrice - platformFee, 0);
      }, 0);
  }, [bookings]);

  const popularService = useMemo(() => {
    if (!services.length) return "—";
    return services[0]?.name || "—";
  }, [services]);

  const nextBooking = useMemo(() => {
    return upcomingBookings[0] || null;
  }, [upcomingBookings]);

  const profileTasks = useMemo(() => {
    const completeServices = services.some(
      (service) => Number(service.price) > 0 && Number(service.duration_minutes) > 0
    );

    return [
      { label: "Complete your basic details", detail: "Name, bio and Instagram", done: !!(profile?.first_name && profile?.last_name && profile?.bio && profile?.instagram), href: "/dashboard/mua/settings", weight: 20 },
      { label: "Add your experience", detail: "Experience level and years", done: !!profile?.experience && profile?.experience_years != null, href: "/dashboard/mua/settings", weight: 10 },
      { label: "Choose your service areas", detail: "At least one city or governorate", done: !!profile?.cities?.length, href: "/dashboard/mua/settings", weight: 10 },
      { label: "Set up your services", detail: "At least one service with price and duration", done: completeServices, href: "/dashboard/mua/services", weight: 25 },
      { label: "Build your portfolio", detail: "Add at least 5 photos", done: portfolioCount >= 5, href: "/dashboard/mua/portfolio", weight: 20 },
      { label: "Choose where you work", detail: "Home, hotel, venue or your studio", done: acceptedLocations.length > 0, href: "/dashboard/mua/services", weight: 10 },
      { label: "Add your contact number", detail: "A phone number for booking coordination", done: !!profilePhone, href: "/dashboard/mua/settings", weight: 5 },
    ];
  }, [profile, services, portfolioCount, acceptedLocations, profilePhone]);

  const profileCompletion = useMemo(
    () => profileTasks.reduce((total, task) => total + (task.done ? task.weight : 0), 0),
    [profileTasks]
  );

  return (
    <div className="space-y-8 text-[#171018]">
      {/* TOP HERO */}
      <section className="overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
              Beaura artist dashboard
            </p>

            <h1 className="mt-3 text-4xl font-light tracking-[-0.06em] md:text-5xl">
              Welcome back, {muaName} ✨
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f6077]">
              Keep track of bookings, wallet balance, earnings, and your profile
              in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/mua/calendar"
              className="rounded-full bg-purple-600 px-5 py-3 text-sm text-white transition hover:bg-purple-700"
            >
              Manage calendar
            </Link>

            <Link
              href="/dashboard/mua/wallet"
              className="rounded-full border border-[#eadff5] bg-[#fffafc] px-5 py-3 text-sm font-medium text-[#171018] transition hover:border-purple-300"
            >
              Open wallet
            </Link>

            <SupportHelpButton userType="mua" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickPill
            label="Pending bookings"
            value={pendingBookings.length.toString()}
          />
          <QuickPill
            label="Confirmed"
            value={confirmedBookings.length.toString()}
          />
          <QuickPill
            label="Wallet available"
            value={formatMoney(walletData?.available_balance)}
          />
          <QuickPill
            label="Profile completion"
            value={`${profileCompletion}%`}
          />
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Upcoming bookings"
          value={loading ? "..." : upcomingBookings.length.toString()}
          subtext="All upcoming confirmed or pending appointments"
          icon={<CalendarDays size={18} />}
        />

        <StatCard
          title="Pending confirmations"
          value={loading ? "..." : pendingBookings.length.toString()}
          subtext="Bookings waiting for your response"
          icon={<Clock3 size={18} />}
        />

        <StatCard
          title="Wallet balance"
          value={loading ? "..." : formatMoney(walletData?.available_balance)}
          subtext="Available balance ready for payout request"
          icon={<Wallet size={18} />}
          href="/dashboard/mua/wallet"
        />

        <StatCard
          title="Monthly earnings"
          value={loading ? "..." : `EGP ${monthlyEarnings.toLocaleString()}`}
          subtext="Estimated from confirmed bookings this month"
          icon={<CircleDollarSign size={18} />}
        />
      </section>

      {/* MAIN GRID */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* NEXT BOOKING */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
                  Next booking
                </p>
                <h2 className="mt-2 text-2xl font-light tracking-[-0.04em]">
                  {nextBooking ? "Coming up soon" : "No upcoming bookings yet"}
                </h2>
              </div>

              <Link
                href="/dashboard/mua/bookings"
                className="text-sm text-purple-700 hover:underline"
              >
                View all
              </Link>
            </div>

            {nextBooking ? (
              <div className="mt-5 rounded-[1.5rem] border border-[#eadff5] bg-[#faf7ff] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-medium text-[#171018]">
                      {nextBooking.bride_profiles?.first_name || "Client"}{" "}
                      {nextBooking.bride_profiles?.last_name || ""}
                    </p>

                    <p className="mt-1 text-sm text-[#6f6077]">
                      {formatDate(nextBooking.event_date)} •{" "}
                      {capitalize(nextBooking.status)}
                    </p>
                  </div>

                  <Link
                    href="/dashboard/mua/bookings"
                    className="inline-flex items-center gap-2 text-sm text-purple-700"
                  >
                    Open booking <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState text="Once a client books you, your next appointment will show up here." />
            )}
          </Card>

          {/* RECENT BOOKINGS */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
                  Recent bookings
                </p>
                <h2 className="mt-2 text-2xl font-light tracking-[-0.04em]">
                  Your latest activity
                </h2>
              </div>

              <Link
                href="/dashboard/mua/bookings"
                className="text-sm text-purple-700 hover:underline"
              >
                See all
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {bookings.slice(0, 5).length === 0 ? (
                <EmptyState text="No bookings yet — once someone books you, they’ll appear here." />
              ) : (
                bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-3 rounded-[1.4rem] border border-[#eadff5] bg-white p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#171018]">
                        {booking.bride_profiles?.first_name || "Client"}{" "}
                        {booking.bride_profiles?.last_name || ""}
                      </p>
                      <p className="mt-1 text-sm text-[#6f6077]">
                        {booking.event_date
                          ? formatDate(booking.event_date)
                          : "No date yet"}
                      </p>
                    </div>

                    <StatusBadge status={booking.status || "pending"} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* WALLET SNAPSHOT */}
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
              Wallet snapshot
            </p>

            <h2 className="mt-2 text-2xl font-light tracking-[-0.04em]">
              Your Beaura earnings
            </h2>

            <div className="mt-5 grid gap-3">
              <WalletRow
                label="Available"
                value={formatMoney(walletData?.available_balance)}
              />
              <WalletRow
                label="Pending"
                value={formatMoney(walletData?.pending_balance)}
              />
              <WalletRow
                label="Frozen"
                value={formatMoney(walletData?.frozen_balance)}
              />
              <WalletRow
                label="Total earned"
                value={formatMoney(walletData?.total_earned)}
              />
            </div>

            <Link
              href="/dashboard/mua/wallet"
              className="mt-6 inline-flex items-center gap-2 text-sm text-purple-700"
            >
              Open wallet <ArrowRight size={16} />
            </Link>
          </Card>

          {/* PROFILE COMPLETION */}
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-purple-700">Your profile</p>
            <h2 className="mt-2 text-2xl font-light tracking-[-0.04em]">
              {profileCompletion === 100 ? "Your profile is ready! ✨" : "Complete your profile"}
            </h2>
            <div className="mt-5 flex items-center gap-5">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1e5ff" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#9333ea" strokeWidth="9" strokeLinecap="round" strokeDasharray={String(profileCompletion * 2.6389) + " 263.89"} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-[#171018]">{profileCompletion}%</div>
              </div>
              <div>
                <p className="text-sm font-medium text-[#171018]">
                  {profileCompletion === 100 ? "You’ve done it!" : profileTasks.filter((task) => task.done).length + " of " + profileTasks.length + " steps complete"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#6f6077]">
                  {profileCompletion === 100 ? "Your artist profile has all the essentials clients need to book with confidence." : "Finish these steps to give brides everything they need to discover and book you."}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {profileTasks.map((task) => (
                <Link key={task.label} href={task.href} className="flex items-center gap-3 rounded-[1.2rem] border border-[#eadff5] bg-[#fffafc] px-4 py-3 transition hover:border-purple-300">
                  <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full " + (task.done ? "bg-green-100 text-green-700" : "bg-[#f1e5ff] text-purple-700")}>
                    {task.done ? <CheckCircle2 size={15} /> : <ArrowRight size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={"block text-sm " + (task.done ? "text-[#6f6077]" : "font-medium text-[#171018]")}>{task.label}</span>
                    <span className="mt-0.5 block text-xs text-[#8a7d91]">{task.detail}</span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-purple-700" />
                </Link>
              ))}
            </div>
          </Card>

          {/* SERVICES SNAPSHOT */}
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
              Your services
            </p>

            <h2 className="mt-2 text-2xl font-light tracking-[-0.04em]">
              Current menu
            </h2>

            <div className="mt-5 space-y-3">
              {services.length === 0 ? (
                <EmptyState text="You haven’t added services yet." />
              ) : (
                services.slice(0, 4).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-[1.2rem] border border-[#eadff5] bg-white px-4 py-3"
                  >
                    <span className="text-sm text-[#171018]">
                      {service.name}
                    </span>
                    <span className="text-sm text-[#6f6077]">
                      {service.price ? `EGP ${service.price}` : "—"}
                    </span>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/dashboard/mua/services"
              className="mt-6 inline-flex items-center gap-2 text-sm text-purple-700"
            >
              Manage services <ArrowRight size={16} />
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}

/* ---------------- UI ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}

function QuickPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[#eadff5] bg-[#faf7ff] px-4 py-2">
      <span className="text-xs uppercase tracking-[0.14em] text-[#8a7d91]">
        {label}
      </span>
      <span className="ml-2 text-sm font-medium text-[#171018]">{value}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon,
  href,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6f6077]">{title}</p>
        <div className="rounded-full bg-[#f7efff] p-2 text-purple-700">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-3xl font-light tracking-[-0.04em] text-[#171018]">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#8a7d91]">{subtext}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function WalletRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1.2rem] border border-[#eadff5] bg-[#fffafc] px-4 py-3">
      <span className="text-sm text-[#6f6077]">{label}</span>
      <span className="text-sm font-medium text-[#171018]">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "confirmed"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "cancelled"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-[#f7efff] text-purple-700 border-[#eadff5]";

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${styles}`}
    >
      {capitalize(status)}
    </span>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.2rem] border border-[#eadff5] bg-[#fffafc] px-4 py-3">
      <div
        className={`grid h-6 w-6 place-items-center rounded-full ${
          done ? "bg-green-100 text-green-700" : "bg-[#f1e5ff] text-purple-700"
        }`}
      >
        {done ? <CheckCircle2 size={15} /> : <Star size={14} />}
      </div>

      <span className="text-sm text-[#171018]">{label}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#eadff5] bg-[#fffafc] p-5 text-sm leading-6 text-[#6f6077]">
      {text}
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return "No date";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number | string | null | undefined) {
  return `EGP ${Number(value || 0).toLocaleString()}`;
}

function capitalize(value: string | null | undefined) {
  if (!value) return "Pending";
  return value.charAt(0).toUpperCase() + value.slice(1);
}