"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ClientForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  eventDate: string;
  eventLocation: string;
  makeupType: string;
  preferences: string;
};

const MAKEUP_TYPES = [
  "Bridal makeup",
  "Soirée makeup",
  "Photoshoot makeup",
  "Engagement makeup",
];

const MOODS = [
  "Soft glam",
  "Clean girl makeup",
  "Bronze glow",
  "Full glam",
  "Natural glam",
  "Classic evening",
];

export default function RegisterClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState<ClientForm>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    eventDate: "",
    eventLocation: "",
    makeupType: "",
    preferences: "",
  });

  const addMood = (mood: string) => {
    setForm((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(mood)
        ? prev.preferences
        : prev.preferences
        ? `${prev.preferences}, ${mood}`
        : mood,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!agreed) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    let user = signUpData.user;

    if (!user) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      user = signInData.user;
    }

    if (!user) {
      setError("Authentication failed. Please try logging in.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("bride_profiles")
      .insert({
        id: user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        email: form.email,
        event_date: form.eventDate || null,
        event_location: form.eventLocation || null,
        makeup_type: form.makeupType || null,
        preferences: form.preferences || null,
        status: "active",
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.replace("/bride/home");
  };

  return (
    <main className="min-h-screen bg-[#fffafc] px-4 py-10 text-[#171018]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-4xl font-light tracking-[-0.08em]">
            Beaura
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-[#eadff5] bg-white px-5 py-2 text-sm hover:border-purple-300"
          >
            Sign in
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-[0_25px_80px_rgba(88,28,135,0.12)] md:p-9"
        >
          <header className="mb-8 text-center">
            <p className="mx-auto mb-4 w-fit rounded-full bg-[#f7efff] px-4 py-2 text-xs uppercase tracking-[0.18em] text-purple-700">
              client signup
            </p>

            <h1 className="text-4xl font-light tracking-[-0.06em] md:text-5xl">
              Let’s get your glam plan started.
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#6f6077]">
              Create your account to browse makeup artists for weddings,
              engagements, shoots, soirées, and every glam moment in between.
            </p>
          </header>

          <Section title="About you">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="First name *"
                value={form.firstName}
                onChange={(v) => setForm({ ...form, firstName: v })}
              />

              <Input
                label="Last name *"
                value={form.lastName}
                onChange={(v) => setForm({ ...form, lastName: v })}
              />
            </div>

            <Input
              label="Phone number *"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />

            <Input
              label="Email address *"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />

            <Input
              label="Password *"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
          </Section>

          <Section title="Your glam details">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Event date"
                type="date"
                value={form.eventDate}
                onChange={(v) => setForm({ ...form, eventDate: v })}
              />

              <Input
                label="Event location"
                value={form.eventLocation}
                onChange={(v) => setForm({ ...form, eventLocation: v })}
              />
            </div>

            <Select
              label="Makeup type"
              value={form.makeupType}
              options={MAKEUP_TYPES}
              onChange={(v) => setForm({ ...form, makeupType: v })}
            />
          </Section>

          <Section title="Pick your vibe">
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => addMood(mood)}
                  className="rounded-full border border-[#eadff5] bg-white px-4 py-2 text-sm transition hover:border-purple-400 hover:bg-[#f7efff]"
                >
                  {mood}
                </button>
              ))}
            </div>

            <Textarea
              label="Tell us what you like"
              value={form.preferences}
              placeholder="Example: soft glam, glowing skin, no heavy eyes..."
              onChange={(v) => setForm({ ...form, preferences: v })}
            />
          </Section>

          <label className="mt-6 flex items-center gap-3 rounded-2xl bg-[#fff7fb] p-4 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />

            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-purple-700 underline">
                Terms & Conditions
              </Link>
            </span>
          </label>

          {error && (
            <p className="mt-5 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="mt-7 w-full rounded-full bg-purple-600 py-4 text-sm text-white transition hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="mt-5 text-center text-sm text-[#6f6077]">
            Are you a makeup artist?{" "}
            <Link href="/register/mua" className="text-purple-700 underline">
              Join as an artist
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-[1.75rem] border border-[#eadff5] bg-[#fffafc] p-5">
      <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-purple-700">
        {title}
      </h2>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-[#554a5c]">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={label.includes("*")}
        className="w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-[#554a5c]">{label}</label>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-28 w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-[#554a5c]">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
      >
        <option value="">Select</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}