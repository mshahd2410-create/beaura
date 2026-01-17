"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function BrideHome() {
  const router = useRouter();
  const [muas, setMuas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMUAs = async () => {
      const { data: profiles } = await supabase
        .from("mua_profiles")
        .select(`
          id,
          first_name,
          last_name,
          cities,
          services
        `);

      if (!profiles) return;

      // Fetch portfolio cover for each MUA
      const enriched = await Promise.all(
        profiles.map(async (mua) => {
          const { data: cover } = await supabase
            .from("mua_portfolio")
            .select("image_path")
            .eq("mua_id", mua.id)
            .limit(1)
            .single();

          return {
            ...mua,
            cover:
              cover?.image_path
                ? supabase.storage
                    .from("mua-portfolio")
                    .getPublicUrl(cover.image_path).data.publicUrl
                : "/placeholder.jpg",
          };
        })
      );

      setMuas(enriched);
      setLoading(false);
    };

    loadMUAs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <p className="text-gray-500">Loading artists ✨</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-5 pb-28">
      {/* Top bar */}
      <header className="pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-light">Discover MUAs</h1>

        <div className="flex items-center gap-4">
          <button className="text-xl">💬</button>
          <button className="text-xl">🔔</button>
        </div>
      </header>

      {/* MUA Feed */}
      <section className="grid grid-cols-1 gap-8">
        {muas.map((mua) => (
          <MUACard
            key={mua.id}
            mua={mua}
            onClick={() => router.push(`/bride/mua/${mua.id}`)}
          />
        ))}
      </section>
    </main>
  );
}

/* ---------- CARD ---------- */

function MUACard({
  mua,
  onClick,
}: {
  mua: any;
  onClick: () => void;
}) {
  const minPrice = Object.values(mua.services || {})
    .map(Number)
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition text-left"
    >
      {/* Image */}
      <div className="relative h-64 w-full">
        <Image
          src={mua.cover}
          alt="MUA portfolio"
          fill
          className="object-cover"
        />
      </div>

      {/* Info */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-medium">
            {mua.first_name} {mua.last_name}
          </h2>

          {minPrice && (
            <span className="text-sm text-gray-600">
              from <strong>EGP {minPrice}</strong>
            </span>
          )}
        </div>

        {/* Cities */}
        <p className="text-xs text-gray-500">
          {mua.cities?.join(" · ")}
        </p>

        {/* Services */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(mua.services || {})
            .filter(([, price]) => price)
            .map(([key]) => (
              <span
                key={key}
                className="text-xs px-3 py-1 rounded-full bg-gray-100"
              >
                {key}
              </span>
            ))}
        </div>
      </div>
    </button>
  );
}
