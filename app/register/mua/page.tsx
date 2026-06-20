"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const EGYPT_GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Qalyubia",
  "Port Said",
  "Suez",
  "Damietta",
  "Dakahlia",
  "Sharqia",
  "Kafr El Sheikh",
  "Gharbia",
  "Monufia",
  "Beheira",
  "Ismailia",
  "Fayoum",
  "Beni Suef",
  "Minya",
  "Asyut",
  "Sohag",
  "Qena",
  "Luxor",
  "Aswan",
  "Red Sea",
  "New Valley",
  "Matrouh",
  "North Sinai",
  "South Sinai",
];

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Experienced", "Advanced"];

export default function RegisterMUA() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    instagram: "",
    bio: "",
    experience: "",
    cities: [] as string[],
    services: {
      bridal: { price: "", duration: 90 },
      engagement: { price: "", duration: 75 },
      soiree: { price: "", duration: 60 },
    },
  });

  const toggleCity = (city: string) => {
    setForm((prev) => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter((c) => c !== city)
        : [...prev.cities, city],
    }));
  };

  const calculateNet = (price: string) => {
    const value = Number(price);
    if (!value) return "";
    return Math.round(value * 0.9).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      setError("You must agree to the terms & conditions");
      return;
    }

    if (portfolio.length < 5 || portfolio.length > 25) {
      setError("Please upload between 5 and 25 portfolio images");
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Authentication failed");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("mua_profiles").insert({
      id: user.id,
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
      instagram: form.instagram,
      bio: form.bio,
      experience: form.experience,
      cities: form.cities,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const servicesToInsert = [];

    if (form.services.bridal.price) {
      servicesToInsert.push({
        mua_id: user.id,
        name: "Bridal makeup",
        price: Number(form.services.bridal.price),
        duration_minutes: form.services.bridal.duration,
      });
    }

    if (form.services.engagement.price) {
      servicesToInsert.push({
        mua_id: user.id,
        name: "Engagement makeup",
        price: Number(form.services.engagement.price),
        duration_minutes: form.services.engagement.duration,
      });
    }

    if (form.services.soiree.price) {
      servicesToInsert.push({
        mua_id: user.id,
        name: "Soiree makeup",
        price: Number(form.services.soiree.price),
        duration_minutes: form.services.soiree.duration,
      });
    }

    if (servicesToInsert.length > 0) {
      const { error: servicesError } = await supabase
        .from("mua_services")
        .insert(servicesToInsert);

      if (servicesError) {
        setError(servicesError.message);
        setLoading(false);
        return;
      }
    }

    for (const file of portfolio) {
      const uniqueName =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const path = `${user.id}/${uniqueName}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("mua-portfolio")
        .upload(path, file);

      if (uploadError) continue;

      await supabase.from("mua_portfolio").insert({
        mua_id: user.id,
        image_path: path,
      });
    }

    router.push("/dashboard/mua");
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
              artist signup
            </p>

            <h1 className="text-4xl font-light tracking-[-0.06em] md:text-5xl">
              Build your Beaura profile.
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#6f6077]">
              Show your work, add your services, choose your cities, and apply
              to become visible to clients on Beaura.
            </p>
          </header>

          <Section title="Your details">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="First name *" onChange={(v) => setForm({ ...form, firstName: v })} />
              <Input label="Last name *" onChange={(v) => setForm({ ...form, lastName: v })} />
            </div>

            <Input label="Phone number *" onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Email *" type="email" onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Password *" type="password" onChange={(v) => setForm({ ...form, password: v })} />
          </Section>

          <Section title="Where do you work?">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {EGYPT_GOVERNORATES.map((city) => (
                <button
                  type="button"
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={
                    "rounded-full px-3 py-2 text-xs transition " +
                    (form.cities.includes(city)
                      ? "bg-purple-600 text-white"
                      : "border border-[#eadff5] bg-white hover:border-purple-400")
                  }
                >
                  {city}
                </button>
              ))}
            </div>
          </Section>

          <Section title="About your artistry">
            <Input label="Instagram link *" onChange={(v) => setForm({ ...form, instagram: v })} />
            <Textarea label="Short bio" onChange={(v) => setForm({ ...form, bio: v })} />

            <Select
              label="Experience level"
              options={EXPERIENCE_LEVELS}
              onChange={(v) => setForm({ ...form, experience: v })}
            />
          </Section>

          <Section title="Portfolio">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => setPortfolio(Array.from(e.target.files || []))}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border border-[#eadff5] bg-white py-4 text-sm transition hover:border-purple-500 hover:bg-[#f7efff]"
            >
              Add portfolio photos
            </button>

            <p className="text-xs text-[#6f6077]">
              {portfolio.length} selected • Upload 5–25 images
            </p>
          </Section>

          <Section title="Services and pricing">
            {(
              [
                ["bridal", "Bridal makeup"],
                ["engagement", "Engagement makeup"],
                ["soiree", "Soiree makeup"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="rounded-2xl bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_110px_130px] md:items-center">
                  <span className="text-sm">{label}</span>

                  <input
                    placeholder="EGP"
                    className="rounded-xl border border-[#eadff5] px-3 py-2 text-sm outline-none focus:border-purple-500"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        services: {
                          ...form.services,
                          [key]: {
                            ...form.services[key],
                            price: e.target.value,
                          },
                        },
                      })
                    }
                  />

                  <select
                    className="rounded-xl border border-[#eadff5] px-3 py-2 text-sm outline-none focus:border-purple-500"
                    value={form.services[key].duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        services: {
                          ...form.services,
                          [key]: {
                            ...form.services[key],
                            duration: Number(e.target.value),
                          },
                        },
                      })
                    }
                  >
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={75}>75 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>

                {form.services[key].price && (
                  <p className="mt-3 text-xs text-purple-700">
                    You receive EGP {calculateNet(form.services[key].price)}
                  </p>
                )}
              </div>
            ))}
          </Section>

          <label className="mt-6 flex items-center gap-3 rounded-2xl bg-[#fff7fb] p-4 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
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
            {loading ? "Creating account..." : "Submit artist application"}
          </button>

          <p className="mt-5 text-center text-sm text-[#6f6077]">
            Looking for a makeup artist?{" "}
            <Link href="/register/bride" className="text-purple-700 underline">
              Create a client account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  onChange,
}: {
  label: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-[#554a5c]">{label}</label>
      <input
        type={type}
        onChange={(e) => onChange(e.target.value)}
        required={label.includes("*")}
        className="w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
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
    <div>
      <label className="mb-2 block text-sm text-[#554a5c]">{label}</label>
      <textarea
        onChange={(e) => onChange(e.target.value)}
        className="h-28 w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
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
    <div>
      <label className="mb-2 block text-sm text-[#554a5c]">{label}</label>
      <select
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}