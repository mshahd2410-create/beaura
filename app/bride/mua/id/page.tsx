"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

export default function MUAProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [mua, setMua] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("mua_profiles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setMua(data));

    supabase
      .from("mua_portfolio")
      .select("image_path")
      .eq("mua_id", id)
      .then(({ data }) => setPortfolio(data || []));
  }, [id]);

  if (!mua) return null;

  return (
    <div className="pb-24">
      {/* Portfolio */}
      <div className="grid grid-cols-2 gap-1">
        {portfolio.map((p) => (
          <div key={p.image_path} className="relative h-48">
            <Image
              src={supabase.storage
                .from("mua-portfolio")
                .getPublicUrl(p.image_path).data.publicUrl}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="p-6 space-y-6">
        <h1 className="text-2xl">
          {mua.first_name} {mua.last_name}
        </h1>

        {/* Prices */}
        <div className="space-y-2">
         {Object.entries(mua.services as Record<string, string | number>).map(
  ([k, v]) =>
    v ? (
      <div key={k} className="flex justify-between">
        <span className="capitalize">{k}</span>
        <span>EGP {String(v)}</span>
      </div>
    ) : null
)}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/bride/messages?mua=${id}`)}
            className="flex-1 border rounded-full py-3"
          >
            Message
          </button>
          <button className="flex-1 bg-black text-white rounded-full py-3">
            Book
          </button>
        </div>
      </div>
    </div>
  );
}