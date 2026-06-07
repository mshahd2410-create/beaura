"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        mua_id,
  mua_profiles!favorites_mua_id_fkey (
  id,
  first_name,
  last_name,
  cities,
  bio,
  verified,
  status,
  mua_portfolio (
    image_path
  )
)
        )
      `)
      .eq("bride_id", user.id);

    if (!error && data) {
      const formatted = data.map((fav: any) => {
        const mua = fav.mua_profiles;

        const image =
          mua?.mua_portfolio?.[0]?.image_path
            ? supabase.storage
                .from("mua-portfolio")
                .getPublicUrl(
                  mua.mua_portfolio[0].image_path
                ).data.publicUrl
            : null;

        return {
          ...mua,
          image,
        };
      });

setFavorites(
  formatted.filter(
    (mua: any) =>
      mua?.verified === true && mua?.status === "active"
  )
);    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-32">
      {/* HERO */}
      <section className="pt-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-purple-400">
              Your collection
            </p>

            <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-black">
              Favorites 💜
            </h1>

            <p className="mt-3 text-sm text-gray-500 max-w-md leading-relaxed">
              Keep track of the artists you love and come back
              whenever you're ready to book your perfect glam.
            </p>
          </div>

          <div className="h-20 w-20 rounded-3xl bg-purple-50 flex items-center justify-center text-3xl">
            ✨
          </div>
        </motion.div>
      </section>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center pt-32">
          <p className="text-sm text-gray-400">
            Loading your favorites…
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && favorites.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-xl mx-auto text-center pt-28"
        >
          <div className="h-28 w-28 rounded-full bg-purple-50 mx-auto flex items-center justify-center text-5xl">
            ♡
          </div>

          <h2 className="mt-8 text-2xl font-semibold tracking-tight">
            No favorites yet
          </h2>

          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Start exploring talented makeup artists and save
            your favorites here for later.
          </p>

          <Link
            href="/bride/home"
            className="inline-flex mt-8 h-12 items-center justify-center px-6 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
          >
            Discover Artists
          </Link>
        </motion.div>
      )}

      {/* FAVORITES GRID */}
      {!loading && favorites.length > 0 && (
        <section className="max-w-6xl mx-auto mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((mua, index) => (
              <motion.div
                key={mua.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/bride/mua/${mua.id}`}>
                  <div
                    className="group overflow-hidden rounded-[2rem]
                    border border-gray-100 bg-white hover:shadow-2xl
                    transition duration-300"
                  >
                    {/* IMAGE */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                      {mua.image ? (
                        <img
                          src={mua.image}
                          alt=""
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-5xl text-gray-300">
                          ✨
                        </div>
                      )}

                      {/* HEART */}
                      <div
                        className="absolute top-4 right-4 h-10 w-10 rounded-full
                        bg-white/90 backdrop-blur flex items-center justify-center
                        shadow-sm text-purple-600 text-lg"
                      >
                        ♥
                      </div>
                    </div>

                    {/* INFO */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight">
                          {mua.first_name} {mua.last_name}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                          {(mua.cities || []).join(", ")}
                        </p>
                      </div>

                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                        {mua.bio ||
                          "Luxury bridal makeup artist available for bookings."}
                      </p>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-sm text-purple-600 font-medium">
                          View profile
                        </span>

                        <span className="text-xs text-gray-400">
                          ★ 4.9
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}