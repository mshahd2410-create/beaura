"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Calendar,
  Briefcase,
  MessageCircle,
  Star,
  Image,
  DollarSign,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";

export default function MuaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  // 🔴 FETCH PENDING BOOKINGS COUNT
  const fetchPendingCount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("mua_id", user.id)
      .eq("status", "pending");

    setPendingCount(count || 0);
  };

  // 🔴 INITIAL LOAD
  useEffect(() => {
    fetchPendingCount();
  }, []);

  // 🔴 REALTIME LISTENER
  useEffect(() => {
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel("mua-bookings-layout")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `mua_id=eq.${user.id}`,
          },
          () => {
            fetchPendingCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#f6f6f8]">
      {/* Sidebar */}
      <aside
        className="
          w-64
          bg-white
          border-r border-black/5
          px-6
          py-8
          space-y-12
        "
      >
        <h1 className="text-2xl font-light tracking-wide text-black">
          Beaura
        </h1>

        <nav className="space-y-5 text-sm">
          <NavItem href="/dashboard/mua" icon={<Briefcase size={18} />} label="Dashboard" />

          {/* 🔴 BOOKINGS WITH BADGE */}
          <Link
            href="/dashboard/mua/bookings"
            className="
              flex
              items-center
              justify-between
              text-gray-700
              hover:text-purple-600
              transition
            "
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} />
              Bookings
            </div>

            {pendingCount > 0 && (
              <span
                className="
                  min-w-[20px]
                  h-5
                  px-2
                  rounded-full
                  bg-purple-600
                  text-white
                  text-xs
                  flex
                  items-center
                  justify-center
                "
              >
                {pendingCount}
              </span>
            )}
          </Link>

          <NavItem href="/dashboard/mua/calendar" icon={<Calendar size={18} />} label="Calendar" />
          <NavItem href="/dashboard/mua/messages" icon={<MessageCircle size={18} />} label="Messages" />
          <NavItem href="/dashboard/mua/reviews" icon={<Star size={18} />} label="Reviews" />
          <NavItem href="/dashboard/mua/portfolio" icon={<Image size={18} />} label="Portfolio" />
          <NavItem href="/dashboard/mua/services" icon={<Briefcase size={18} />} label="Services" />
          <NavItem href="/dashboard/mua/payouts" icon={<DollarSign size={18} />} label="Payouts" />
          <NavItem href="/dashboard/mua/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>

        <button
          onClick={logout}
          className="
            flex
            items-center
            gap-3
            text-sm
            text-gray-600
            hover:text-purple-600
            transition
          "
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header
          className="
            h-16
            bg-white
            border-b border-black/5
            flex
            items-center
            justify-end
            px-8
            gap-6
          "
        >
          <Bell
            size={20}
            className="cursor-pointer text-gray-600 hover:text-purple-600 transition"
          />
          <MessageCircle
            size={20}
            className="cursor-pointer text-gray-600 hover:text-purple-600 transition"
          />
        </header>

        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="
        flex
        items-center
        gap-3
        text-gray-700
        hover:text-purple-600
        transition
      "
    >
      {icon}
      {label}
    </Link>
  );
}