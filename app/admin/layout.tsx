"use client";

import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#FAF8FF]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 p-6 hidden md:flex flex-col">
        <h1 className="text-xl font-semibold mb-10">Beaura Admin</h1>

        <nav className="flex flex-col gap-4 text-sm text-gray-600">
          <Link href="/admin" className="hover:text-purple-600">
            Dashboard
          </Link>

          <Link href="/admin/muas" className="hover:text-purple-600">
            MUAs
          </Link>

          <Link href="/admin/brides" className="hover:text-purple-600">
            Brides
          </Link>

          <Link href="/admin/bookings" className="hover:text-purple-600">
            Bookings
          </Link>

          <Link href="/admin/support">Support</Link>

          <Link href="/admin/approvals" className="hover:text-purple-600">
  Approvals
</Link>

          <Link href="/admin/reports" className="hover:text-purple-600">
            Reports
          </Link>

          <Link href="/admin/settings" className="hover:text-purple-600">
            Settings
          </Link>
        </nav>

        <div className="mt-auto text-xs text-gray-400">
          Beaura v1.0
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}