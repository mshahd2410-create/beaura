"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function BrideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    ["Home", "/bride/home"],
    ["Favorites", "/bride/favorites"],
    ["Bookings", "/bride/bookings"],
    ["Messages", "/bride/messages"],
    ["Account", "/bride/account"],
  ];

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden relative">
      {/* HAMBURGER BUTTON (FLOATING, NOT A HEADER) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 left-6 z-50 text-2xl hover:text-purple-600 transition"
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* SLIDE MENU OVERLAY */}
      <div
        className={`fixed inset-0 z-40 transition ${
          open ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/30 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer */}
        <aside
          className={`
            absolute top-0 left-0 h-full w-72 bg-white
            transform transition-transform duration-300
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="px-6 py-8 space-y-10">
            <h2 className="text-lg font-medium">Menu</h2>

            <nav className="space-y-5">
              {navItems.map(([label, href]) => {
                const isActive = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`
                      block text-base transition-colors
                      ${
                        isActive
                          ? "text-purple-600 font-semibold"
                          : "text-black hover:text-purple-600"
                      }
                    `}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      </div>

      {/* PAGE CONTENT (NO HEADER OFFSET) */}
      <main>{children}</main>
    </div>
  );
}