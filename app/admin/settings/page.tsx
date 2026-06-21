"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, Save, Shield, X } from "lucide-react";

type AdminSettings = {
  id: string;
  platform_name: string | null;
  support_email: string | null;
  booking_fee_percent: number | null;
  payout_days: string | null;
  maintenance_mode: boolean | null;
  mua_auto_approval: boolean | null;
  updated_at: string | null;
};

type ModuleHealth = {
  label: string;
  table: string;
  count: number;
  status: "Active" | "Needs setup" | "Error";
};

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState<string>("—");
  const [adminId, setAdminId] = useState<string>("—");

  const [settings, setSettings] = useState<AdminSettings>({
    id: "platform",
    platform_name: "Beaura",
    support_email: "",
    booking_fee_percent: 10,
    payout_days: "1-5 business days",
    maintenance_mode: false,
    mua_auto_approval: false,
    updated_at: null,
  });

  const [newPassword, setNewPassword] = useState("");
  const [modules, setModules] = useState<ModuleHealth[]>([]);

  useEffect(() => {
    loadSettingsPage();
  }, []);

  async function loadSettingsPage() {
    setLoading(true);
    setLoadError(null);

    await Promise.all([loadAdminUser(), loadPlatformSettings(), loadModules()]);

    setLoading(false);
  }

  async function loadAdminUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("ADMIN USER LOAD ERROR:", error);
      return;
    }

    setAdminEmail(data.user?.email || "—");
    setAdminId(data.user?.id || "—");
  }

  async function loadPlatformSettings() {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("id", "platform")
      .single();

    if (error) {
      console.error("ADMIN SETTINGS LOAD ERROR:", error);
      setLoadError(
        "Admin settings table is missing or blocked by RLS. Run the SQL setup first."
      );
      return;
    }

    if (data) {
      setSettings(data as AdminSettings);
    }
  }

  async function getTableCount(table: string) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      return {
        count: 0,
        status: "Error" as const,
      };
    }

    return {
      count: count || 0,
      status: "Active" as const,
    };
  }

  async function loadModules() {
    const moduleTables = [
      { label: "MUA Management", table: "mua_profiles" },
      { label: "Bride Management", table: "bride_profiles" },
      { label: "Bookings Management", table: "bookings" },
      { label: "Reports", table: "reports" },
      { label: "Disputes", table: "disputes" },
      { label: "Support Inbox", table: "support_tickets" },
    ];

    const results = await Promise.all(
      moduleTables.map(async (module) => {
        const result = await getTableCount(module.table);

        return {
          label: module.label,
          table: module.table,
          count: result.count,
          status: result.status,
        };
      })
    );

    setModules(results);
  }

  async function savePlatformSettings() {
    setSavingSettings(true);

    const { error } = await supabase
      .from("admin_settings")
      .upsert({
        id: "platform",
        platform_name: settings.platform_name || "Beaura",
        support_email: settings.support_email || "",
        booking_fee_percent: Number(settings.booking_fee_percent || 0),
        payout_days: settings.payout_days || "",
        maintenance_mode: !!settings.maintenance_mode,
        mua_auto_approval: !!settings.mua_auto_approval,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "platform");

    if (error) {
      alert(error.message);
      setSavingSettings(false);
      return;
    }

    await loadPlatformSettings();
    setSavingSettings(false);
    alert("Settings saved ✨");
  }

  async function updatePassword() {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert(error.message);
      setChangingPassword(false);
      return;
    }

    setNewPassword("");
    setChangingPassword(false);
    alert("Password updated successfully.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function formatDate(date: string | null) {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          admin settings
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Settings
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Manage your admin account, platform settings, security access, and
          Beaura module health.
        </p>
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <X className="mt-0.5" size={18} />
            <div>
              <p className="font-medium">Settings setup needed</p>
              <p className="mt-1">{loadError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Admin email" value={adminEmail} small />
        <Stat label="Booking fee" value={`${settings.booking_fee_percent || 0}%`} />
        <Stat
          label="Maintenance"
          value={settings.maintenance_mode ? "On" : "Off"}
        />
        <Stat
          label="Auto approval"
          value={settings.mua_auto_approval ? "On" : "Off"}
        />
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading settings...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="account"
              title="Admin account"
              description="View your current admin session and update access."
            />

            <div className="mt-6 space-y-4">
              <Info label="Email" value={adminEmail} />
              <Info label="User ID" value={adminId} />
              <Info
                label="Last settings update"
                value={formatDate(settings.updated_at)}
              />

              <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                  Change password
                </p>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New admin password"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#eadff5] bg-white px-4 text-sm outline-none focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={updatePassword}
                  disabled={changingPassword}
                  className="mt-4 rounded-full border border-purple-200 px-5 py-3 text-sm font-medium text-purple-700 disabled:opacity-50"
                >
                  {changingPassword ? "Updating..." : "Update password"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-red-200 px-5 py-3 text-sm font-medium text-red-600"
              >
                Log out
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="platform"
              title="Platform settings"
              description="These values are saved in Supabase and can be used across Beaura."
            />

            <div className="mt-6 space-y-4">
              <TextInput
                label="Platform name"
                value={settings.platform_name || ""}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    platform_name: value,
                  }))
                }
              />

              <TextInput
                label="Support email"
                value={settings.support_email || ""}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    support_email: value,
                  }))
                }
              />

              <TextInput
                label="Booking fee percent"
                type="number"
                value={String(settings.booking_fee_percent || 0)}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    booking_fee_percent: Number(value),
                  }))
                }
              />

              <TextInput
                label="Payout timing"
                value={settings.payout_days || ""}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    payout_days: value,
                  }))
                }
              />

              <ToggleRow
                label="Maintenance mode"
                description="Turn this on if you want to temporarily pause platform activity."
                checked={!!settings.maintenance_mode}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    maintenance_mode: value,
                  }))
                }
              />

              <ToggleRow
                label="Auto approve MUAs"
                description="Keep this off if admins must manually verify makeup artists."
                checked={!!settings.mua_auto_approval}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    mua_auto_approval: value,
                  }))
                }
              />

              <button
                type="button"
                onClick={savePlatformSettings}
                disabled={savingSettings}
                className="inline-flex items-center gap-2 rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                <Save size={16} />
                {savingSettings ? "Saving..." : "Save settings"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader
                eyebrow="system"
                title="Module health"
                description="Live table checks from Supabase. If a table errors, it needs RLS or schema setup."
              />

              <button
                type="button"
                onClick={loadSettingsPage}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadff5] px-5 py-3 text-sm text-[#6f6077]"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <div
                  key={module.table}
                  className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#171018]">
                        {module.label}
                      </p>

                      <p className="mt-1 text-xs text-[#8a7d91]">
                        {module.table}
                      </p>
                    </div>

                    <StatusBadge status={module.status} />
                  </div>

                  <p className="mt-5 text-4xl font-light tracking-[-0.06em] text-[#171018]">
                    {module.count}
                  </p>

                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                    records
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm xl:col-span-2">
            <SectionHeader
              eyebrow="security"
              title="Admin protection checklist"
              description="Real rules you should keep active before launching Beaura."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ChecklistItem
                title="Admin routes protected"
                description="Only logged-in admins should access /admin pages."
              />
              <ChecklistItem
                title="RLS enabled"
                description="Supabase policies should control who reads and edits each table."
              />
              <ChecklistItem
                title="Manual MUA approval"
                description="Keep auto approval off until verification is fully trusted."
              />
              <ChecklistItem
                title="Support and disputes monitored"
                description="Check support tickets, reports, and disputes daily after launch."
              />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-light tracking-[-0.06em] text-[#171018]">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6f6077]">{description}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <h2
        className={`mt-3 font-light tracking-[-0.06em] text-[#171018] ${
          small ? "break-all text-lg" : "text-4xl"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <p className="mt-1 break-all text-sm text-[#171018]">{value}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-[#554a5c]">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm outline-none focus:border-purple-500"
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
      <div>
        <p className="text-sm font-medium text-[#171018]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[#6f6077]">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-[#171018]" : "bg-[#e8deef]"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: "Active" | "Needs setup" | "Error" }) {
  const className =
    status === "Active"
      ? "bg-green-50 text-green-700"
      : status === "Error"
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

function ChecklistItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#171018] text-white">
          <Shield size={16} />
        </div>

        <div>
          <p className="text-sm font-medium text-[#171018]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#6f6077]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}