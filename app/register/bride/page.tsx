"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterBride() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    setLoading(true);
    setError(null);

    // 1️⃣ Sign up
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2️⃣ Sign in
    await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    // 3️⃣ Get user
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setError("Authentication failed");
      setLoading(false);
      return;
    }

    // 4️⃣ Insert profile
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
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard/bride");
  };

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-24">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-20 animate-fade-in-up"
      >
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-light">
            Let’s get you glammed ✨
          </h1>
          <p className="text-sm text-gray-500">
            Create your account and find your perfect makeup artist
          </p>
        </header>

        <Section title="Your details">
          <Input label="First name *" onChange={(v) => setForm({ ...form, firstName: v })} />
          <Input label="Last name *" onChange={(v) => setForm({ ...form, lastName: v })} />
          <Input label="Phone number *" onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Email address *" type="email" onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Password *" type="password" onChange={(v) => setForm({ ...form, password: v })} />
        </Section>

        <Section title="Your event">
          <Input label="Event date" type="date" onChange={(v) => setForm({ ...form, eventDate: v })} />
          <Input label="Event location" onChange={(v) => setForm({ ...form, eventLocation: v })} />
          <Select
            label="Makeup type"
            options={["Bridal makeup", "Engagement makeup", "Soiree makeup"]}
            onChange={(v) => setForm({ ...form, makeupType: v })}
          />
        </Section>

        <Section title="Makeup preferences">
          <Textarea
            label="Tell us what look you love"
            onChange={(v) => setForm({ ...form, preferences: v })}
          />
        </Section>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I agree to the Terms & Conditions
        </label>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-full tracking-wide hover:opacity-90 transition"
        >
          {loading ? "Creating account..." : "Let’s get you ready"}
        </button>
      </form>
    </main>
  );
}

/* ---------- UI ---------- */

function Section({ title, children }: any) {
  return (
    <section className="bg-white rounded-2xl p-8 space-y-6 shadow-sm">
      <h2 className="text-sm tracking-wide text-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, type = "text", onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}</label>
      <input
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-black transition"
        required={label.includes("*")}
      />
    </div>
  );
}

function Textarea({ label, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}</label>
      <textarea
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl h-28 text-sm focus:border-black transition"
      />
    </div>
  );
}

function Select({ label, options, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}</label>
      <select
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black transition"
      >
        <option value="">Select</option>
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
