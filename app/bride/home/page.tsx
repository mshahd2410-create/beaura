"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import MasonryGrid from "@/components/MasonryGrid";
import MuaCard from "@/components/MuaCard";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function BrideHome() {
  const [muas, setMuas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Beautiful");
  const [showPopup, setShowPopup] = useState(false);

  // Get user name
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.first_name) {
        setName(data.user.user_metadata.first_name);
      }
    });
  }, []);

  // Show welcome popup once
  useEffect(() => {
    const seen = sessionStorage.getItem("beaura_welcome_seen");
    if (!seen) {
      setShowPopup(true);
      sessionStorage.setItem("beaura_welcome_seen", "true");
    }
  }, []);

  // Load MUAs
  useEffect(() => {
    const loadMuas = async () => {
      const { data, error } = await supabase
        .from("mua_profiles")
        .select(`
          id,
          first_name,
          last_name,
          cities,
          mua_portfolio (
            image_path
          )
        `);

      if (!error && data) {
        const enriched = data.map((mua: any) => ({
          ...mua,
          mua_portfolio: (mua.mua_portfolio || []).map((p: any) => ({
            publicUrl: supabase.storage
              .from("mua-portfolio")
              .getPublicUrl(p.image_path).data.publicUrl,
          })),
        }));
        setMuas(enriched);
      }

      setLoading(false);
    };

    loadMuas();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 pb-28 relative">
      {/* WELCOME POPUP */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-white rounded-3xl px-10 py-12 text-center max-w-sm w-full"
            >
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                Welcome, {name}
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight mb-3">
                Beaura ✨
              </h2>

              <p className="text-sm text-gray-600 mb-5">
                Enjoy <span className="font-semibold text-black">15% off</span>{" "}
                your first booking
              </p>

              <div className="mb-8">
                <span className="inline-block px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                  Code: <span className="tracking-widest">BEAURA15</span>
                </span>
              </div>

              <button
                onClick={() => setShowPopup(false)}
                className="px-6 py-2 rounded-full text-sm font-medium
                bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Enjoy ✨
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="pt-24 text-center"
      >
        <p className="text-xs uppercase tracking-wide text-gray-400">
          {getGreeting()}
        </p>

        <h1 className="mt-3 text-6xl font-extrabold tracking-tight">
          Beaura
          </h1>

        <p className="mt-3 text-sm text-gray-500">
          Hand-picked beauty artists, just for you.
        </p>
      </motion.div>

      {/* SEARCH */}
      <div className="max-w-xl mx-auto mt-12">
        <input
          placeholder="Search by artist name or city"
          className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* FILTERS */}
      <div className="max-w-6xl mx-auto mt-8 flex gap-3 overflow-x-auto pb-2">
        <button className="filter-pill">Filter</button>
        <button className="filter-pill">City</button>
        <button className="filter-pill">Price</button>
        <button className="filter-pill">Rating</button>
        <button className="filter-pill">Recommended</button>
        <button className="filter-pill">Low → High</button>
        <button className="filter-pill">High → Low</button>
      </div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto mt-14">
        {loading && (
          <p className="text-sm text-gray-400 text-center">
            Finding artists for you…
          </p>
        )}

        {!loading && muas.length === 0 && (
          <p className="text-sm text-gray-400 text-center">
            No artists available yet.
          </p>
        )}

        <MasonryGrid>
          {muas.map((mua) => (
            <MuaCard key={mua.id} mua={mua} />
          ))}
        </MasonryGrid>
      </div>
    </main>
  );
}