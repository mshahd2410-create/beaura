"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const EGYPT_CITIES = [
  "Cairo","Giza","Alexandria","Dakahlia","Sharqia","Gharbia",
  "Monufia","Beheira","Kafr El Sheikh","Fayoum","Beni Suef",
  "Minya","Asyut","Sohag","Qalyubia",
];

type Service = {
  id: string;
  name: string;
  price: number;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profileData } = await supabase
      .from("mua_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: servicesData } = await supabase
      .from("mua_services")
      .select("*")
      .eq("mua_id", user.id);

    setProfile(profileData);
    setCities(profileData?.cities || []);
    setServices(servicesData || []);
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
    setSaving(true);

    await supabase
      .from("mua_profiles")
      .update({ cities })
      .eq("id", profile.id);

    for (const service of services) {
      await supabase
        .from("mua_services")
        .update({ price: service.price })
        .eq("id", service.id);
    }

    setSaving(false);
  }

  if (loading) return <p>Loading settings…</p>;

  return (
    <div className="space-y-10 max-w-3xl">
      <h1 className="text-2xl font-light">Settings</h1>

      {/* PERSONAL INFO */}
      <Section title="Personal information">
        <ReadOnly label="Name" value={`${profile.first_name} ${profile.last_name}`} />
        <ReadOnly label="Email" value={profile.email} />
      </Section>

      {/* CITIES */}
      <Section title="Where you work">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EGYPT_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => toggleCity(city)}
              className={`rounded-full px-4 py-2 text-sm border transition ${
                cities.includes(city)
                  ? "bg-black text-white"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </Section>

      {/* SERVICES */}
      <Section title="Services & pricing">
        <div className="space-y-4">
          {services.map((service, i) => (
            <div
              key={service.id}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm">{service.name}</span>
              <input
                type="number"
                value={service.price}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i].price = Number(e.target.value);
                  setServices(updated);
                }}
                className="w-32 px-3 py-2 border rounded-lg text-sm"
                placeholder="EGP"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* PAYOUTS */}
      <Section title="Payout method">
        <div className="border rounded-xl p-6 text-center text-sm text-gray-500">
          💳 Payout card integration coming soon
        </div>
      </Section>

      {/* SAVE */}
      <button
        onClick={saveChanges}
        disabled={saving}
        className="bg-black text-white px-8 py-3 rounded-full text-sm hover:opacity-90 transition"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
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
    <section className="bg-white rounded-2xl p-8 space-y-6 shadow-sm">
      <h2 className="text-sm tracking-wide text-gray-800">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ReadOnly({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        value={value}
        disabled
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-700"
      />
    </div>
  );
}