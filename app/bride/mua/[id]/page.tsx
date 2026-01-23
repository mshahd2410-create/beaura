"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import RequestBookingModal from "@/components/booking/RequestBookingModal";

export default function MuaProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  console.log("MUA ID FROM URL:", id);

  const [mua, setMua] = useState<any>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState<string | null>(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [openBooking, setOpenBooking] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadMua = async () => {
      const { data } = await supabase
        .from("mua_profiles")
        .select(`
          id,
          first_name,
          last_name,
          bio,
          cities,
          mua_portfolio ( image_path ),
          mua_services (
            id,
            name,
            price,
            duration_minutes
          )
        `)
        .eq("id", id)
        .single();

      if (!data) return;

      const portfolio =
        data.mua_portfolio?.map((p: any) => ({
          url: supabase.storage
            .from("mua-portfolio")
            .getPublicUrl(p.image_path).data.publicUrl,
        })) || [];

      setMua({
        ...data,
        portfolio,
        services: data.mua_services || [],
      });
    };

    loadMua();
  }, [id]);

  if (!mua) {
    return <main className="min-h-screen bg-white" />;
  }

  const previewImages = mua.portfolio.slice(0, 4);

  return (
    <main className="min-h-screen bg-white pb-32">
      {/* HERO */}
      <section className="pt-28 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-light tracking-tight">
              {mua.first_name} {mua.last_name}
            </h1>
            <span className="text-sm text-purple-600">★ 4.9</span>
          </div>

          <p className="text-sm text-gray-500 max-w-xl">
            Calm energy, flawless skin, and timeless bridal looks.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setOpenBooking(true)}
              className="h-12 px-6 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
            >
              Book
            </button>

            <button className="h-12 px-6 rounded-full border border-gray-300 text-sm hover:border-purple-600 hover:text-purple-600 transition">
              Message
            </button>
          </div>
        </motion.div>
      </section>

      {/* WORK PREVIEW */}
      <section className="max-w-5xl mx-auto mt-20 px-6 space-y-6">
        <h2 className="text-lg font-medium">Work</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewImages.map((img: any, i: number) => (
            <button
              key={i}
              onClick={() => setImageOpen(img.url)}
              className="aspect-square rounded-2xl overflow-hidden"
            >
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover hover:scale-105 transition"
              />
            </button>
          ))}
        </div>

        {mua.portfolio.length > 4 && (
          <button
            onClick={() => setGalleryOpen(true)}
            className="text-sm text-purple-600 hover:underline"
          >
            Show full gallery
          </button>
        )}
      </section>

      {/* REVIEWS PREVIEW */}
      <section className="max-w-5xl mx-auto mt-20 px-6 space-y-6">
        <h2 className="text-lg font-medium">Reviews</h2>

        <div className="space-y-6 max-w-2xl">
          <div>
            <p className="font-medium">Sara A.</p>
            <p className="text-xs text-gray-400">★★★★★</p>
            <p className="text-sm text-gray-600 mt-2">
              She made me feel calm and confident. Makeup lasted all night.
            </p>
          </div>

          <div>
            <p className="font-medium">Nour M.</p>
            <p className="text-xs text-gray-400">★★★★★</p>
            <p className="text-sm text-gray-600 mt-2">
              Very professional and warm. Highly recommend.
            </p>
          </div>
        </div>

        <button
          onClick={() => setReviewsOpen(true)}
          className="text-sm text-purple-600 hover:underline"
        >
          View all reviews
        </button>
      </section>

      {/* ABOUT */}
      <section className="max-w-5xl mx-auto mt-20 px-6 space-y-6">
        <h2 className="text-lg font-medium">About</h2>

        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          {mua.bio || "This artist hasn’t added a bio yet."}
        </p>

        {mua.cities?.length > 0 && (
          <p className="text-sm text-gray-500">
            <span className="text-gray-700 font-medium">
              Cities I work in:
            </span>{" "}
            {mua.cities.join(", ")}
          </p>
        )}
      </section>

      {/* FULL GALLERY */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <button
              onClick={() => setGalleryOpen(false)}
              className="mb-8 text-sm text-gray-500 hover:text-black"
            >
              ← Back
            </button>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {mua.portfolio.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setImageOpen(img.url)}
                  className="aspect-square rounded-2xl overflow-hidden"
                >
                  <img
                    src={img.url}
                    className="h-full w-full object-cover"
                    alt=""
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULL IMAGE */}
      {imageOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setImageOpen(null)}
            className="absolute top-6 right-6 text-white text-xl"
          >
            ✕
          </button>
          <img
            src={imageOpen}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            alt=""
          />
        </div>
      )}

      {/* ALL REVIEWS */}
      {reviewsOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
            <button
              onClick={() => setReviewsOpen(false)}
              className="text-sm text-gray-500 hover:text-black"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-light">All reviews</h2>

            <div className="space-y-10">
              <div>
                <p className="font-medium">Sara A.</p>
                <p className="text-xs text-gray-400">★★★★★</p>
                <p className="text-sm text-gray-600 mt-2">
                  She made me feel calm and confident.
                </p>
              </div>

              <div>
                <p className="font-medium">Nour M.</p>
                <p className="text-xs text-gray-400">★★★★★</p>
                <p className="text-sm text-gray-600 mt-2">
                  Beautiful work and very professional.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      <RequestBookingModal
        muaId={mua.id}
        services={mua.services}
        open={openBooking}
        onClose={() => setOpenBooking(false)}
      />
    </main>
  );
}