"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MUAProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [mua, setMua] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("mua_profiles")
        .select(`
          *,
          mua_portfolio(image_path)
        `)
        .eq("id", id)
        .single();

      setMua(data);
    };

    load();
  }, [id]);

  if (!mua) return null;

  return (
    <main className="min-h-screen bg-[#fff] px-5 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">
          {mua.first_name} {mua.last_name}
        </h1>
        <p className="text-sm text-gray-500">{mua.bio}</p>
      </header>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => router.push(`/bride/messages?mua=${mua.id}`)}
          className="flex-1 py-3 rounded-full border"
        >
          Message 💬
        </button>
        <button
          onClick={() => router.push(`/bride/book/${mua.id}`)}
          className="flex-1 py-3 rounded-full bg-black text-white"
        >
          Book 💄
        </button>
      </div>

      {/* Portfolio */}
      <div className="columns-2 gap-3 space-y-3">
        {mua.mua_portfolio.map((img: any) => {
          const url = supabase.storage
            .from("mua-portfolio")
            .getPublicUrl(img.image_path).data.publicUrl;

          return (
            <img
              key={img.image_path}
              src={url}
              className="rounded-2xl w-full"
            />
          );
        })}
      </div>
    </main>
  );
}
