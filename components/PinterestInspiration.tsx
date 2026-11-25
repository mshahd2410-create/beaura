"use client";

import { useEffect } from "react";

type Pin = { url: string; title: string };
export default function PinterestInspiration({ pins, searchUrl }: { pins: Pin[]; searchUrl: string }) {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-beaura-pinterest="true"]');
    if (existing) {
      const pinterest = window as typeof window & { PinUtils?: { build?: () => void } };
      pinterest.PinUtils?.build?.();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://assets.pinterest.com/js/pinit.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-beaura-pinterest", "true");
    document.body.appendChild(script);
  }, [pins]);

  return <div className="mt-8">
    {pins.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{pins.map((pin) => <article key={pin.url} className="overflow-hidden rounded-3xl border border-[#eadff5] bg-white p-3"><p className="px-2 pb-3 text-sm text-[#6f6077]">{pin.title}</p><a data-pin-do="embedPin" href={pin.url} /></article>)}</div> : <div className="rounded-3xl border border-dashed border-[#d9cbe6] bg-white p-8"><p className="text-sm leading-7 text-[#6f6077]">We’re preparing this inspiration gallery. Browse the matching Pinterest collection in the meantime.</p></div>}
    <a href={searchUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-[#171018] px-6 py-3 text-sm text-white hover:bg-purple-700">Explore more inspiration on Pinterest ↗</a>
  </div>;
}
