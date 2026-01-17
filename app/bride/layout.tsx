"use client";

import { useState } from "react";
import Link from "next/link";

export default function BrideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#faf7f2]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#faf7f2] px-5 py-4 flex justify-between items-center">
        <button onClick={() => setOpen(true)} className="text-2xl">
          ☰
        </button>
        <h1 className="text-lg font-light">Beaura</h1>
        <div className="flex gap-4">
          <Link href="/bride/messages">💬</Link>
          <span>🔔</span>
        </div>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30">
          <aside className="absolute left-0 top-0 h-full w-72 bg-white p-6 space-y-6">
            <button onClick={() => setOpen(false)}>✕</button>

            <nav className="space-y-4 text-sm">
              <Link href="/bride/home">Home</Link>
              <Link href="/bride/favorites">Favorites</Link>
              <Link href="/bride/bookings">Bookings</Link>
              <Link href="/bride/messages">Messages</Link>
              <Link href="/bride/account">Account</Link>
            </nav>
          </aside>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}