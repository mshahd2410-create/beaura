"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type BrideForm = {
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

export default function RegisterBride() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState<BrideForm>({
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!agreed) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setError("Authentication failed");
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
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.replace("/bride/home");
  };

  return (
    <main className="min-h-screen bg-white px-4 py-24 text-black">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-20"
      >
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-medium">
            Let’s get you glammed ✨
          </h1>
          <p className="text-sm text-gray-700">
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

        <label className="flex items-center gap-3 text-sm text-black">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I agree to the Terms & Conditions
        </label>

        {error && <p className="text-red-600 text-center">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-purple-600 text-white py-4 rounded-full tracking-wide hover:bg-purple-700 transition"
        >
          {loading ? "Creating account..." : "Let’s get you ready"}
        </button>
      </form>
    </main>
  );
}

/* ---------- UI ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6">
      <h2 className="text-sm font-medium text-black">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Input({
  label,
  type = "text",
  onChange,
}: {
  label: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-black">
        {label}
      </label>
      <input
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-black outline-none focus:border-purple-600 transition"
        required={label.includes("*")}
      />
    </div>
  );
}

function Textarea({
  label,
  onChange,
}: {
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-black">
        {label}
      </label>
      <textarea
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl h-28 text-sm text-black focus:border-purple-600 transition"
      />
    </div>
  );
}

function Select({
  label,
  options,
  onChange,
}: {
  label: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-black">
        {label}
      </label>
      <select
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-black focus:border-purple-600 transition"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}