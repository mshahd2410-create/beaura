"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SupportHelpButton from "@/components/support/SupportHelpButton";
import { supabase } from "@/lib/supabaseClient";
import MasonryGrid from "@/components/MasonryGrid";
import MuaCard from "@/components/MuaCard";

const CITIES = ["Cairo", "Giza", "Alexandria", "Mansoura", "Tanta", "Sohag"];

const SERVICE_SECTIONS = [
  {
    title: "Bridal",
    value: "Bridal makeup",
    text: "Wedding day glam, bridal trials, and long-wear looks.",
    image: "/landing/bridal.jpg",
  },
  {
    title: "Engagement",
    value: "Engagement makeup",
    text: "Soft, polished glam for your celebration.",
    image: "/landing/engagement.jpg",
  },
  {
    title: "Soiree",
    value: "Soiree makeup",
    text: "Evening makeup for dinners, parties, and special nights.",
    image: "/landing/soiree.jpg",
  },
  {
    title: "Photoshoot",
    value: "Photoshoot makeup",
    text: "Camera-ready glam for shoots and content days.",
    image: "/landing/photoshoot.jpg",
  },
];

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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.first_name) {
        setName(data.user.user_metadata.first_name);
      }
    });
  }, []);

  useEffect(() => {
    const seen = sessionStorage.getItem("beaura_welcome_seen");

    if (!seen) {
      setShowPopup(true);
      sessionStorage.setItem("beaura_welcome_seen", "true");
    }
  }, []);

  useEffect(() => {
    async function loadMuas() {
      const { data, error } = await supabase
        .from("mua_profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          cities,
          verified,
          status,
          beaura_tier,
          mua_portfolio (
            image_path
          ),
          mua_services (
            name,
            price
          )
        `
        )
        .eq("verified", true)
        .eq("status", "active");

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
    }

    loadMuas();
  }, []);

  const filteredMuas = useMemo(() => {
    return muas.filter((mua) => {
      const fullName =
        `${mua.first_name || ""} ${mua.last_name || ""}`.toLowerCase();

      const cityText = (mua.cities || []).join(" ").toLowerCase();

      const servicesText = (mua.mua_services || [])
        .map((service: any) => service.name)
        .join(" ")
        .toLowerCase();

      const query = searchQuery.toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        cityText.includes(query) ||
        servicesText.includes(query);

      const matchesCity =
        selectedCity === "" || (mua.cities || []).includes(selectedCity);

      const matchesCategory =
        selectedCategory === "All" ||
        servicesText.includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [muas, searchQuery, selectedCity, selectedCategory]);

  const handleServiceClick = (service: string) => {
    setSelectedCategory(service);

    setTimeout(() => {
      document.getElementById("artists")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  return (
    <main className="min-h-screen bg-[#fffafc] px-5 pb-28 pt-24 text-[#171018] sm:px-8">
      <style>{`
        @keyframes beauraMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .beaura-marquee {
          animation: beauraMarquee 28s linear infinite;
        }
      `}</style>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className="w-full max-w-sm rounded-[2rem] border border-[#eadff5] bg-white p-8 text-center shadow-2xl"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                welcome back
              </p>

              <h2 className="mt-4 text-4xl font-light tracking-[-0.06em]">
                A little glam treat.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#6f6077]">
                Use this code on your first booking.
              </p>

              <div className="my-6 rounded-2xl bg-[#f7efff] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
                  promo code
                </p>
                <p className="mt-2 text-2xl tracking-[0.2em] text-purple-700">
                  BEAURA15
                </p>
              </div>

              <button
                onClick={() => setShowPopup(false)}
                className="w-full rounded-full bg-purple-600 py-3 text-sm text-white transition hover:bg-purple-700"
              >
                Start browsing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mx-auto max-w-7xl">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[2.5rem] border border-[#eadff5] bg-white p-7 shadow-sm sm:p-10"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
            {getGreeting()}, {name}
          </p>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-5xl font-light leading-[0.95] tracking-[-0.08em] sm:text-7xl">
                Find your next glam artist.
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#6f6077]">
                Browse verified makeup artists by city, service, or portfolio.
                Save your favorites and book without the DM chaos.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#artists"
                className="rounded-full bg-purple-600 px-6 py-3 text-sm text-white hover:bg-purple-700"
              >
                Browse artists
              </a>

              <SupportHelpButton userType="bride" />
            </div>
          </div>
        </motion.section>

        {/* MOVING STRIP */}
        <div className="mt-5 overflow-hidden rounded-full bg-[#171018] py-3 text-xs uppercase tracking-[0.2em] text-white">
          <div className="beaura-marquee flex w-max gap-10 whitespace-nowrap">
            {[1, 2].map((item) => (
              <div key={item} className="flex gap-10">
                <span>soft glam approved</span>
                <span>bridal artists</span>
                <span>engagement glow</span>
                <span>save your favorites</span>
                <span>browse by city</span>
              </div>
            ))}
          </div>
        </div>

        {/* SERVICE SECTIONS */}
        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SERVICE_SECTIONS.map((item) => (
            <button
              key={item.title}
              onClick={() => handleServiceClick(item.value)}
              className={`group overflow-hidden rounded-[2rem] border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                selectedCategory === item.value
                  ? "border-purple-500"
                  : "border-[#eadff5]"
              }`}
            >
              <div className="relative aspect-[5/6] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/85">
                    {item.title}
                  </p>

                  <h3 className="mt-2 text-3xl font-light tracking-[-0.05em] text-white">
                    {item.title} makeup
                  </h3>

                  <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/85">
                    {item.text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </section>

        {/* FILTERS */}
        <section className="mt-8 rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_120px]">
            <input
              placeholder="Search artist name, city, or service"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-2xl border border-[#eadff5] bg-[#fffafc] px-5 py-4 text-sm outline-none focus:border-purple-500"
            />

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-4 text-sm outline-none focus:border-purple-500"
            >
              <option value="">All cities</option>
              {CITIES.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("");
                setSelectedCategory("All");
              }}
              className="rounded-2xl border border-[#eadff5] bg-white px-5 py-4 text-sm hover:bg-[#f7efff]"
            >
              Clear
            </button>
          </div>
        </section>

        {/* ALL ARTISTS */}
        <section id="artists" className="mt-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                discover artists
              </p>

              <h2 className="mt-2 text-4xl font-light tracking-[-0.06em]">
                {selectedCategory === "All"
                  ? "All makeup artists"
                  : selectedCategory.replace(" makeup", "") + " artists"}
              </h2>
            </div>

            <p className="rounded-full bg-white px-5 py-3 text-sm text-[#6f6077] shadow-sm">
              {filteredMuas.length} found
            </p>
          </div>

          {loading && (
            <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#8a7d91]">
              Finding artists for you...
            </div>
          )}

          {!loading && filteredMuas.length === 0 && (
            <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center">
              <h3 className="text-3xl font-light tracking-[-0.05em]">
                No artists found.
              </h3>
              <p className="mt-3 text-sm text-[#6f6077]">
                Try another city, service, or clear your search.
              </p>
            </div>
          )}

          {!loading && filteredMuas.length > 0 && (
            <MasonryGrid>
              {filteredMuas.map((mua) => (
                <MuaCard key={mua.id} mua={mua} />
              ))}
            </MasonryGrid>
          )}
        </section>
      </section>
    </main>
  );
}