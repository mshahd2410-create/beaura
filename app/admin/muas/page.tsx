"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Mua = {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  cities: string[] | null;
  instagram: string | null;
  created_at: string;
  experience: string | null;
  phone: string | null;
  verified: boolean;
  status: string;
  beaura_tier: string;
};

export default function AdminMuasPage() {
  const [muas, setMuas] = useState<Mua[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "all" | "verified" | "pending" | "suspended"
  >("all");

  const [selectedMua, setSelectedMua] = useState<Mua | null>(null);

  useEffect(() => {
    loadMuas();
  }, []);

  async function loadMuas() {
    setLoading(true);

    const { data, error } = await supabase
      .from("mua_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setMuas((data as Mua[]) || []);
    }

    setLoading(false);
  }

  async function toggleVerification(
    id: string,
    currentValue: boolean
  ) {
    const { error } = await supabase
      .from("mua_profiles")
      .update({
        verified: !currentValue,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setMuas((prev) =>
      prev.map((mua) =>
        mua.id === id
          ? {
              ...mua,
              verified: !currentValue,
            }
          : mua
      )
    );

    if (selectedMua?.id === id) {
      setSelectedMua({
        ...selectedMua,
        verified: !currentValue,
      });
    }
  }

  async function toggleStatus(
    id: string,
    currentStatus: string
  ) {
    const newStatus =
      currentStatus === "active"
        ? "suspended"
        : "active";

    const { error } = await supabase
      .from("mua_profiles")
      .update({
        status: newStatus,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setMuas((prev) =>
      prev.map((mua) =>
        mua.id === id
          ? {
              ...mua,
              status: newStatus,
            }
          : mua
      )
    );

    if (selectedMua?.id === id) {
      setSelectedMua({
        ...selectedMua,
        status: newStatus,
      });
    }
  }

  const filteredMuas = useMemo(() => {
    return muas.filter((mua) => {
      const fullName =
        `${mua.first_name} ${mua.last_name}`.toLowerCase();

      const instagram =
        mua.instagram?.toLowerCase() || "";

      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        instagram.includes(search.toLowerCase());

      let matchesFilter = true;

      if (filter === "verified") {
        matchesFilter = mua.verified;
      }

      if (filter === "pending") {
        matchesFilter = !mua.verified;
      }

      if (filter === "suspended") {
        matchesFilter =
          mua.status === "suspended";
      }

      return matchesSearch && matchesFilter;
    });
  }, [muas, search, filter]);

  const totalMuas = muas.length;

  const verifiedCount = muas.filter(
    (m) => m.verified
  ).length;

  const pendingCount = muas.filter(
    (m) => !m.verified
  ).length;

  const suspendedCount = muas.filter(
    (m) => m.status === "suspended"
  ).length;

  return (
    <main className="min-h-screen bg-[#FAF8FF] p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Makeup Artists
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage, verify, and monitor all MUAs
          on Beaura.
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-5 md:grid-cols-4 mb-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Total MUAs
          </p>

          <h2 className="mt-3 text-3xl font-semibold">
            {totalMuas}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Verified
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-green-600">
            {verifiedCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-amber-500">
            {pendingCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Suspended
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-red-500">
            {suspendedCount}
          </h2>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by name or Instagram..."
            className="
              w-full md:max-w-md
              h-12
              rounded-2xl
              border border-gray-200
              px-4
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-purple-500
            "
          />

          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "verified",
              "pending",
              "suspended",
            ].map((value) => (
              <button
                key={value}
                onClick={() =>
                  setFilter(
                    value as
                      | "all"
                      | "verified"
                      | "pending"
                      | "suspended"
                  )
                }
                className={`
                  px-4 py-2 rounded-full text-sm capitalize transition
                  ${
                    filter === value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
            {/* TABLE */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading MUAs...
          </div>
        ) : filteredMuas.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-gray-700">
              No makeup artists found
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">
                      Artist
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Cities
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Instagram
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Experience
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Tier
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMuas.map((mua) => (
                    <tr
                      key={mua.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-medium text-gray-900">
                            {mua.first_name}{" "}
                            {mua.last_name}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {mua.verified
                              ? "✅ Verified"
                              : "⏳ Pending"}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {mua.cities?.join(", ") ||
                          "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {mua.instagram
                          ? `@${mua.instagram}`
                          : "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {mua.experience || "—"}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                          {mua.beaura_tier}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`
                            rounded-full px-3 py-1 text-xs font-medium
                            ${
                              mua.status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }
                          `}
                        >
                          {mua.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              setSelectedMua(mua)
                            }
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              toggleVerification(
                                mua.id,
                                mua.verified
                              )
                            }
                            className="rounded-full border border-purple-200 px-3 py-1 text-xs text-purple-700 hover:bg-purple-50"
                          >
                            {mua.verified
                              ? "Unverify"
                              : "Verify"}
                          </button>

                          <button
                            onClick={() =>
                              toggleStatus(
                                mua.id,
                                mua.status
                              )
                            }
                            className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            {mua.status ===
                            "active"
                              ? "Suspend"
                              : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
            {/* DRAWER */}
      {selectedMua && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedMua(null)}
          />

          {/* Panel */}
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Artist Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View and manage this MUA
                </p>
              </div>

              <button
                onClick={() => setSelectedMua(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 p-6">
              {/* PERSONAL INFO */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Personal Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">
                      Full Name
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {selectedMua.first_name}{" "}
                      {selectedMua.last_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Phone
                    </p>

                    <p className="mt-1 text-gray-700">
                      {selectedMua.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Instagram
                    </p>

                    <p className="mt-1 text-gray-700">
                      {selectedMua.instagram
                        ? `@${selectedMua.instagram}`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Cities
                    </p>

                    <p className="mt-1 text-gray-700">
                      {selectedMua.cities?.join(", ") ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Bio
                    </p>

                    <p className="mt-1 text-gray-700 leading-relaxed">
                      {selectedMua.bio ||
                        "No bio provided."}
                    </p>
                  </div>
                </div>
              </section>

              {/* PROFESSIONAL INFO */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Professional Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">
                      Experience
                    </p>

                    <p className="mt-1 text-gray-700">
                      {selectedMua.experience ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Beaura Tier
                    </p>

                    <span className="mt-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
                      {selectedMua.beaura_tier}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Verification
                    </p>

                    <p className="mt-1">
                      {selectedMua.verified
                        ? "✅ Verified"
                        : "⏳ Pending"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Status
                    </p>

                    <p className="mt-1 capitalize">
                      {selectedMua.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Joined
                    </p>

                    <p className="mt-1 text-gray-700">
                      {new Date(
                        selectedMua.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </section>

              {/* QUICK ACTIONS */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Quick Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      toggleVerification(
                        selectedMua.id,
                        selectedMua.verified
                      )
                    }
                    className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 transition hover:bg-purple-50"
                  >
                    {selectedMua.verified
                      ? "Unverify"
                      : "Verify"}
                  </button>

                  <button
                    onClick={() =>
                      toggleStatus(
                        selectedMua.id,
                        selectedMua.status
                      )
                    }
                    className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    {selectedMua.status ===
                    "active"
                      ? "Suspend"
                      : "Reactivate"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}