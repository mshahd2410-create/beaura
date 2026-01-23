"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const EGYPT_CITIES = [
  "Cairo","Giza","Alexandria","Dakahlia","Sharqia","Gharbia",
  "Monufia","Beheira","Kafr El Sheikh","Fayoum","Beni Suef",
  "Minya","Asyut","Sohag","Qalyubia",
];

export default function RegisterMUA() {
  const router = useRouter();
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
      bridal: "",
      engagement: "",
      soiree: "",
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Authentication failed");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("mua_profiles")
      .insert({
        id: user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        instagram: form.instagram,
        bio: form.bio,
        cities: form.cities,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const servicesToInsert: {
      mua_id: string;
      name: string;
      price: number;
      duration_minutes: number;
    }[] = [];

    if (form.services.bridal) {
      servicesToInsert.push({
        mua_id: user.id,
        name: "Bridal makeup",
        price: Number(form.services.bridal),
        duration_minutes: 90,
      });
    }

    if (form.services.engagement) {
      servicesToInsert.push({
        mua_id: user.id,
        name: "Engagement makeup",
        price: Number(form.services.engagement),
        duration_minutes: 75,
      });
    }

    if (form.services.soiree) {
      servicesToInsert.push({
        mua_id: user.id,
        name: "Soiree makeup",
        price: Number(form.services.soiree),
        duration_minutes: 60,
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
      const path = `${user.id}/${crypto.randomUUID()}`;

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
    <main className="min-h-screen bg-white px-4 py-24 text-black">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-20"
      >
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-medium">
            Join Beaura as an Artist 💄
          </h1>
          <p className="text-sm text-gray-700">
            Elegant bookings. Real protection. More clients.
          </p>
        </header>

        <Section title="Personal information">
          <Input label="First name *" onChange={(v) => setForm({ ...form, firstName: v })} />
          <Input label="Last name *" onChange={(v) => setForm({ ...form, lastName: v })} />
          <Input label="Phone number *" onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Email *" type="email" onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Password *" type="password" onChange={(v) => setForm({ ...form, password: v })} />
        </Section>

        <Section title="Where do you work?">
          <div className="grid grid-cols-2 gap-3">
            {EGYPT_CITIES.map((city) => (
              <button
                type="button"
                key={city}
                onClick={() => toggleCity(city)}
                className={`rounded-full px-4 py-2 text-sm border transition ${
                  form.cities.includes(city)
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-gray-300 text-black"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </Section>

        <Section title="About you">
          <Input label="Instagram link *" onChange={(v) => setForm({ ...form, instagram: v })} />
          <Textarea label="Short bio" onChange={(v) => setForm({ ...form, bio: v })} />
          <Input label="Experience level" onChange={(v) => setForm({ ...form, experience: v })} />
        </Section>

        <Section title="Show us your amazing work ✨">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setPortfolio(Array.from(e.target.files || []))}
            className="text-sm text-black"
          />
          <p className="text-xs text-gray-700">Upload 5–25 images</p>
        </Section>

        <Section title="Your services">
          {["bridal", "engagement", "soiree"].map((key) => (
            <div key={key} className="space-y-1">
              <Price
                label={`${key.charAt(0).toUpperCase() + key.slice(1)} makeup`}
                onChange={(v) =>
                  setForm({
                    ...form,
                    services: { ...form.services, [key]: v },
                  })
                }
              />
              {form.services[key as keyof typeof form.services] && (
                <p className="text-xs text-gray-700 ml-auto w-32">
                  You receive EGP{" "}
                  {calculateNet(form.services[key as keyof typeof form.services])}
                </p>
              )}
            </div>
          ))}
        </Section>

        <div className="flex items-center gap-2 text-sm text-black">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <span>I agree to the Terms & Conditions</span>
        </div>

        {error && <p className="text-red-600 text-center">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-purple-600 text-white py-4 rounded-full tracking-wide hover:bg-purple-700 transition"
        >
          {loading ? "Creating account..." : "Let’s get your clients ready"}
        </button>
      </form>
    </main>
  );
}

/* ---------- UI COMPONENTS ---------- */

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
        required
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

function Price({
  label,
  onChange,
}: {
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex-1 text-sm text-black">
        {label}
      </span>
      <input
        placeholder="EGP"
        onChange={(e) => onChange(e.target.value)}
        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:border-purple-600 transition"
      />
    </div>
  );
}