"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminSettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#FAF8FF] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Admin Settings
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage Beaura admin preferences, account access, and platform tools.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Account
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Manage your admin session and access.
          </p>

          <button
            onClick={handleLogout}
            className="mt-6 rounded-full bg-red-600 px-5 py-2 text-sm text-white transition hover:bg-red-700"
          >
            Log out
          </button>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Admin Role
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Current role permissions are controlled from your Supabase admins
            table.
          </p>

          <div className="mt-6 rounded-2xl bg-purple-50 p-4 text-sm text-purple-700">
            Super admin access
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Platform Modules
          </h2>

          <div className="mt-5 space-y-3 text-sm text-gray-600">
            <SettingRow label="MUA Management" status="Active" />
            <SettingRow label="Bride Management" status="Active" />
            <SettingRow label="Bookings Management" status="Active" />
            <SettingRow label="Reports & Disputes" status="Active" />
            <SettingRow label="Support Inbox" status="Active" />
            <SettingRow label="MUA Approval Queue" status="Active" />
            <SettingRow label="Tawk Live Support" status="Active" />
            <SettingRow label="Payments" status="Postponed" />
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Future Settings
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            These will be connected later as Beaura grows.
          </p>

          <div className="mt-5 space-y-3 text-sm text-gray-600">
            <SettingRow label="Tier Management" status="Coming soon" />
            <SettingRow label="Reviews Moderation" status="Coming soon" />
            <SettingRow label="Wallet Management" status="Coming soon" />
            <SettingRow label="Promotions & Discounts" status="Coming soon" />
            <SettingRow label="Email Confirmations" status="Coming soon" />
            <SettingRow label="Reminder Emails" status="Coming soon" />
          </div>
        </section>
      </div>
    </main>
  );
}

function SettingRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
      <span>{label}</span>

      <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
        {status}
      </span>
    </div>
  );
}