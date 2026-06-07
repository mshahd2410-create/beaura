"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Mua = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  cities: string[] | null;
  instagram: string | null;
  created_at: string;
  experience: string | null;
  phone: string | null;
  verified: boolean;
  status: string;
  beaura_tier: string | null;
};

export default function AdminApprovalsPage() {
  const [muas, setMuas] = useState<Mua[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMua, setSelectedMua] = useState<Mua | null>(null);

  useEffect(() => {
    loadPendingMuas();
  }, []);

  async function loadPendingMuas() {
    setLoading(true);

    const { data, error } = await supabase
  .from("mua_profiles")
  .select("*")
  .eq("verified", false)
  .eq("status", "active");

    if (error) {
      console.error("APPROVALS LOAD ERROR:", error);
      alert(error.message);
    } else {
      setMuas((data as Mua[]) || []);
    }

    setLoading(false);
  }

  async function approveMua(id: string) {
    const { error } = await supabase
      .from("mua_profiles")
      .update({
        verified: true,
        status: "active",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setMuas((prev) => prev.filter((mua) => mua.id !== id));
    setSelectedMua(null);
  }

  async function rejectMua(id: string) {
    const { error } = await supabase
      .from("mua_profiles")
      .update({
        verified: false,
        status: "suspended",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setMuas((prev) => prev.filter((mua) => mua.id !== id));
    setSelectedMua(null);
  }

  function formatDate(date: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  return (
    <main className="min-h-screen bg-[#FAF8FF] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          MUA Approval Queue
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Review new makeup artists before they become visible to brides.
        </p>
      </div>

      <div className="mb-8 rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-500">Pending approvals</p>

        <h2 className="mt-3 text-4xl font-semibold text-purple-600">
          {muas.length}
        </h2>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white border border-gray-100 p-12 text-center text-gray-500">
          Loading pending MUAs...
        </div>
      ) : muas.length === 0 ? (
        <div className="rounded-3xl bg-white border border-gray-100 p-12 text-center">
          <p className="text-lg font-medium text-gray-700">
            No pending approvals
          </p>

          <p className="mt-2 text-sm text-gray-500">
            New MUAs waiting for verification will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {muas.map((mua) => (
            <div
              key={mua.id}
              className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {mua.first_name || "Unnamed"} {mua.last_name || ""}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {mua.instagram ? `@${mua.instagram}` : "No Instagram"}
                  </p>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Pending
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-gray-600">
                <p>
                  <span className="text-gray-400">Cities:</span>{" "}
                  {mua.cities?.join(", ") || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Experience:</span>{" "}
                  {mua.experience || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Joined:</span>{" "}
                  {formatDate(mua.created_at)}
                </p>

                <p className="line-clamp-3">
                  <span className="text-gray-400">Bio:</span>{" "}
                  {mua.bio || "No bio provided."}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMua(mua)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  View
                </button>

                <button
                  onClick={() => approveMua(mua.id)}
                  className="rounded-full border border-green-200 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectMua(mua.id)}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMua && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedMua(null)}
          />

          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  MUA Application
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  #{selectedMua.id.slice(0, 8)}
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
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Artist Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedMua.first_name || "Unnamed"}{" "}
                      {selectedMua.last_name || ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="mt-1 text-gray-700">
                      {selectedMua.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Instagram</p>
                    <p className="mt-1 text-gray-700">
                      {selectedMua.instagram
                        ? `@${selectedMua.instagram}`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Cities</p>
                    <p className="mt-1 text-gray-700">
                      {selectedMua.cities?.join(", ") || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Experience</p>
                    <p className="mt-1 text-gray-700">
                      {selectedMua.experience || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Bio</p>
                    <p className="mt-1 leading-relaxed text-gray-700">
                      {selectedMua.bio || "No bio provided."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Joined</p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(selectedMua.created_at)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Decision
                </h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => approveMua(selectedMua.id)}
                    className="rounded-full bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700"
                  >
                    Approve Artist
                  </button>

                  <button
                    onClick={() => rejectMua(selectedMua.id)}
                    className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Reject / Suspend
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