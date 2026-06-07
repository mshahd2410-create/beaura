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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type DashboardStats = {
  pendingMuas: number;
  approvedMuas: number;
  brides: number;
  supportTickets: number;
  bookings: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingMuas: 0,
    approvedMuas: 0,
    brides: 0,
    supportTickets: 0,
    bookings: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function getCount(
    table: string,
    filters?: (query: any) => any
  ): Promise<number> {
    let query = supabase.from(table).select("*", {
      count: "exact",
      head: true,
    });

    if (filters) {
      query = filters(query);
    }

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
    ]);

    setStats({
      pendingMuas,
      approvedMuas,
      brides,
      supportTickets,
      bookings,
    });

    setLoading(false);
  }

  const cards = [
    {
      title: "Pending approvals",
      value: stats.pendingMuas,
      description: "New MUAs waiting for verification",
      icon: Clock,
      href: "/admin/approvals",
    },
    {
      title: "Approved MUAs",
      value: stats.approvedMuas,
      description: "Makeup artists visible to brides",
      icon: UserCheck,
      href: "/admin/muas",
    },
    {
      title: "Brides",
      value: stats.brides,
      description: "Registered bride accounts",
      icon: Users,
      href: "/admin/brides",
    },
    {
      title: "Support tickets",
      value: stats.supportTickets,
      description: "Open messages needing admin help",
      icon: MessageSquare,
      href: "/admin/support",
    },
    {
      title: "Bookings",
      value: stats.bookings,
      description: "Total platform bookings",
      icon: CalendarCheck,
      href: "/admin/bookings",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8FF] px-6 py-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-purple-600">
              Beaura Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Monitor approvals, support, brides, bookings, and platform activity.
            </p>
          </div>

          <button
            onClick={fetchStats}
            className="rounded-2xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-sm text-gray-500 shadow-sm">
            Loading dashboard stats...
          </div>
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          {card.title}
                        </p>

                        <p className="mt-4 text-4xl font-bold text-purple-600">
                          {card.value}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-purple-50 p-3 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
                        <Icon size={24} />
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-500">
                      {card.description}
                    </p>
                  </Link>
                );
              })}
            </section>

            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                    <AlertCircle size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Needs attention
                    </h2>
                    <p className="text-sm text-gray-500">
                      Items admins should review first.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  {stats.pendingMuas > 0 ? (
                    <Link
                      href="/admin/approvals"
                      className="block rounded-2xl bg-gray-50 p-4 transition hover:bg-purple-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-gray-900">
                          {stats.pendingMuas} MUA approval
                          {stats.pendingMuas === 1 ? "" : "s"} pending
                        </span>

                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Pending
                        </span>
                      </div>

                      <p className="mt-1 text-gray-500">
                        Review new makeup artists before they become visible.
                      </p>
                    </Link>
                  ) : (
                    <div className="rounded-2xl bg-gray-50 p-4 text-gray-500">
                      No pending MUA approvals.
                    </div>
                  )}

                  {stats.supportTickets > 0 ? (
                    <Link
                      href="/admin/support"
                      className="block rounded-2xl bg-gray-50 p-4 transition hover:bg-purple-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-gray-900">
                          {stats.supportTickets} open support ticket
                          {stats.supportTickets === 1 ? "" : "s"}
                        </span>

                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Open
                        </span>
                      </div>

                      <p className="mt-1 text-gray-500">
                        Reply to bride or MUA issues from the support inbox.
                      </p>
                    </Link>
                  ) : (
                    <div className="rounded-2xl bg-gray-50 p-4 text-gray-500">
                      No open support tickets.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">
                  Admin shortcuts
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Jump to the main dashboard sections.
                </p>

                <div className="mt-5 grid gap-3 text-sm">
                  <Link
                    href="/admin/approvals"
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4 font-semibold text-gray-800 transition hover:border-purple-100 hover:bg-purple-50 hover:text-purple-700"
                  >
                    MUA Approval Queue
                  </Link>

                  <Link
                    href="/admin/support"
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4 font-semibold text-gray-800 transition hover:border-purple-100 hover:bg-purple-50 hover:text-purple-700"
                  >
                    Support Inbox
                  </Link>

                  <Link
                    href="/admin/muas"
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4 font-semibold text-gray-800 transition hover:border-purple-100 hover:bg-purple-50 hover:text-purple-700"
                  >
                    Manage MUAs
                  </Link>

                  <Link
                    href="/admin/bookings"
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4 font-semibold text-gray-800 transition hover:border-purple-100 hover:bg-purple-50 hover:text-purple-700"
                  >
                    Bookings
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}