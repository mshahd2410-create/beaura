"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type MUA = {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  portfolio: { image_path: string }[];
};

export default function BrideHome() {
  const [muas, setMuas] = useState<MUA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMUAs = async () => {
      const { data, error } = await supabase
        .from("mua_profiles")
        .select(`
          id,
          first_name,
          last_name,
          cities,
          mua_portfolio (
            image_path
          )
        `);

      if (!error && data) {
        setMuas(
          data.map((m) => ({
            ...m,
            portfolio: m.mua_portfolio || [],
          }))
        );
      }
      setLoading(false);
    };

    loadMUAs();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff7fb] to-[#f3f4ff] px-6 py-6">
      {/* Top bar */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Discover Artists ✨</h1>

        <Link href="/bride/messages" className="text-sm">
          💬
        </Link>
      </header>

      {loading && <p>Loading artists...</p>}

      {/* MUA Grid */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {muas.map((mua) => {
          const image =
            mua.portfolio?.[0]?.image_path
              ? supabase.storage
                  .from("mua-portfolio")
                  .getPublicUrl(mua.portfolio[0].image_path).data.publicUrl
              : "/placeholder.jpg";

          return (
            <Link
              key={mua.id}
              href={`/bride/mua/${mua.id}`}
              className="break-inside-avoid block rounded-3xl overflow-hidden bg-white shadow hover:scale-[1.02] transition"
            >
              <img
                src={image}
                alt="MUA work"
                className="w-full object-cover"
              />

              <div className="p-3">
                <p className="font-medium text-sm">
                  {mua.first_name} {mua.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {mua.cities?.[0]}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
