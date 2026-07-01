"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/lib/supabaseClient";
import { MuaApprovalBanner } from "@/components/dashboard/mua/MuaApprovalBanner";
import {
  Calendar,
  Briefcase,
  MessageCircle,
  Star,
  Image,
  Wallet,
  Settings,
  LogOut,
  Bell,
  LayoutGrid,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/mua", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard/mua/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/mua/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/mua/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/mua/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/mua/portfolio", label: "Portfolio", icon: Image },
  { href: "/dashboard/mua/services", label: "Services", icon: Briefcase },
  { href: "/dashboard/mua/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/mua/settings", label: "Settings", icon: Settings },
];

export default function MuaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [pendingCount, setPendingCount] = useState(0);
  const [firstName, setFirstName] = useState("Artist");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await Promise.all([fetchPendingCount(user.id), fetchProfileName(user.id)]);

      activeChannel = supabase
        .channel("mua-layout-bookings")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `mua_id=eq.${user.id}`,
          },
          () => fetchPendingCount(user.id)
        )
        .subscribe();
    }

    init();

    return () => {
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function fetchPendingCount(userId: string) {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("mua_id", userId)
      .eq("status", "pending");

    setPendingCount(count || 0);
  }

  async function fetchProfileName(userId: string) {
    const { data } = await supabase
      .from("mua_profiles")
      .select("first_name")
      .eq("id", userId)
      .maybeSingle();

    if (data?.first_name) setFirstName(data.first_name);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#fffafc] text-[#171018]">
      {/* MOBILE OVERLAY */}
      {menuOpen && (
        <button
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm xl:hidden"
          aria-label="Close menu"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[86%] max-w-[340px] flex-col border-r border-[#eadff5] bg-white shadow-2xl transition-transform duration-300 xl:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-[#eadff5] px-5 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/mua"
              className="text-3xl font-light tracking-[-0.08em] text-[#171018]"
            >
              Beaura
            </Link>

            <button
              onClick={() => setMenuOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-[#fffafc]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-[#eadff5] bg-[#faf7ff] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
              artist space
            </p>
            <p className="mt-2 text-lg font-medium text-[#171018]">
              Hi, {firstName} ✨
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6f6077]">
              Manage your bookings, services, wallet, and availability.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              pendingCount={pendingCount}
            />
          ))}
        </nav>

        <div className="border-t border-[#eadff5] p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#6f6077] transition hover:bg-[#faf7ff] hover:text-[#171018]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[290px] shrink-0 border-r border-[#eadff5] bg-white xl:flex xl:flex-col">
          <div className="border-b border-[#eadff5] px-7 py-7">
            <Link
              href="/dashboard/mua"
              className="text-3xl font-light tracking-[-0.08em] text-[#171018]"
            >
              Beaura
            </Link>

            <div className="mt-6 rounded-[1.6rem] border border-[#eadff5] bg-[#faf7ff] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
                artist space
              </p>
              <p className="mt-2 text-lg font-medium text-[#171018]">
                Hi, {firstName} ✨
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6f6077]">
                Manage your bookings, services, wallet, and availability.
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-5 py-6">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                pendingCount={pendingCount}
              />
            ))}
          </nav>

          <div className="border-t border-[#eadff5] p-5">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#6f6077] transition hover:bg-[#faf7ff] hover:text-[#171018]"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#eadff5] bg-[#fffafc]/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMenuOpen(true)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#eadff5] bg-white text-[#171018] xl:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={19} />
                </button>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-700 xl:hidden">
                    Beaura artist dashboard
                  </p>
                  <p className="hidden text-sm text-[#6f6077] xl:block">
                    Manage your business
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/mua/bookings"
                  className="relative grid h-11 w-11 place-items-center rounded-full border border-[#eadff5] bg-white text-[#6f6077] transition hover:text-purple-700"
                >
                  <Bell size={18} />
                  {pendingCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-purple-600" />
                  )}
                </Link>

                <Link
                  href="/dashboard/mua/messages"
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#eadff5] bg-white text-[#6f6077] transition hover:text-purple-700"
                >
                  <MessageCircle size={18} />
                </Link>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-8">
            <MuaApprovalBanner />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  pendingCount,
}: {
  item: {
    href: string;
    label: string;
    icon: any;
  };
  pathname: string;
  pendingCount: number;
}) {
  const Icon = item.icon;
  const active = pathname === item.href;
  const isBookings = item.href === "/dashboard/mua/bookings";

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
        active
          ? "bg-[#f7efff] text-purple-700"
          : "text-[#6f6077] hover:bg-[#faf7ff] hover:text-[#171018]"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span>{item.label}</span>
      </div>

      {isBookings && pendingCount > 0 && (
        <span className="min-w-[22px] rounded-full bg-purple-600 px-2 py-1 text-center text-[11px] font-medium text-white">
          {pendingCount}
        </span>
      )}
    </Link>
  );
}