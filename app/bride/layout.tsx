"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Heart, Menu, Wallet, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const NAV_ITEMS = [
  ["Discover", "/bride/home"],
  ["Favorites", "/bride/favorites"],
  ["Bookings", "/bride/bookings"],
  ["Messages", "/bride/messages"],
  ["Wallet", "/bride/wallet"],
  ["Account", "/bride/account"],
];

export default function BrideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; href: string | null; is_read: boolean; created_at: string }>>([]);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, href, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);
      setNotifications((data || []) as typeof notifications);
      channel = supabase
        .channel("bride-notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, loadNotifications)
        .subscribe();
    }
    loadNotifications();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  async function markNotificationRead(id: string) {
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, is_read: true } : item));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fffafc] text-[#171018]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#eadff5] bg-[#fffafc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/bride/home"
            className="text-3xl font-light tracking-[-0.08em]"
          >
            Beaura
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  pathname === href
                    ? "bg-[#f7efff] text-purple-700"
                    : "text-[#6f6077] hover:bg-[#f7efff] hover:text-purple-700"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((value) => !value)}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-white hover:text-purple-700"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-purple-700 px-1 text-[10px] font-semibold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-[#eadff5] bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#eadff5] px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                    <span className="text-xs text-[#8a7d91]">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-5 text-sm text-[#6f6077]">You’re all caught up.</p>
                    ) : notifications.map((item) => (
                      <Link key={item.id} href={item.href || "/bride/bookings"} onClick={() => markNotificationRead(item.id)} className={`block border-b border-[#f1eaf5] px-4 py-4 hover:bg-[#fffafc] ${item.is_read ? "bg-white" : "bg-[#f7efff]/70"}`}>
                        <div className="flex items-start gap-2">
                          {!item.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-700" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#171018]">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-[#6f6077]">{item.message}</p>
                            <p className="mt-2 text-[10px] text-[#9a8da2]">{new Date(item.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/bride/wallet"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-white hover:text-purple-700"
              aria-label="Wallet"
            >
              <Wallet size={18} />
            </Link>

            <Link
              href="/bride/favorites"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-white hover:text-purple-700"
              aria-label="Favorites"
            >
              <Heart size={18} />
            </Link>

            <button
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-white md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-50 ${open ? "visible" : "invisible"}`}>
        <button
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/30 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close menu"
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#fffafc] p-7 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xl font-light tracking-[-0.08em]">
              Beaura
            </span>

            <button
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#f7efff]"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mt-12 flex flex-col gap-3">
            {NAV_ITEMS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-3xl px-5 py-4 text-3xl font-light tracking-[-0.06em] ${
                  pathname === href
                    ? "bg-[#f7efff] text-purple-700"
                    : "text-[#171018] hover:bg-[#f7efff]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>

      {children}
    </div>
  );
}