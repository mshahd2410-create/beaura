"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, Menu, Wallet, X } from "lucide-react";

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
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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