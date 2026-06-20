"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ImagePlus, Trash2, Sparkles } from "lucide-react";

type PortfolioImage = {
  id: string;
  image_path: string;
  created_at?: string;
};

export default function MuaPortfolioPage() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function loadPortfolio() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("mua_portfolio")
      .select("*")
      .eq("mua_id", user.id)
      .order("created_at", { ascending: false });

    const portfolioImages = data || [];
    setImages(portfolioImages);

    const urlMap: Record<string, string> = {};

    for (const img of portfolioImages) {
      const { data: signed } = await supabase.storage
        .from("mua-portfolio")
        .createSignedUrl(img.image_path, 60 * 60);

      if (signed?.signedUrl) {
        urlMap[img.id] = signed.signedUrl;
      }
    }

    setSignedUrls(urlMap);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}${fileExt ? `.${fileExt}` : ""}`;

      const { error: uploadError } = await supabase.storage
        .from("mua-portfolio")
        .upload(path, file);

      if (!uploadError) {
        await supabase.from("mua_portfolio").insert({
          mua_id: user.id,
          image_path: path,
        });
      }
    }

    e.target.value = "";
    setUploading(false);
    await loadPortfolio();
  }

  async function deleteImage(id: string, path: string) {
    setDeletingId(id);

    await supabase.storage.from("mua-portfolio").remove([path]);

    await supabase.from("mua_portfolio").delete().eq("id", id);

    setDeletingId(null);
    await loadPortfolio();
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(17,16,24,0.05)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-500">
              portfolio
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#171018]">
              Your portfolio
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6476]">
              Upload your best work here. This is what clients see first, so keep it clean, fresh, and very you.
            </p>
          </div>

          <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#171018] px-6 text-sm font-medium text-white transition hover:opacity-90">
            <ImagePlus size={17} />
            {uploading ? "Uploading..." : "Add photos"}
            <input
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </section>

      {/* MINI STATS */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MiniStat title="Photos uploaded" value={String(images.length)} />
        <MiniStat
          title="Minimum recommended"
          value={images.length >= 5 ? "Done" : `${Math.max(5 - images.length, 0)} left`}
        />
        <MiniStat
          title="Profile strength"
          value={images.length >= 10 ? "Strong" : images.length >= 5 ? "Good" : "Needs photos"}
        />
      </section>

      {/* CONTENT */}
      <section className="rounded-[28px] border border-gray-100 bg-white p-4 shadow-[0_14px_40px_rgba(17,16,24,0.05)] sm:p-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-[24px] bg-[#FAF8FF]"
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#FCFBFF] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEFF] text-violet-600">
              <Sparkles size={22} />
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#171018]">
              No portfolio photos yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B6476]">
              Add 5–20 beautiful photos so your profile feels complete and clients can understand your style.
            </p>

            <label className="mt-6 inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#171018] px-6 text-sm font-medium text-white transition hover:opacity-90">
              <ImagePlus size={17} />
              Upload first photos
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="group relative overflow-hidden rounded-[24px] border border-gray-100 bg-[#FAF8FF]"
              >
                {signedUrls[img.id] ? (
                  <img
                    src={signedUrls[img.id]}
                    alt={`Portfolio photo ${index + 1}`}
                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="aspect-[4/5] animate-pulse bg-[#FAF8FF]" />
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-white/90">
                      Photo {index + 1}
                    </p>

                    <button
                      onClick={() => deleteImage(img.id, img.image_path)}
                      disabled={deletingId === img.id}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-medium text-[#171018] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    >
                      <Trash2 size={13} />
                      {deletingId === img.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TIP */}
      <section className="rounded-[28px] border border-gray-100 bg-[#FCFBFF] p-5 shadow-[0_14px_40px_rgba(17,16,24,0.04)]">
        <p className="text-sm leading-6 text-[#6B6476]">
          <span className="font-semibold text-[#171018]">Portfolio tip:</span>{" "}
          Mix close-up makeup shots, full-face looks, bridal glam, evening glam, and different lighting. A pretty variety helps clients trust your work faster.
        </p>
      </section>
    </main>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_14px_40px_rgba(17,16,24,0.05)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#7B7388]">
        {title}
      </p>
      <p className="mt-2 text-xl font-semibold text-[#171018]">{value}</p>
    </div>
  );
}