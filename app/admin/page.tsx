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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type DashboardStats = {
  pendingMuas: number;
  approvedMuas: number;
  brides: number;
  supportTickets: number;
  bookings: number;
  moneyRequests: number;
  promotions: number;
  reports: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingMuas: 0,
    approvedMuas: 0,
    brides: 0,
    supportTickets: 0,
    bookings: 0,
    moneyRequests: 0,
    promotions: 0,
    reports: 0,
  });

  const [loading, setLoading] = useState(true);

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

    const [
      pendingMuas,
      approvedMuas,
      brides,
      supportTickets,
      bookings,
      moneyRequests,
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
      getCount("wallet_cash_requests", (q) => q.eq("status", "pending")),
      getCount("promo_codes"),
      getCount("reports", (q) => q.neq("status", "resolved")),
    ]);

    setStats({
      pendingMuas,
      approvedMuas,
      brides,
      supportTickets,
      bookings,
      moneyRequests,
      promotions,
      reports,
    });

    setLoading(false);
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
      title: "Money requests",
      value: stats.moneyRequests,
      description: "Pending MUA payout requests",
      icon: Wallet,
      href: "/admin/wallet-requests",
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
                  show={stats.moneyRequests > 0}
                  emptyText="No pending money requests."
                  title={`${stats.moneyRequests} pending money request${
                    stats.moneyRequests === 1 ? "" : "s"
                  }`}
                  text="Review MUA cash-out and payout requests."
                  href="/admin/wallet-requests"
                  badge="Money"
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
                <Shortcut href="/admin/wallet-requests" label="Money Requests" />
                <Shortcut href="/admin/brides" label="Manage Clients" />
                <Shortcut href="/admin/muas" label="Manage MUAs" />
                <Shortcut href="/admin/bookings" label="Bookings" />
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