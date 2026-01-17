"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-[#faf7f2]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r px-6 py-8 space-y-10">
        <h1 className="text-xl font-light tracking-wide">
          Beaura ✨
        </h1>

        <nav className="space-y-5 text-sm">
          <NavItem href="/dashboard/mua" icon={<Briefcase size={18} />} label="Dashboard" />
          <NavItem href="/dashboard/mua/bookings" icon={<Calendar size={18} />} label="Bookings" />
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
          className="flex items-center gap-3 text-sm text-gray-500 hover:text-black transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Top bar */}
        <header className="h-16 bg-white border-b flex items-center justify-end px-8 gap-6">
          <Bell size={20} className="cursor-pointer" />
          <MessageCircle size={20} className="cursor-pointer" />
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
      className="flex items-center gap-3 text-gray-600 hover:text-black transition"
    >
      {icon}
      {label}
    </Link>
  );
}
