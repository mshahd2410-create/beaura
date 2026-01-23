"use client";

import { useState } from "react";
import Link from "next/link";

export default function BrideHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Beaura ✨</h1>

        <button onClick={() => setOpen(!open)} className="space-y-1.5">
          <span className="block w-6 h-0.5 bg-black" />
          <span className="block w-6 h-0.5 bg-black" />
          <span className="block w-6 h-0.5 bg-black" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 px-6 pb-6 text-sm">
          <Link href="/bride/home">Home</Link>
          <Link href="/bride/favorites">Favorites</Link>
          <Link href="/bride/bookings">Bookings</Link>
          <Link href="/bride/messages">Messages</Link>
          <Link href="/bride/account">Account</Link>
        </nav>
      )}
    </header>
  );
}