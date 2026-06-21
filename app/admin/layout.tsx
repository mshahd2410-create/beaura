"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  UserCheck,
  CalendarCheck,
  MessageSquare,
  Clock,
  BarChart3,
  Settings,
  Menu,
  X,
  Wallet,
  Tag,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/approvals", label: "Approvals", icon: Clock },
  { href: "/admin/muas", label: "MUAs", icon: UserCheck },
  { href: "/admin/brides", label: "Brides", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/wallet-requests", label: "Money Requests", icon: Wallet },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/support", label: "Support", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#fffafc] text-[#171018]">
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[86%] max-w-[340px] flex-col border-r border-[#eadff5] bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          onClose={() => setOpen(false)}
          mobile
        />
      </aside>

      <div className="flex min-h-screen">
        <aside className="hidden w-[290px] shrink-0 border-r border-[#eadff5] bg-white lg:flex lg:flex-col">
          <SidebarContent pathname={pathname} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#eadff5] bg-[#fffafc]/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpen(true)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#eadff5] bg-white lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={19} />
                </button>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
                    Beaura admin
                  </p>
                  <p className="text-sm text-[#6f6077]">
                    Manage approvals, users, bookings, money requests,
                    promotions, and support.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onClose,
  mobile = false,
}: {
  pathname: string;
  onClose?: () => void;
  mobile?: boolean;
}) {
  return (
    <>
      <div className="border-b border-[#eadff5] px-6 py-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="text-3xl font-light tracking-[-0.08em] text-[#171018]"
          >
            Beaura
          </Link>

          {mobile && (
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-[#fffafc]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-[#eadff5] bg-[#faf7ff] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
            admin space
          </p>
          <p className="mt-2 text-lg font-medium text-[#171018]">
            Control center
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6f6077]">
            Keep Beaura polished, safe, and organized.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-5 py-6">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-[#f7efff] text-purple-700"
                  : "text-[#6f6077] hover:bg-[#faf7ff] hover:text-[#171018]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#eadff5] p-5 text-xs text-[#8a7d91]">
        Beaura Admin v1.0
      </div>
    </>
  );
}