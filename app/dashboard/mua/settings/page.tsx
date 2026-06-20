"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Instagram, MapPin, Phone, Sparkles } from "lucide-react";

const EGYPT_GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Fayoum",
  "Gharbia",
  "Ismailia",
  "Monufia",
  "Minya",
  "Qalyubia",
  "New Valley",
  "Suez",
  "Aswan",
  "Assiut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharkia",
  "South Sinai",
  "Kafr El Sheikh",
  "Matrouh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag",
];

type MuaProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  bio: string | null;
  experience: string | null;
  cities: string[] | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<MuaProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("mua_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setPhone(data.phone || "");
      setInstagram(data.instagram || "");
      setBio(data.bio || "");
      setExperience(data.experience || "");
      setCities(data.cities || []);
    }

    setLoading(false);
  }

  function toggleCity(city: string) {
    setCities((prev) =>
      prev.includes(city)
        ? prev.filter((c) => c !== city)
        : [...prev, city]
    );
  }

  async function saveChanges() {
    if (!profile) return;

    setSaving(true);

    await supabase
      .from("mua_profiles")
      .update({
        phone,
        instagram,
        bio,
        experience,
        cities,
      })
      .eq("id", profile.id);

    setSaving(false);
  }

  const completion = useMemo(() => {
    const checks = [
      !!phone,
      !!instagram,
      !!bio,
      !!experience,
      cities.length > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [phone, instagram, bio, experience, cities]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-36 animate-pulse rounded-[2rem] bg-white" />
        <div className="h-[520px] animate-pulse rounded-[2rem] bg-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-8 text-sm text-[#6f6077]">
        Couldn’t load your profile.
      </div>
    );
  }

  const fullName =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    "Artist";

  return (
    <main className="space-y-6">
      {/* TOP PROFILE STRIP */}
      <section className="overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-[#171018] p-7 text-white sm:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              profile settings
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-[-0.07em]">
              Keep your artist profile polished.
            </h1>

            <p className="mt-4 text-sm leading-7 text-white/60">
              This is where you update the details clients see before they
              decide to book you.
            </p>

            <div className="mt-8 rounded-[1.5rem] bg-white/8 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Profile completion</span>
                <span>{completion}%</span>
              </div>

              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-white"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                  your profile
                </p>

                <h2 className="mt-2 text-3xl font-light tracking-[-0.05em] text-[#171018]">
                  {fullName}
                </h2>

                <p className="mt-2 text-sm text-[#6f6077]">
                  {profile.email || "No email saved"}
                </p>
              </div>

              <button
                onClick={saveChanges}
                disabled={saving}
                className="h-12 rounded-full bg-[#171018] px-7 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <ProfileMiniCard icon={<Phone size={16} />} label="Phone" value={phone || "Missing"} />
              <ProfileMiniCard icon={<Instagram size={16} />} label="Instagram" value={instagram || "Missing"} />
              <ProfileMiniCard icon={<MapPin size={16} />} label="Cities" value={`${cities.length} selected`} />
            </div>
          </div>
        </div>
      </section>

      {/* MAIN FORM */}
      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <Card title="Account details" subtitle="Your name and email are fixed for security.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Full name" value={fullName} />
              <ReadOnlyField label="Email" value={profile.email || ""} />
            </div>
          </Card>

          <Card title="Public profile" subtitle="These details help clients understand your style.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Phone number"
                value={phone}
                onChange={setPhone}
                placeholder="01XXXXXXXXX"
              />

              <Field
                label="Instagram"
                value={instagram}
                onChange={setInstagram}
                placeholder="@yourhandle"
              />

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
                  Experience level
                </label>

                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm text-[#171018] outline-none transition focus:border-purple-500"
                >
                  <option value="">Select experience level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Experienced">Experienced</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
                  Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  placeholder="Tell clients about your style, your specialties, and what it’s like to work with you."
                  className="w-full rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] px-4 py-4 text-sm leading-6 text-[#171018] outline-none transition focus:border-purple-500"
                />
              </div>
            </div>
          </Card>
        </div>

        <Card
          title="Areas you work in"
          subtitle="Pick the governorates where clients can book you."
        >
          <div className="flex flex-wrap gap-2">
            {EGYPT_GOVERNORATES.map((city) => {
              const active = cities.includes(city);

              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleCity(city)}
                  className={`rounded-full px-4 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#171018] text-white"
                      : "border border-[#eadff5] bg-[#fffafc] text-[#6f6077] hover:border-purple-300 hover:text-purple-700"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-[#f7efff] p-5">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 text-purple-700" />
              <p className="text-sm leading-6 text-[#6f6077]">
                Choose only places you can realistically serve. This keeps your
                bookings smoother and avoids last-minute travel issues.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* MOBILE SAVE */}
      <div className="sticky bottom-4 z-20 lg:hidden">
        <button
          onClick={saveChanges}
          disabled={saving}
          className="h-12 w-full rounded-full bg-[#171018] text-sm font-medium text-white shadow-xl transition disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </main>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-medium tracking-[-0.03em] text-[#171018]">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#6f6077]">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ProfileMiniCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
      <div className="flex items-center gap-2 text-purple-700">
        {icon}
        <span className="text-xs uppercase tracking-[0.15em]">{label}</span>
      </div>
      <p className="mt-3 truncate text-sm text-[#171018]">{value}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
        {label}
      </label>
      <input
        value={value}
        disabled
        className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#f7f3fa] px-4 text-sm text-[#6f6077]"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm text-[#171018] outline-none transition focus:border-purple-500"
      />
    </div>
  );
}