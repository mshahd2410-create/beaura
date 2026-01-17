"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PortfolioImage = {
  id: string;
  image_path: string;
};

export default function MuaPortfolioPage() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  /* ===============================
     LOAD PORTFOLIO IMAGES
  =============================== */
  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("mua_portfolio")
      .select("*")
      .eq("mua_id", user.id)
      .order("created_at", { ascending: false });

    if (!data) return;

    setImages(data);

    // Generate signed URLs
    const urlMap: Record<string, string> = {};

    for (const img of data) {
      const { data: signed } = await supabase.storage
        .from("mua-portfolio")
        .createSignedUrl(img.image_path, 60 * 60); // 1 hour

      if (signed?.signedUrl) {
        urlMap[img.id] = signed.signedUrl;
      }
    }

    setSignedUrls(urlMap);
  };

  /* ===============================
     UPLOAD IMAGES
  =============================== */
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const path = `${user.id}/${crypto.randomUUID()}`;

      const { error } = await supabase.storage
        .from("mua-portfolio")
        .upload(path, file);

      if (!error) {
        await supabase.from("mua_portfolio").insert({
          mua_id: user.id,
          image_path: path,
        });
      }
    }

    setUploading(false);
    loadPortfolio();
  };

  /* ===============================
     DELETE IMAGE
  =============================== */
  const deleteImage = async (
    id: string,
    path: string
  ) => {
    await supabase.storage
      .from("mua-portfolio")
      .remove([path]);

    await supabase
      .from("mua_portfolio")
      .delete()
      .eq("id", id);

    loadPortfolio();
  };

  /* ===============================
     UI
  =============================== */
  return (
    <main className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-light">
          Your Portfolio
        </h1>

        <label className="cursor-pointer bg-black text-white px-6 py-2 rounded-full text-sm">
          {uploading ? "Uploading..." : "Add photos"}
          <input
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleUpload}
          />
        </label>
      </header>

      {images.length === 0 && (
        <p className="text-gray-500 text-sm">
          No portfolio images yet.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group rounded-xl overflow-hidden"
          >
            {signedUrls[img.id] && (
              <img
                src={signedUrls[img.id]}
                alt="Portfolio"
                className="w-full h-48 object-cover"
              />
            )}

            <button
              onClick={() =>
                deleteImage(img.id, img.image_path)
              }
              className="absolute top-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
