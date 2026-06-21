"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, LogOut, Shield, UserRound } from "lucide-react";

export default function BrideAccount() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);
    setEmail(user.email || "");

    const { data: profile } = await supabase
      .from("bride_profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle();

    setFirstName(profile?.first_name || user.user_metadata?.first_name || "");
    setLastName(profile?.last_name || user.user_metadata?.last_name || "");

    setLoading(false);
  }

  async function saveProfile() {
    if (!userId) return;

    setSaving(true);

    await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    await supabase
      .from("bride_profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
      })
      .eq("id", userId);

    setSaving(false);
    alert("Profile updated ✨");
  }

  async function resetPassword() {
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset email sent ✨");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-4 pt-28 text-[#6f6077]">
        Loading account…
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffafc] px-4 pb-28 pt-24 text-[#171018] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white shadow-sm">
          <div className="bg-[#171018] p-6 text-white sm:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              your space
            </p>
            <h1 className="mt-4 text-5xl font-light leading-[0.9] tracking-[-0.08em] sm:text-7xl">
              Account
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
              Keep your details polished, secure, and ready for your next glam booking.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
            <MiniCard label="Name" value={`${firstName} ${lastName}`.trim() || "Not added"} />
            <MiniCard label="Email" value={email} />
            <MiniCard label="Account type" value="Client" />
          </div>
        </div>

        <Card
          icon={<UserRound size={18} />}
          title="Personal information"
          subtitle="Update the name shown on your Beaura account."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={firstName} onChange={setFirstName} />
            <Field label="Last name" value={lastName} onChange={setLastName} />

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
                Email address
              </label>
              <input
                value={email}
                disabled
                className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#f7f3fa] px-4 text-sm text-[#6f6077]"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="mt-6 h-12 rounded-full bg-[#171018] px-7 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </Card>

        <Card
          icon={<Shield size={18} />}
          title="Security"
          subtitle="Keep your account protected."
        >
          <div className="space-y-3">
            <ActionRow label="Change password" onClick={resetPassword} />
            <LinkRow href="/privacy" label="Privacy policy" />
            <LinkRow href="/terms" label="Terms & conditions" />
            <LinkRow href="/contact" label="Contact support" />
          </div>
        </Card>

        <button
          onClick={handleLogout}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#171018] px-6 py-4 text-sm font-medium text-white transition hover:opacity-90"
        >
          <LogOut size={16} />
          Logout
        </button>
      </section>
    </main>
  );
}

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f7efff] text-purple-700">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6f6077]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-medium text-[#171018]">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm text-[#171018] outline-none transition focus:border-purple-500"
      />
    </div>
  );
}

function ActionRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#eadff5] bg-[#fffafc] px-5 text-sm text-[#171018] transition hover:border-purple-300"
    >
      <span>{label}</span>
      <ArrowRight size={16} />
    </button>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#eadff5] bg-[#fffafc] px-5 text-sm text-[#171018] transition hover:border-purple-300"
    >
      <span>{label}</span>
      <ArrowRight size={16} />
    </Link>
  );
}