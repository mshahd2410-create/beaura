"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Bride = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  event_date: string | null;
  event_location: string | null;
  makeup_type: string | null;
  preference: string | null;
  created_at: string;
  status: string | null;
};

type StatusFilter = "all" | "active" | "suspended";

export default function AdminBridesPage() {
  const [brides, setBrides] = useState<Bride[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedBride, setSelectedBride] = useState<Bride | null>(null);

  useEffect(() => {
    loadBrides();
  }, []);

  async function loadBrides() {
    setLoading(true);

    const { data, error } = await supabase
      .from("bride_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BRIDES LOAD ERROR:", error);
    } else {
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
      console.error("BRIDE STATUS UPDATE ERROR:", error);
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
    return brides.filter((bride) => {
      const fullName = `${bride.first_name || ""} ${
        bride.last_name || ""
      }`.toLowerCase();

      const query = search.toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        (bride.email || "").toLowerCase().includes(query) ||
        (bride.phone || "").toLowerCase().includes(query) ||
        (bride.event_location || "").toLowerCase().includes(query);

      const status = bride.status || "active";

      const matchesFilter = filter === "all" || status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [brides, search, filter]);

  const totalBrides = brides.length;
  const activeCount = brides.filter((b) => (b.status || "active") === "active").length;
  const suspendedCount = brides.filter((b) => b.status === "suspended").length;
  const eventCount = brides.filter((b) => b.event_date).length;

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  return (
    <main className="min-h-screen bg-[#FAF8FF] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Brides</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage bride accounts, event details, and account status.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4 mb-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Brides</p>
          <h2 className="mt-3 text-3xl font-semibold">{totalBrides}</h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active</p>
          <h2 className="mt-3 text-3xl font-semibold text-green-600">
            {activeCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Suspended</p>
          <h2 className="mt-3 text-3xl font-semibold text-red-500">
            {suspendedCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">With Event Date</p>
          <h2 className="mt-3 text-3xl font-semibold text-purple-600">
            {eventCount}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or location..."
            className="w-full md:max-w-md h-12 rounded-2xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="flex flex-wrap gap-2">
            {["all", "active", "suspended"].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value as StatusFilter)}
                className={`px-4 py-2 rounded-full text-sm capitalize transition ${
                  filter === value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading brides...
          </div>
        ) : filteredBrides.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-gray-700">
              No brides found
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">Bride</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Event</th>
                  <th className="px-6 py-4 font-medium">Makeup Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBrides.map((bride) => (
                  <tr
                    key={bride.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-6 py-5">
                      <p className="font-medium text-gray-900">
                        {bride.first_name} {bride.last_name}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        #{bride.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-700">
                      <p>{bride.email || "—"}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {bride.phone || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-700">
                      <p>{formatDate(bride.event_date)}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {bride.event_location || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-700">
                      {bride.makeup_type || "—"}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          bride.status === "suspended"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {bride.status || "active"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      {formatDate(bride.created_at)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedBride(bride)}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                        >
                          View
                        </button>

                        <button
                          onClick={() => toggleStatus(bride.id, bride.status)}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          {bride.status === "suspended"
                            ? "Reactivate"
                            : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBride && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedBride(null)}
          />

          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Bride Details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  #{selectedBride.id.slice(0, 8)}
                </p>
              </div>

              <button
                onClick={() => setSelectedBride(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 p-6">
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Personal Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedBride.first_name} {selectedBride.last_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="mt-1 text-gray-700">
                      {selectedBride.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="mt-1 text-gray-700">
                      {selectedBride.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="mt-1 capitalize text-gray-700">
                      {selectedBride.status || "active"}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Event Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Event Date</p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(selectedBride.event_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Event Location</p>
                    <p className="mt-1 text-gray-700">
                      {selectedBride.event_location || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Makeup Type</p>
                    <p className="mt-1 text-gray-700">
                      {selectedBride.makeup_type || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Preferences</p>
                    <p className="mt-1 leading-relaxed text-gray-700">
                      {selectedBride.preference || "No preferences provided."}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Admin Actions
                </h3>

                <button
                  onClick={() =>
                    toggleStatus(selectedBride.id, selectedBride.status)
                  }
                  className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  {selectedBride.status === "suspended"
                    ? "Reactivate Bride"
                    : "Suspend Bride"}
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}