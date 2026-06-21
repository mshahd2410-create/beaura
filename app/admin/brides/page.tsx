"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Search, X } from "lucide-react";

type Bride = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  event_date: string | null;
  event_location: string | null;
  makeup_type: string | null;
  preferences: string | null;
  created_at: string;
  status: string | null;
};

type StatusFilter = "all" | "active" | "suspended";

export default function AdminBridesPage() {
  const [brides, setBrides] = useState<Bride[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedBride, setSelectedBride] = useState<Bride | null>(null);

  useEffect(() => {
    loadBrides();
  }, []);

  async function loadBrides() {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("bride_profiles")
      .select(
        "id, first_name, last_name, phone, email, event_date, event_location, makeup_type, preferences, created_at, status"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BRIDES LOAD ERROR:", error);
      setLoadError(error.message);
      setBrides([]);
    } else {
      console.log("BRIDES DATA:", data);
      setBrides((data as Bride[]) || []);
    }

    setLoading(false);
  }

  async function toggleStatus(id: string, currentStatus: string | null) {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";

    const { error } = await supabase
      .from("bride_profiles")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setBrides((prev) =>
      prev.map((bride) =>
        bride.id === id ? { ...bride, status: newStatus } : bride
      )
    );

    if (selectedBride?.id === id) {
      setSelectedBride({ ...selectedBride, status: newStatus });
    }
  }

  const filteredBrides = useMemo(() => {
    const query = search.toLowerCase();

    return brides.filter((bride) => {
      const fullName = `${bride.first_name || ""} ${
        bride.last_name || ""
      }`.toLowerCase();

      const status = bride.status || "active";

      const matchesSearch =
        fullName.includes(query) ||
        (bride.email || "").toLowerCase().includes(query) ||
        (bride.phone || "").toLowerCase().includes(query) ||
        (bride.event_location || "").toLowerCase().includes(query) ||
        (bride.makeup_type || "").toLowerCase().includes(query);

      return matchesSearch && (filter === "all" || status === filter);
    });
  }, [brides, search, filter]);

  const totalBrides = brides.length;
  const activeCount = brides.filter(
    (bride) => (bride.status || "active") === "active"
  ).length;
  const suspendedCount = brides.filter(
    (bride) => bride.status === "suspended"
  ).length;
  const eventCount = brides.filter((bride) => bride.event_date).length;

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  function getPrefs(bride: Bride) {
    return bride.preferences || "No preferences provided.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          client management
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Clients
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          View client accounts, contact details, event preferences, and account
          status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total clients" value={totalBrides} />
        <Stat label="Active" value={activeCount} />
        <Stat label="Suspended" value={suspendedCount} />
        <Stat label="With event date" value={eventCount} />
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">Could not load bride profiles.</p>
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
              placeholder="Search by name, email, phone, or location..."
              className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
            {(["all", "active", "suspended"] as StatusFilter[]).map(
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
          Loading clients...
        </div>
      ) : filteredBrides.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No clients found.
          </h2>

          <p className="mt-3 text-sm text-[#6f6077]">
            If you registered a bride and still see this, check Supabase table
            data and RLS policies.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredBrides.map((bride) => {
            const fullName =
              `${bride.first_name || ""} ${bride.last_name || ""}`.trim() ||
              "Unnamed client";

            const status = bride.status || "active";

            return (
              <article
                key={bride.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em]">
                      {fullName}
                    </h2>

                    <p className="mt-1 text-sm text-[#6f6077]">
                      Joined {formatDate(bride.created_at)}
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
                  <Info label="Email" value={bride.email || "—"} />
                  <Info label="Phone" value={bride.phone || "—"} />
                  <Info label="Event" value={formatDate(bride.event_date)} />
                  <Info label="Makeup type" value={bride.makeup_type || "—"} />
                </div>

                <p className="mt-5 rounded-2xl bg-[#fffafc] p-4 text-sm leading-6 text-[#6f6077]">
                  {getPrefs(bride)}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBride(bride)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2 text-sm"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStatus(bride.id, bride.status)}
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

      {selectedBride && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setSelectedBride(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadff5] bg-white px-5 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                  client details
                </p>

                <h2 className="mt-1 text-2xl font-light tracking-[-0.05em]">
                  {`${selectedBride.first_name || ""} ${
                    selectedBride.last_name || ""
                  }`.trim() || "Unnamed client"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBride(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <Section title="Personal information">
                <Detail
                  label="Full name"
                  value={
                    `${selectedBride.first_name || ""} ${
                      selectedBride.last_name || ""
                    }`.trim() || "Unnamed"
                  }
                />
                <Detail label="Email" value={selectedBride.email || "—"} />
                <Detail label="Phone" value={selectedBride.phone || "—"} />
                <Detail
                  label="Status"
                  value={selectedBride.status || "active"}
                />
              </Section>

              <Section title="Event information">
                <Detail
                  label="Event date"
                  value={formatDate(selectedBride.event_date)}
                />
                <Detail
                  label="Event location"
                  value={selectedBride.event_location || "—"}
                />
                <Detail
                  label="Makeup type"
                  value={selectedBride.makeup_type || "—"}
                />
                <Detail
                  label="Preferences"
                  value={getPrefs(selectedBride)}
                  large
                />
              </Section>

              <div className="pb-6">
                <button
                  type="button"
                  onClick={() =>
                    toggleStatus(selectedBride.id, selectedBride.status)
                  }
                  className="rounded-full border border-red-200 px-5 py-3 text-sm font-medium text-red-600"
                >
                  {selectedBride.status === "suspended"
                    ? "Reactivate client"
                    : "Suspend client"}
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