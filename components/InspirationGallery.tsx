"use client";

import { useEffect, useState } from "react";

type InspirationImage = { src: string; caption: string };

export default function InspirationGallery({ images }: { images: InspirationImage[] }) {
  const [selected, setSelected] = useState<InspirationImage | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4">
        {images.map((image) => (
          <button key={image.src} type="button" onClick={() => setSelected(image)} className="group min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-600">
            <span className="block overflow-hidden rounded-[1.25rem] bg-[#f1e5ff] sm:rounded-[1.7rem]">
              <img src={image.src} alt={image.caption} loading="lazy" className="h-auto max-h-[430px] min-h-[150px] w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
            </span>
            <span className="mt-3 block px-1 text-sm font-medium text-[#33263a] sm:text-[15px]">{image.caption}</span>
            <span className="mt-1 block px-1 text-xs text-[#8a7d91]">The Beaura edit</span>
          </button>
        ))}
      </div>

      {selected && (
        <div role="dialog" aria-modal="true" aria-label={selected.caption} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171018]/85 p-4 backdrop-blur-sm">
          <button type="button" onClick={() => setSelected(null)} aria-label="Close image" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-2xl text-[#171018] shadow-lg">×</button>
          <div className="flex max-h-[92vh] max-w-[min(92vw,900px)] flex-col items-center">
            <img src={selected.src} alt={selected.caption} className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            <p className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm text-[#33263a]">{selected.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}
