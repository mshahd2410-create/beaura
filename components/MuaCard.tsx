"use client";

import Link from "next/link";
import { useState } from "react";

type MuaCardProps = {
  mua: any;
};

export default function MuaCard({ mua }: MuaCardProps) {
  const images = mua.mua_portfolio || [];
  const [index, setIndex] = useState(0);

  const next = () => {
    if (images.length === 0) return;
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    if (images.length === 0) return;
    setIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <Link href={`/bride/mua/${mua.id}`} className="block">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full max-w-[320px] mx-auto cursor-pointer hover:shadow-md transition">
        
        {/* IMAGE */}
        <div className="relative h-64 bg-gray-100">
          {images.length > 0 ? (
            <img
              src={images[index].publicUrl}
              alt={mua.first_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No portfolio yet
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 w-9 h-9 rounded-full"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 w-9 h-9 rounded-full"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* INFO */}
        <div className="p-4">
          <h3 className="text-lg font-semibold">
            {mua.first_name} {mua.last_name}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {Array.isArray(mua.cities) ? mua.cities.join(", ") : ""}
          </p>

          <p className="text-xs text-purple-600 mt-2">
            Prices coming soon
          </p>
        </div>
      </div>
    </Link>
  );
}