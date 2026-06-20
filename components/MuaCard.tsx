"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, ShieldCheck } from "lucide-react";

export default function MuaCard({ mua }: { mua: any }) {
  const images = mua.mua_portfolio || [];
  const services = mua.mua_services || [];
  const [index, setIndex] = useState(0);

  const startingPrice = useMemo(() => {
    const prices = services
      .map((s: any) => Number(s?.price))
      .filter((price: number) => price > 0);

    return prices.length ? Math.min(...prices) : null;
  }, [services]);

  const serviceNames = services
    .map((s: any) => s?.name)
    .filter(Boolean)
    .slice(0, 2);

  function move(event: React.MouseEvent, direction: number) {
    event.preventDefault();
    event.stopPropagation();

    if (images.length) {
      setIndex((current) => (current + direction + images.length) % images.length);
    }
  }

  return (
    <Link href={`/bride/mua/${mua.id}`} className="group block">
      <article className="overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[4/5] bg-[#f1e5ff]">
          {images.length > 0 ? (
            <img
              src={images[index].publicUrl}
              alt={`${mua.first_name || "Makeup artist"} portfolio`}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[#6f6077]">
              Portfolio coming soon
            </div>
          )}

          {mua.verified && (
            <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-[#171018] backdrop-blur">
              <ShieldCheck size={13} />
              Verified
            </span>
          )}

          {mua.beaura_tier && (
            <span className="absolute right-4 top-4 rounded-full bg-[#f7efff]/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-purple-700 backdrop-blur">
              {mua.beaura_tier}
            </span>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={(event) => move(event, -1)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={(event) => move(event, 1)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-light tracking-[-0.05em] text-[#171018]">
                {mua.first_name} {mua.last_name}
              </h3>

              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-[#6f6077]">
                <MapPin size={14} />
                {Array.isArray(mua.cities) && mua.cities.length
                  ? mua.cities.slice(0, 2).join(", ")
                  : "Location on request"}
              </p>
            </div>

            {startingPrice && (
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-[0.16em] text-purple-700">
                  from
                </p>
                <p className="text-sm text-[#171018]">EGP {startingPrice}</p>
              </div>
            )}
          </div>

          {serviceNames.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {serviceNames.map((service: string) => (
                <span
                  key={service}
                  className="rounded-full bg-[#f7efff] px-3 py-1.5 text-[11px] text-[#6f6077]"
                >
                  {service}
                </span>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
            View portfolio
          </p>
        </div>
      </article>
    </Link>
  );
}