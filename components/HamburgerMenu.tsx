"use client";

import Link from "next/link";

export default function HamburgerMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-72 bg-white p-8 space-y-6">
        <button onClick={onClose} className="text-sm text-gray-500">Close</button>

        <nav className="flex flex-col gap-5 text-lg">
          <Link href="/bride/home">Home</Link>
          <Link href="/bride/favorites">Favorites</Link>
          <Link href="/bride/bookings">Bookings</Link>
          <Link href="/bride/messages">Messages</Link>
          <Link href="/bride/account">Account</Link>
        </nav>
      </div>
    </div>
  );
}