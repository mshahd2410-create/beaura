"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, ShieldCheck, Star } from "lucide-react";

export default function MuaCard({ mua, compact = false }: { mua: any; compact?: boolean }) {
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
    .slice(0, compact ? 1 : 2);

  function move(event: React.MouseEvent, direction: number) {
    event.preventDefault();
    event.stopPropagation();
    if (images.length) {
      setIndex((current) => (current + direction + images.length) % images.length);
    }
  }

  return (
    <Link href={\`/bride/mua/\${mua.id}\`} className="group block h-full">
      <article className={\`h-full overflow-hidden border border-[#eadff5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg \${compact ? "rounded-2xl" : "rounded-[2rem] hover:shadow-xl"}\`}>
        <div className={\`relative bg-[#f1e5ff] \${compact ? "aspect-square" : "aspect-[4/5]"}\`}>
          {images.length > 0 ? (
            <img
              src={images[index].publicUrl}
              alt={\`\${mua.first_name || "Makeup artist"} portfolio\`}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[#6f6077]">
              Portfolio coming soon
            </div>
          )}

          {mua.verified && (
            <span className={\`absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 text-[#171018] backdrop-blur \${compact ? "px-2 py-1 text-[9px]" : "left-4 top-4 gap-1.5 px-3 py-1.5 text-[11px]"}\`}>
              <ShieldCheck size={compact ? 10 : 13} />
              Verified
            </span>
          )}

          {mua.beaura_tier && (
            <span className={\`absolute right-2 top-2 rounded-full bg-[#f7efff]/95 font-semibold uppercase text-purple-700 backdrop-blur \${compact ? "px-2 py-1 text-[8px] tracking-wide" : "right-4 top-4 px-3 py-1.5 text-[10px] tracking-[0.14em]"}\`}>
              {mua.beaura_tier}
            </span>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button onClick={(event) => move(event, -1)} aria-label="Previous portfolio image" className="grid h-7 w-7 place-items-center rounded-full bg-white/90">
                <ChevronLeft size={14} />
              </button>
              <button onClick={(event) => move(event, 1)} aria-label="Next portfolio image" className="grid h-7 w-7 place-items-center rounded-full bg-white/90">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <div className={compact ? "p-2.5 sm:p-3" : "p-5"}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={\`truncate font-medium text-[#171018] \${compact ? "text-sm tracking-tight sm:text-base" : "text-2xl font-light tracking-[-0.05em]"}\`}>
                {mua.first_name} {mua.last_name}
              </h3>
              <p className={\`mt-1 flex items-center gap-1 truncate text-[#6f6077] \${compact ? "text-[10px] sm:text-xs" : "text-sm"}\`}>
                <MapPin size={compact ? 11 : 14} className="shrink-0" />
                {Array.isArray(mua.cities) && mua.cities.length ? mua.cities.slice(0, 2).join(", ") : "Location on request"}
              </p>
            </div>
            {startingPrice && (
              <div className="shrink-0 text-right">
                <p className="text-[9px] uppercase tracking-wide text-purple-700">from</p>
                <p className={compact ? "text-[10px] font-medium text-[#171018] sm:text-xs" : "text-sm text-[#171018]"}>EGP {startingPrice}</p>
              </div>
            )}
          </div>

          {mua.rating?.count > 0 && (
            <div className={\`mt-2 flex items-center gap-1 text-[#6f6077] \${compact ? "text-[10px]" : "mt-3 text-sm"}\`}>
              <Star size={compact ? 11 : 14} className="fill-[#d4a843] text-[#d4a843]" />
              <span className="font-medium text-[#171018]">{Number(mua.rating.average).toFixed(1)}</span>
              <span>({mua.rating.count})</span>
            </div>
          )}

          {serviceNames.length > 0 && (
            <div className={\`flex flex-wrap gap-1.5 \${compact ? "mt-2" : "mt-4 gap-2"}\`}>
              {serviceNames.map((service: string) => (
                <span key={service} className={\`rounded-full bg-[#f7efff] text-[#6f6077] \${compact ? "max-w-full truncate px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[11px]"}\`}>
                  {service}
                </span>
              ))}
            </div>
          )}

          <p className={\`font-semibold uppercase text-purple-700 \${compact ? "mt-2 text-[9px] tracking-wide" : "mt-4 text-xs tracking-[0.16em]"}\`}>
            View portfolio
          </p>
        </div>
      </article>
    </Link>
  );
}