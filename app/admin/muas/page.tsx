"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Search, X } from "lucide-react";

type Mua = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  bio: string | null;
  cities: string[] | null;
  instagram: string | null;
  created_at: string;
  experience: string | null;
  phone: string | null;
  verified: boolean | null;
  status: string | null;
  beaura_tier: string | null;
};

type StatusFilter = "all" | "verified" | "pending" | "suspended";

export default function AdminMuasPage() {
  const [muas, setMuas] = useState<Mua[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedMua, setSelectedMua] = useState<Mua | null>(null);

  useEffect(() => {
    loadMuas();
  }, []);

  async function loadMuas() {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("mua_profiles")
      .select(
        "id, first_name, last_name, email, bio, cities, instagram, created_at, experience, phone, verified, status, beaura_tier"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("MUAS LOAD ERROR:", error);
      setLoadError(error.message);
      setMuas([]);
    } else {
      console.log("MUAS DATA:", data);
      setMuas((data as Mua[]) || []);
    }

    setLoading(false);
  }

  async function toggleVerification(id: string, currentValue: boolean | null) {
    const newValue = !currentValue;

    const { error } = await supabase
      .from("mua_profiles")
      .update({ verified: newValue })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setMuas((prev) =>
      prev.map((mua) =>
        mua.id === id ? { ...mua, verified: newValue } : mua
      )
    );

    if (selectedMua?.id === id) {
      setSelectedMua({ ...selectedMua, verified: newValue });
    }
  }

  async function toggleStatus(id: string, currentStatus: string | null) {
    const status = currentStatus || "active";
    const newStatus = status === "suspended" ? "active" : "suspended";

    const { error } = await supabase
      .from("mua_profiles")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setMuas((prev) =>
      prev.map((mua) =>
        mua.id === id ? { ...mua, status: newStatus } : mua
      )
    );

    if (selectedMua?.id === id) {
      setSelectedMua({ ...selectedMua, status: newStatus });
    }
  }

  const filteredMuas = useMemo(() => {
    const query = search.toLowerCase();

    return muas.filter((mua) => {
      const fullName = `${mua.first_name || ""} ${
        mua.last_name || ""
      }`.toLowerCase();

      const email = (mua.email || "").toLowerCase();
      const phone = (mua.phone || "").toLowerCase();
      const instagram = (mua.instagram || "").toLowerCase();
      const cities = (mua.cities || []).join(", ").toLowerCase();
      const status = mua.status || "active";

      const matchesSearch =
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        instagram.includes(query) ||
        cities.includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "verified" && !!mua.verified) ||
        (filter === "pending" && !mua.verified) ||
        (filter === "suspended" && status === "suspended");

      return matchesSearch && matchesFilter;
    });
  }, [muas, search, filter]);

  const totalMuas = muas.length;
  const verifiedCount = muas.filter((mua) => !!mua.verified).length;
  const pendingCount = muas.filter((mua) => !mua.verified).length;
  const suspendedCount = muas.filter(
    (mua) => mua.status === "suspended"
  ).length;

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  function getFullName(mua: Mua) {
    return (
      `${mua.first_name || ""} ${mua.last_name || ""}`.trim() ||
      "Unnamed artist"
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          artist management
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Makeup Artists
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Manage MUA profiles, contact details, verification, status, cities,
          and Beaura tier.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total MUAs" value={totalMuas} />
        <Stat label="Verified" value={verifiedCount} />
        <Stat label="Pending" value={pendingCount} />
        <Stat label="Suspended" value={suspendedCount} />
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">Could not load MUA profiles.</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
              size={17}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, city, or Instagram..."
              className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
            {(["all", "verified", "pending", "suspended"] as StatusFilter[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm capitalize ${
                    filter === value
                      ? "bg-[#171018] text-white"
                      : "text-[#6f6077] hover:bg-[#f7efff]"
                  }`}
                >
                  {value}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading makeup artists...
        </div>
      ) : filteredMuas.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No makeup artists found.
          </h2>

          <p className="mt-3 text-sm text-[#6f6077]">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredMuas.map((mua) => {
            const fullName = getFullName(mua);
            const status = mua.status || "active";

            return (
              <article
                key={mua.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
                      {fullName}
                    </h2>

                    <p className="mt-1 text-sm text-[#6f6077]">
                      Joined {formatDate(mua.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      status === "suspended"
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[#6f6077] sm:grid-cols-2">
                  <Info label="Email" value={mua.email || "—"} />
                  <Info label="Phone" value={mua.phone || "—"} />
                  <Info
                    label="Cities"
                    value={mua.cities?.join(", ") || "—"}
                  />
                  <Info
                    label="Instagram"
                    value={mua.instagram ? `@${mua.instagram}` : "—"}
                  />
                  <Info label="Experience" value={mua.experience || "—"} />
                  <Info label="Tier" value={mua.beaura_tier || "standard"} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      mua.verified
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {mua.verified ? "Verified" : "Pending verification"}
                  </span>
                </div>

                <p className="mt-5 rounded-2xl bg-[#fffafc] p-4 text-sm leading-6 text-[#6f6077]">
                  {mua.bio || "No bio provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMua(mua)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2 text-sm"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleVerification(mua.id, mua.verified)}
                    className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700"
                  >
                    {mua.verified ? "Unverify" : "Verify"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStatus(mua.id, mua.status)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
                  >
                    {status === "suspended" ? "Reactivate" : "Suspend"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedMua && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setSelectedMua(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadff5] bg-white px-5 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                  artist details
                </p>

                <h2 className="mt-1 text-2xl font-light tracking-[-0.05em] text-[#171018]">
                  {getFullName(selectedMua)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMua(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <Section title="Personal information">
                <Detail label="Full name" value={getFullName(selectedMua)} />
                <Detail label="Email" value={selectedMua.email || "—"} />
                <Detail label="Phone" value={selectedMua.phone || "—"} />
                <Detail
                  label="Instagram"
                  value={
                    selectedMua.instagram ? `@${selectedMua.instagram}` : "—"
                  }
                />
                <Detail
                  label="Cities"
                  value={selectedMua.cities?.join(", ") || "—"}
                />
                <Detail
                  label="Bio"
                  value={selectedMua.bio || "No bio provided."}
                  large
                />
              </Section>

              <Section title="Professional information">
                <Detail
                  label="Experience"
                  value={selectedMua.experience || "—"}
                />
                <Detail
                  label="Beaura tier"
                  value={selectedMua.beaura_tier || "standard"}
                />
                <Detail
                  label="Verification"
                  value={selectedMua.verified ? "Verified" : "Pending"}
                />
                <Detail
                  label="Status"
                  value={selectedMua.status || "active"}
                />
                <Detail
                  label="Joined"
                  value={formatDate(selectedMua.created_at)}
                />
              </Section>

              <div className="flex flex-wrap gap-3 pb-6">
                <button
                  type="button"
                  onClick={() =>
                    toggleVerification(selectedMua.id, selectedMua.verified)
                  }
                  className="rounded-full border border-purple-200 px-5 py-3 text-sm font-medium text-purple-700"
                >
                  {selectedMua.verified ? "Unverify artist" : "Verify artist"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleStatus(selectedMua.id, selectedMua.status)
                  }
                  className="rounded-full border border-red-200 px-5 py-3 text-sm font-medium text-red-600"
                >
                  {selectedMua.status === "suspended"
                    ? "Reactivate artist"
                    : "Suspend artist"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <h2 className="mt-3 text-4xl font-light tracking-[-0.06em] text-[#171018]">
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#eadff5] bg-[#fffafc] p-5">
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-purple-700">
        {title}
      </h3>

      {children}
    </section>
  );
}

function Detail({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <p
        className={`mt-1 text-sm leading-7 text-[#171018] ${
          large ? "" : "break-all"
        }`}
      >
        {value}
      </p>
    </div>
  );
}