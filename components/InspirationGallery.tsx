"use client";

import { useEffect, useState } from "react";

type InspirationImage = { src: string; caption: string };

export default function InspirationGallery({ images }: { images: readonly InspirationImage[] }) {
  const [selected, setSelected] = useState<InspirationImage | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 16;
  const pageCount = Math.ceil(images.length / pageSize);
  const visibleImages = images.slice(page * pageSize, (page + 1) * pageSize);

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
        {visibleImages.map((image) => (
          <button key={image.src} type="button" onClick={() => setSelected(image)} className="group min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-600">
            <span className="block overflow-hidden rounded-[1.25rem] bg-[#f1e5ff] sm:rounded-[1.7rem]">
              <img src={image.src} alt={image.caption} loading="lazy" className="h-auto max-h-[430px] min-h-[150px] w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
            </span>
            <span className="mt-3 block px-1 text-sm font-medium text-[#33263a] sm:text-[15px]">{image.caption}</span>
            <span className="mt-1 block px-1 text-xs text-[#8a7d91]">The Beaura edit</span>
          </button>
        ))}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Inspiration pages" className="mt-12 flex items-center justify-center gap-5">
          <button type="button" disabled={page === 0} onClick={() => { setPage((value) => Math.max(0, value - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border border-[#d9cbe6] px-5 py-2.5 text-sm text-[#5f4d68] transition hover:border-purple-500 disabled:cursor-not-allowed disabled:opacity-35">Previous</button>
          <span className="text-sm text-[#6f6077]">Page {page + 1} of {pageCount}</span>
          <button type="button" disabled={page === pageCount - 1} onClick={() => { setPage((value) => Math.min(pageCount - 1, value + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full bg-[#171018] px-5 py-2.5 text-sm text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-35">Next</button>
        </nav>
      )}

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
