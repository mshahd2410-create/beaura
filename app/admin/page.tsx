"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  MessageSquare,
  CalendarCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Wallet,
  Tag,
  BarChart3,
  Settings,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type DashboardStats = {
  pendingMuas: number;
  approvedMuas: number;
  brides: number;
  supportTickets: number;
  bookings: number;
  pendingDeposits: number;
  cancellationRequests: number;
  promotions: number;
  reports: number;
};

type ActivityOverview = {
  bookingsToday: number;
  brideRegistrationsToday: number;
  muaRegistrationsToday: number;
  paymentsToday: number;
  paymentValueToday: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingMuas: 0,
    approvedMuas: 0,
    brides: 0,
    supportTickets: 0,
    bookings: 0,
    pendingDeposits: 0,
    cancellationRequests: 0,
    promotions: 0,
    reports: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityOverview>({
    bookingsToday: 0,
    brideRegistrationsToday: 0,
    muaRegistrationsToday: 0,
    paymentsToday: 0,
    paymentValueToday: 0,
  });
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function getCount(table: string, filters?: (query: any) => any) {
    let query = supabase.from(table).select("*", {
      count: "exact",
      head: true,
    });

    if (filters) query = filters(query);

    const { count, error } = await query;

    if (error) {
      console.error(`Error counting ${table}:`, error.message);
      return 0;
    }

    return count ?? 0;
  }

  async function fetchStats() {
    setLoading(true);
    setActivityError(null);

    const { start: todayStart, end: tomorrowStart } = getCairoDayBounds();

    const [
      pendingMuas,
      approvedMuas,
      brides,
      supportTickets,
      bookings,
      pendingDeposits,
      cancellationRequests,
      promotions,
      reports,
    ] = await Promise.all([
      getCount("mua_profiles", (q) =>
        q.eq("verified", false).eq("status", "active")
      ),
      getCount("mua_profiles", (q) =>
        q.eq("verified", true).eq("status", "active")
      ),
      getCount("bride_profiles"),
      getCount("support_tickets", (q) => q.eq("status", "open")),
      getCount("bookings"),
      getCount("booking_deposit_transfers", (q) => q.eq("status", "pending")),
      getCount("booking_cancellation_requests", (q) => q.in("request_status", ["requested", "awaiting_mua_repayment", "awaiting_admin_decision"])),
      getCount("promo_codes"),
      getCount("reports", (q) => q.neq("status", "resolved")),
    ]);

    setStats({
      pendingMuas,
      approvedMuas,
      brides,
      supportTickets,
      bookings,
      pendingDeposits,
      cancellationRequests,
      promotions,
      reports,
    });

    setLoading(false);

    const [bookingsToday, brideRegistrationsToday, muaRegistrationsToday, cardPayments, walletPayments, approvedDeposits] =
      await Promise.all([
        getCount("bookings", (q) => q.gte("created_at", todayStart).lt("created_at", tomorrowStart)),
        getCount("bride_profiles", (q) => q.gte("created_at", todayStart).lt("created_at", tomorrowStart)),
        getCount("mua_profiles", (q) => q.gte("created_at", todayStart).lt("created_at", tomorrowStart)),
        supabase.from("bookings").select("id, total_price").eq("card_paid", true).gte("card_paid_at", todayStart).lt("card_paid_at", tomorrowStart),
        supabase.from("bookings").select("id, total_price").eq("payment_method", "credit_balance").eq("wallet_charged", true).gte("wallet_charged_at", todayStart).lt("wallet_charged_at", tomorrowStart),
        supabase.from("bookings").select("id, deposit_amount").eq("payment_method", "transfer").eq("payment_proof_status", "approved").gte("payment_proof_reviewed_at", todayStart).lt("payment_proof_reviewed_at", tomorrowStart),
      ]);

    const paymentErrors = [cardPayments.error, walletPayments.error, approvedDeposits.error].filter(Boolean);
    if (paymentErrors.length) {
      setActivityError(paymentErrors.map((item) => item?.message).join(" · "));
    }

    const cardRows = cardPayments.data || [];
    const walletRows = walletPayments.data || [];
    const depositRows = approvedDeposits.data || [];
    const paymentValueToday =
      cardRows.reduce((sum, row) => sum + Number(row.total_price || 0), 0) +
      walletRows.reduce((sum, row) => sum + Number(row.total_price || 0), 0) +
      depositRows.reduce((sum, row) => sum + Number(row.deposit_amount || 0), 0);

    setActivity({
      bookingsToday,
      brideRegistrationsToday,
      muaRegistrationsToday,
      paymentsToday: cardRows.length + walletRows.length + depositRows.length,
      paymentValueToday,
    });
  }

  const cards = [
    {
      title: "Pending approvals",
      value: stats.pendingMuas,
      description: "New artists waiting for review",
      icon: Clock,
      href: "/admin/approvals",
    },
    {
      title: "Approved MUAs",
      value: stats.approvedMuas,
      description: "Artists visible to clients",
      icon: UserCheck,
      href: "/admin/muas",
    },
    {
      title: "Clients",
      value: stats.brides,
      description: "Registered client accounts",
      icon: Users,
      href: "/admin/brides",
    },
    {
      title: "Bookings",
      value: stats.bookings,
      description: "Total platform bookings",
      icon: CalendarCheck,
      href: "/admin/bookings",
    },
    {
      title: "Pending deposits",
      value: stats.pendingDeposits,
      description: "Approved deposits to transfer to MUAs",
      icon: Wallet,
      href: "/admin/pending-deposits",
    },
    {
      title: "Cancellation requests",
      value: stats.cancellationRequests,
      description: "Requests awaiting repayment or admin decision",
      icon: Clock,
      href: "/admin/cancellation-requests",
    },
    {
      title: "Promotions",
      value: stats.promotions,
      description: "Promo codes and offers",
      icon: Tag,
      href: "/admin/promotions",
    },
    {
      title: "Support tickets",
      value: stats.supportTickets,
      description: "Open messages needing help",
      icon: MessageSquare,
      href: "/admin/support",
    },
    {
      title: "Reports",
      value: stats.reports,
      description: "Open reports and disputes",
      icon: BarChart3,
      href: "/admin/reports",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
              Beaura admin
            </p>

            <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
              Dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
              Monitor approvals, clients, artists, bookings, payout requests,
              promotions, support, and reports in one clean place.
            </p>
          </div>

          <button
            onClick={fetchStats}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#171018] px-6 text-sm font-medium text-white transition hover:opacity-90"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Daily activity</p>
            <h2 className="mt-2 text-3xl font-light tracking-[-0.06em] text-[#171018]">Today on Beaura</h2>
            <p className="mt-2 text-sm text-[#6f6077]">{formatCairoToday()}</p>
          </div>
          <span className="text-xs text-[#8a7d91]">Refresh the dashboard to update these figures</span>
        </div>
        {activityError && (
          <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Some payment activity could not be loaded: {activityError}
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActivityCard label="Bookings created" value={loading ? "…" : activity.bookingsToday.toLocaleString("en-EG")} detail="New bookings today" icon={<CalendarCheck size={18} />} />
          <ActivityCard label="Bride registrations" value={loading ? "…" : activity.brideRegistrationsToday.toLocaleString("en-EG")} detail="New client accounts today" icon={<UserPlus size={18} />} />
          <ActivityCard label="MUA registrations" value={loading ? "…" : activity.muaRegistrationsToday.toLocaleString("en-EG")} detail="New artist accounts today" icon={<Users size={18} />} />
          <ActivityCard label="Payments recorded" value={loading ? "…" : activity.paymentsToday.toLocaleString("en-EG")} detail={loading ? "Loading payment totals" : `EGP ${activity.paymentValueToday.toLocaleString("en-EG", { maximumFractionDigits: 2 })} recorded today, including approved deposits`} icon={<CreditCard size={18} />} />
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-8 text-sm text-[#6f6077] shadow-sm">
          Loading dashboard stats...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                        {card.title}
                      </p>

                      <p className="mt-4 text-4xl font-light tracking-[-0.06em] text-[#171018]">
                        {card.value}
                      </p>
                    </div>

                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7efff] text-purple-700 transition group-hover:bg-[#171018] group-hover:text-white">
                      <Icon size={21} />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#6f6077]">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff4d8] text-amber-700">
                  <AlertCircle size={22} />
                </div>

                <div>
                  <h2 className="text-3xl font-light tracking-[-0.06em] text-[#171018]">
                    Needs attention
                  </h2>
                  <p className="text-sm text-[#6f6077]">Review these first.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <AttentionItem
                  show={stats.pendingMuas > 0}
                  emptyText="No pending MUA approvals."
                  title={`${stats.pendingMuas} pending MUA approval${
                    stats.pendingMuas === 1 ? "" : "s"
                  }`}
                  text="Review new makeup artists before they become visible."
                  href="/admin/approvals"
                  badge="Pending"
                />

                <AttentionItem
                  show={stats.pendingDeposits > 0}
                  emptyText="No pending MUA deposits."
                  title={`${stats.pendingDeposits} pending deposit${stats.pendingDeposits === 1 ? "" : "s"}`}
                  text="Record external deposit transfers to makeup artists."
                  href="/admin/pending-deposits"
                  badge="Deposits"
                />
                <AttentionItem
                  show={stats.cancellationRequests > 0}
                  emptyText="No open cancellation requests."
                  title={`${stats.cancellationRequests} cancellation request${stats.cancellationRequests === 1 ? "" : "s"}`}
                  text="Review repayment and refund decisions."
                  href="/admin/cancellation-requests"
                  badge="Review"
                />

                <AttentionItem
                  show={stats.supportTickets > 0}
                  emptyText="No open support tickets."
                  title={`${stats.supportTickets} open support ticket${
                    stats.supportTickets === 1 ? "" : "s"
                  }`}
                  text="Reply to client or artist issues from support."
                  href="/admin/support"
                  badge="Open"
                />

                <AttentionItem
                  show={stats.reports > 0}
                  emptyText="No open reports."
                  title={`${stats.reports} open report${
                    stats.reports === 1 ? "" : "s"
                  }`}
                  text="Review reports, disputes, and suspicious activity."
                  href="/admin/reports"
                  badge="Reports"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-3xl font-light tracking-[-0.06em] text-[#171018]">
                Admin shortcuts
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                Jump to the most used sections.
              </p>

              <div className="mt-6 grid gap-3">
                <Shortcut href="/admin/approvals" label="MUA Approval Queue" />
                <Shortcut href="/admin/pending-deposits" label="Pending Deposits" />
                <Shortcut href="/admin/cancellation-requests" label="Cancellation Requests" />
                <Shortcut href="/admin/brides" label="Manage Clients" />
                <Shortcut href="/admin/muas" label="Manage MUAs" />
                <Shortcut href="/admin/bookings" label="Bookings" />
                <Shortcut href="/admin/finance" label="Finance Overview" />
                <Shortcut href="/admin/promotions" label="Promotions" />
                <Shortcut href="/admin/support" label="Support Inbox" />
                <Shortcut href="/admin/reports" label="Reports & Disputes" />
                <Shortcut href="/admin/settings" label="Settings" />
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function getCairoDayBounds() {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const nextDate = new Date(`${dateKey}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return {
    start: cairoMidnightUtc(dateKey),
    end: cairoMidnightUtc(nextDate.toISOString().slice(0, 10)),
  };
}

function cairoMidnightUtc(dateKey: string) {
  const utcGuess = new Date(`${dateKey}T00:00:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(utcGuess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const cairoAsUtc = Date.UTC(
    Number(values.year), Number(values.month) - 1, Number(values.day),
    Number(values.hour), Number(values.minute), Number(values.second)
  );
  return new Date(Date.parse(`${dateKey}T00:00:00.000Z`) - (cairoAsUtc - utcGuess.getTime())).toISOString();
}

function formatCairoToday() {
  return new Intl.DateTimeFormat("en-EG", {
    timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());
}

function ActivityCard({ label, value, detail, icon }: {
  label: string; value: string; detail: string; icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[#8a7d91]">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f7efff] text-purple-700">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-light tracking-[-0.05em] text-[#171018]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#6f6077]">{detail}</p>
    </article>
  );
}

function AttentionItem({
  show,
  emptyText,
  title,
  text,
  href,
  badge,
}: {
  show: boolean;
  emptyText: string;
  title: string;
  text: string;
  href: string;
  badge: string;
}) {
  if (!show) {
    return (
      <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4 text-sm text-[#6f6077]">
        {emptyText}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4 transition hover:border-purple-300"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-[#171018]">{title}</span>
        <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-medium text-amber-700">
          {badge}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-[#6f6077]">{text}</p>
    </Link>
  );
}

function Shortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4 text-sm font-medium text-[#171018] transition hover:border-purple-300 hover:text-purple-700"
    >
      {label}
      <ArrowRight size={16} />
    </Link>
  );
}