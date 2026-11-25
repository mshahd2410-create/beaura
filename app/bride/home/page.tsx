"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
    image: "/Landing/bridal.jpg",
  },
  {
    title: "Engagement",
    value: "Engagement makeup",
    text: "Soft, polished glam for your celebration.",
    image: "/Landing/engagement.jpg",
  },
  {
    title: "Soiree",
    value: "Soiree makeup",
    text: "Evening makeup for dinners, parties, and special nights.",
    image: "/Landing/soiree.jpg",
  },
  {
    title: "Photoshoot",
    value: "Photoshoot makeup",
    text: "Camera-ready glam for shoots and content days.",
    image: "/Landing/photoshoot.jpg",
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.first_name) {
        setName(data.user.user_metadata.first_name);
      }
    });
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
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);
    const query = searchQuery.trim().toLowerCase();

    const matching = muas.filter((mua) => {
      const fullName =
        `${mua.first_name || ""} ${mua.last_name || ""}`.toLowerCase();
      const cityText = (mua.cities || []).join(" ").toLowerCase();
      const services = mua.mua_services || [];
      const servicesText = services
        .map((service: any) => service.name)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        cityText.includes(query) ||
        servicesText.includes(query);
      const matchesCity =
        selectedCity === "" || (mua.cities || []).includes(selectedCity);
      const matchesCategory =
        selectedCategory === "All" ||
        servicesText.includes(selectedCategory.toLowerCase());

      const prices = services
        .map((service: any) => Number(service?.price))
        .filter((price: number) => Number.isFinite(price) && price > 0);
      const startingPrice = prices.length ? Math.min(...prices) : null;
      const matchesMin = min === null || (startingPrice !== null && startingPrice >= min);
      const matchesMax = max === null || (startingPrice !== null && startingPrice <= max);

      return matchesSearch && matchesCity && matchesCategory && matchesMin && matchesMax;
    });

    return [...matching].sort((a, b) => {
      const getStartingPrice = (mua: any) => {
        const prices = (mua.mua_services || [])
          .map((service: any) => Number(service?.price))
          .filter((price: number) => Number.isFinite(price) && price > 0);
        return prices.length ? Math.min(...prices) : null;
      };

      if (sortBy === "price-low") {
        return (getStartingPrice(a) ?? Number.POSITIVE_INFINITY) -
          (getStartingPrice(b) ?? Number.POSITIVE_INFINITY);
      }
      if (sortBy === "price-high") {
        return (getStartingPrice(b) ?? Number.NEGATIVE_INFINITY) -
          (getStartingPrice(a) ?? Number.NEGATIVE_INFINITY);
      }
      if (sortBy === "name") {
        return `${a.first_name || ""} ${a.last_name || ""}`.localeCompare(
          `${b.first_name || ""} ${b.last_name || ""}`
        );
      }
      return 0;
    });
  }, [muas, searchQuery, selectedCity, selectedCategory, minPrice, maxPrice, sortBy]);

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
    <main className="min-h-screen bg-[#fffafc] pb-24 pt-24 text-[#171018]">
      <style>{`
        @keyframes beauraMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .beaura-marquee { animation: beauraMarquee 30s linear infinite; }
      `}</style>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#f1e5ff] px-7 py-10 sm:px-12 sm:py-14"
        >
          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#ffe3ef] blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">{getGreeting()}, {name}</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-light leading-[0.94] tracking-[-0.075em] sm:text-7xl">Find the makeup artist who gets your look.</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[#655968]">Explore verified artists, see their makeup work, compare services and prices, and send a booking request when you’re ready.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#artists" className="rounded-full bg-[#171018] px-7 py-3.5 text-sm text-white transition hover:bg-purple-700">Explore makeup artists</a>
              <SupportHelpButton userType="bride" />
            </div>
          </div>
          <div className="relative mt-10 grid grid-cols-3 gap-2 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:w-[42%]">
            {["/Landing/bridal.jpg","/Landing/engagement.jpg","/Landing/soiree.jpg"].map((image,index)=>(
              <div key={image} className={index===1?"-mt-6 overflow-hidden rounded-t-full rounded-b-2xl":"overflow-hidden rounded-[1.25rem]"}>
                <img src={image} alt="Makeup inspiration" className="h-28 w-full object-cover sm:h-36"/>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="mt-6 overflow-hidden rounded-full bg-[#171018] py-3 text-xs uppercase tracking-[0.18em] text-white">
          <div className="beaura-marquee flex w-max gap-10 whitespace-nowrap">
            {[1,2].map((item)=><div key={item} className="flex gap-10"><span>Verified makeup artists</span><span>Clear service prices</span><span>Bridal and event makeup</span><span>Your bookings in one place</span><span>Save your favourite artists</span></div>)}
          </div>
        </div>

        <section className="mt-16">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Browse by occasion</p>
            <h2 className="mt-3 text-4xl font-light tracking-[-0.065em] sm:text-5xl">What do you need makeup for?</h2>
            <p className="mt-3 text-sm leading-7 text-[#6f6077]">Choose an occasion to see artists who offer that service.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SERVICE_SECTIONS.map((item,index)=>(
              <button key={item.title} onClick={()=>handleServiceClick(item.value)} className={`group overflow-hidden rounded-[1.75rem] border bg-white text-left transition hover:-translate-y-1 hover:shadow-xl ${selectedCategory===item.value?"border-purple-500 shadow-md":"border-[#eadff5]"}`}>
                <div className="relative aspect-[5/4] overflow-hidden">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"/>
                  <div className="absolute inset-x-0 bottom-0 p-5"><p className="text-xs uppercase tracking-[0.17em] text-white/80">0{index+1}</p><h3 className="mt-1 text-2xl font-light text-white">{item.title} makeup</h3></div>
                </div>
                <p className="p-4 text-sm leading-6 text-[#6f6077]">{item.text}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Find the right artist</p>
            <h2 className="mt-2 text-3xl font-light tracking-[-0.05em]">Search by name, city or service</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_230px_auto]">
            <input aria-label="Search makeup artists" placeholder="Try an artist name, Cairo, bridal makeup..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="min-w-0 rounded-2xl border border-[#eadff5] bg-[#fffafc] px-5 py-4 text-sm outline-none transition focus:border-purple-500"/>
            <select aria-label="Filter by city" value={selectedCity} onChange={(e)=>setSelectedCity(e.target.value)} className="rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-4 text-sm outline-none focus:border-purple-500">
              <option value="">All cities</option>
              {CITIES.map(city=><option key={city} value={city}>{city}</option>)}
            </select>
            <button onClick={()=>{setSearchQuery("");setSelectedCity("");setSelectedCategory("All");setMinPrice("");setMaxPrice("");setSortBy("recommended");}} className="rounded-2xl border border-[#eadff5] px-6 py-4 text-sm transition hover:bg-[#f7efff]">Clear filters</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs font-medium text-[#6f6077]">
              Minimum price (EGP)
              <input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event)=>setMinPrice(event.target.value)} placeholder="No minimum" className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm text-[#171018] outline-none focus:border-purple-500"/>
            </label>
            <label className="block text-xs font-medium text-[#6f6077]">
              Maximum price (EGP)
              <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event)=>setMaxPrice(event.target.value)} placeholder="No maximum" className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm text-[#171018] outline-none focus:border-purple-500"/>
            </label>
            <label className="block text-xs font-medium text-[#6f6077] sm:col-span-2">
              Sort artists
              <select aria-label="Sort makeup artists" value={sortBy} onChange={(event)=>setSortBy(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm text-[#171018] outline-none focus:border-purple-500">
                <option value="recommended">Recommended order</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Artist name: A to Z</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["All","Bridal makeup","Engagement makeup","Soiree makeup","Photoshoot makeup"].map((category)=> (
              <button key={category} onClick={()=>setSelectedCategory(category)} className={`rounded-full px-4 py-2 text-xs transition ${selectedCategory===category?"bg-[#171018] text-white":"bg-[#f7efff] text-[#6f6077] hover:text-purple-700"}`}>{category==="All"?"All services":category}</button>
            ))}
          </div>
        </section>

        <section id="artists" className="mt-16 scroll-mt-28">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Makeup artists</p>
              <h2 className="mt-2 text-4xl font-light tracking-[-0.065em] sm:text-5xl">{selectedCategory==="All"?"Explore makeup artists":selectedCategory}</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#6f6077]">Open a profile to view the artist’s portfolio, services, prices and booking options.</p>
            </div>
            <span className="w-fit rounded-full bg-[#f1e5ff] px-5 py-2.5 text-sm text-purple-700">{filteredMuas.length} {filteredMuas.length===1?"artist":"artists"}</span>
          </div>

          {loading && <div className="rounded-[2rem] border border-[#eadff5] bg-white p-12 text-center text-sm text-[#6f6077]">Loading makeup artists...</div>}
          {!loading && filteredMuas.length===0 && (
            <div className="rounded-[2rem] border border-[#eadff5] bg-white px-6 py-14 text-center">
              <h3 className="text-3xl font-light tracking-[-0.05em]">No artists match those filters.</h3>
              <p className="mt-3 text-sm text-[#6f6077]">Try a different city or service, or clear your filters.</p>
              <button onClick={()=>{setSearchQuery("");setSelectedCity("");setSelectedCategory("All");setMinPrice("");setMaxPrice("");setSortBy("recommended");}} className="mt-6 rounded-full bg-[#171018] px-6 py-3 text-sm text-white">Show all artists</button>
            </div>
          )}
          {!loading && filteredMuas.length>0 && (
            <>
              <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {filteredMuas.slice(0,5).map((mua)=><MuaCard key={mua.id} mua={mua}/>)}
              </div>
              {filteredMuas.length>5 && (
                <details className="mt-7 rounded-[1.5rem] border border-[#eadff5] bg-white p-5">
                  <summary className="cursor-pointer list-none text-center text-sm font-medium text-purple-700">Show all {filteredMuas.length} artists</summary>
                  <div className="mt-6"><MasonryGrid>{filteredMuas.slice(5).map((mua)=><MuaCard key={mua.id} mua={mua}/>)}</MasonryGrid></div>
                </details>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );

}