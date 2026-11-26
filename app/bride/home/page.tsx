"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, SlidersHorizontal, ArrowUpDown, X, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import SupportHelpButton from "@/components/support/SupportHelpButton";
import { supabase } from "@/lib/supabaseClient";
import MasonryGrid from "@/components/MasonryGrid";
import MuaCard from "@/components/MuaCard";

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
  const [availabilityFilter, setAvailabilityFilter] = useState(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [minimumRating, setMinimumRating] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }));
  const [availableMuaIds, setAvailableMuaIds] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("beaura_recently_viewed_muas") || "[]");
      if (Array.isArray(saved)) {
        setRecentlyViewedIds(saved.filter((item): item is string => typeof item === "string").slice(0, 8));
      }
    } catch (storageError) {
      console.warn("Could not load recently viewed artists:", storageError);
    }
  }, []);

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

        const { data: reviewRows, error: reviewsError } = await supabase
          .from("mua_reviews")
          .select("mua_id, rating");

        if (!reviewsError && reviewRows) {
          const totals: Record<string, { sum: number; count: number }> = {};
          reviewRows.forEach((review: any) => {
            if (!review.mua_id || !Number.isFinite(Number(review.rating))) return;
            const current = totals[review.mua_id] || { sum: 0, count: 0 };
            current.sum += Number(review.rating);
            current.count += 1;
            totals[review.mua_id] = current;
          });
          const nextRatings: Record<string, { average: number; count: number }> = {};
          Object.entries(totals).forEach(([muaId, total]) => {
            nextRatings[muaId] = { average: total.sum / total.count, count: total.count };
          });
          setRatings(nextRatings);
        }
      }

      setLoading(false);
    }

    loadMuas();
  }, []);

  useEffect(() => {
    if (!availabilityFilter || !availabilityDate) {
      setAvailableMuaIds([]);
      setAvailabilityError("");
      setAvailabilityLoading(false);
      return;
    }

    let cancelled = false;
    async function loadAvailableArtists() {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      const { data, error } = await supabase.rpc("get_available_muas_for_date", {
        p_date: availabilityDate,
      });

      if (cancelled) return;
      if (error) {
        console.error("ARTIST AVAILABILITY LOAD ERROR:", error);
        setAvailableMuaIds([]);
        setAvailabilityError("We couldn't check availability right now. Please try again.");
      } else {
        setAvailableMuaIds((data || []).map((row: any) => row.mua_id));
      }
      setAvailabilityLoading(false);
    }

    loadAvailableArtists();
    return () => { cancelled = true; };
  }, [availabilityFilter, availabilityDate]);

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
      const rating = ratings[mua.id];
      const matchesRating = minimumRating === "" || (rating?.count > 0 && rating.average >= Number(minimumRating));
      const matchesAvailability = !availabilityFilter || availableMuaIds.includes(mua.id);

      return matchesSearch && matchesCity && matchesCategory && matchesMin && matchesMax && matchesRating && matchesAvailability;
    });

    return [...matching].sort((a, b) => {
      const getStartingPrice = (mua: any) => {
        const prices = (mua.mua_services || [])
          .map((service: any) => Number(service?.price))
          .filter((price: number) => Number.isFinite(price) && price > 0);
        return prices.length ? Math.min(...prices) : null;
      };

      if (sortBy === "recommended") return 0;
      if (sortBy === "price-low") {
        return (getStartingPrice(a) ?? Number.POSITIVE_INFINITY) -
          (getStartingPrice(b) ?? Number.POSITIVE_INFINITY);
      }
      if (sortBy === "price-high") {
        return (getStartingPrice(b) ?? Number.NEGATIVE_INFINITY) -
          (getStartingPrice(a) ?? Number.NEGATIVE_INFINITY);
      }
      if (sortBy === "rating") {
        return (ratings[b.id]?.average ?? -1) - (ratings[a.id]?.average ?? -1) ||
          (ratings[b.id]?.count ?? 0) - (ratings[a.id]?.count ?? 0);
      }
      if (sortBy === "name") {
        return `${a.first_name || ""} ${a.last_name || ""}`.localeCompare(
          `${b.first_name || ""} ${b.last_name || ""}`
        );
      }
      return (ratings[b.id]?.average ?? -1) - (ratings[a.id]?.average ?? -1) ||
        (ratings[b.id]?.count ?? 0) - (ratings[a.id]?.count ?? 0);
    });
  }, [muas, ratings, searchQuery, selectedCity, selectedCategory, minPrice, maxPrice, minimumRating, sortBy, availabilityFilter, availableMuaIds]);

  const recentlyViewedMuas = recentlyViewedIds
    .map((id) => muas.find((mua) => mua.id === id))
    .filter(Boolean)
    .slice(0, 6);

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

        {recentlyViewedMuas.length > 0 && (
          <section className="mt-16">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Pick up where you left off</p>
              <h2 className="mt-2 text-3xl font-light tracking-[-0.05em]">Recently viewed artists</h2>
              <p className="mt-2 text-sm text-[#6f6077]">Artists you opened recently are saved on this device for quick access.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {recentlyViewedMuas.map((mua: any) => <MuaCard key={mua.id} mua={{...mua, rating: ratings[mua.id]}} />)}
            </div>
          </section>
        )}

        <section className="mt-16 rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Find the right artist</p>
            <h2 className="mt-2 text-3xl font-light tracking-[-0.05em]">Search by name, city or service</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <input aria-label="Search makeup artists" placeholder="Try an artist name, Cairo, bridal makeup..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="min-w-0 rounded-2xl border border-[#eadff5] bg-[#fffafc] px-5 py-4 text-sm outline-none transition focus:border-purple-500"/>
            <button type="button" onClick={()=>{setFilterOpen(!filterOpen);setSortOpen(false);}} aria-expanded={filterOpen} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm transition ${filterOpen?"border-purple-400 bg-[#f7efff]":"border-[#eadff5] hover:bg-[#f7efff]"}`}><SlidersHorizontal size={16}/> Filter</button>
            <button type="button" onClick={()=>{setSortOpen(!sortOpen);setFilterOpen(false);}} aria-expanded={sortOpen} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm transition ${sortOpen?"border-purple-400 bg-[#f7efff]":"border-[#eadff5] hover:bg-[#f7efff]"}`}><ArrowUpDown size={16}/> Sort</button>
            <Link href="/bride/favorites" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#171018] px-5 py-4 text-sm text-white transition hover:bg-purple-700"><Heart size={16}/> Favorites</Link>
          </div>
          {filterOpen && <div className="mt-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Filter artists</p><button type="button" onClick={()=>setFilterOpen(false)} aria-label="Close filters"><X size={16}/></button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-[#6f6077]">City / location<select value={selectedCity} onChange={(e)=>setSelectedCity(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm text-[#171018]"><option value="">All cities</option>{Array.from(new Set(muas.flatMap((mua:any)=>mua.cities||[]))).sort().map((city:string)=><option key={city} value={city}>{city}</option>)}</select></label>
            <label className="text-xs font-medium text-[#6f6077]">Service<select value={selectedCategory} onChange={(e)=>setSelectedCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm text-[#171018]"><option value="All">All services</option>{SERVICE_SECTIONS.map((item)=><option key={item.value} value={item.value}>{item.title}</option>)}</select></label>
            <label className="text-xs font-medium text-[#6f6077]">Minimum rating<select value={minimumRating} onChange={(e)=>setMinimumRating(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm text-[#171018]"><option value="">Any rating</option><option value="3">3 stars & up</option><option value="4">4 stars & up</option><option value="4.5">4.5 stars & up</option></select></label>
            <div className="grid grid-cols-2 gap-2"><label className="text-xs font-medium text-[#6f6077]">Min price (EGP)<input type="number" min="0" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} placeholder="Any" className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm"/></label><label className="text-xs font-medium text-[#6f6077]">Max price (EGP)<input type="number" min="0" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder="Any" className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm"/></label></div>
          </div>
          <div className="mt-4 rounded-xl border border-[#eadff5] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-[#f1e5ff] p-2 text-purple-700"><CalendarDays size={18}/></span>
                <div><p className="text-sm font-medium text-[#171018]">Available on a specific date</p><p className="mt-1 text-xs leading-5 text-[#8a7d91]">Only show artists with no bookings or blocked time that day.</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-[#6f6077]"><input type="checkbox" checked={availabilityFilter} onChange={(e)=>setAvailabilityFilter(e.target.checked)} className="h-4 w-4 accent-purple-700"/> Filter by availability</label>
                <input aria-label="Choose availability date" type="date" value={availabilityDate} min={new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })} onChange={(e)=>setAvailabilityDate(e.target.value)} className="w-full rounded-xl border border-[#eadff5] bg-[#fffafc] px-3 py-2.5 text-sm text-[#171018] outline-none focus:border-purple-500 sm:w-auto"/>
              </div>
            </div>
            {availabilityFilter && availabilityLoading && <p className="mt-3 text-xs text-purple-700">Checking artist calendars…</p>}
            {availabilityFilter && availabilityError && <p className="mt-3 text-xs text-red-600">{availabilityError}</p>}
            {availabilityFilter && !availabilityLoading && !availabilityError && <p className="mt-3 text-xs text-[#6f6077]">{availableMuaIds.length} artists are available on {new Date(`${availabilityDate}T12:00:00`).toLocaleDateString("en-EG", {day:"numeric",month:"long",year:"numeric"})}.</p>}
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-3"><button type="button" onClick={()=>{setSelectedCity("");setSelectedCategory("All");setMinimumRating("");setMinPrice("");setMaxPrice("");setAvailabilityFilter(false);}} className="text-sm text-purple-700 hover:underline">Clear filters</button><span className="text-xs text-[#8a7d91]">Ratings are based on published reviews.</span></div></div>}
          {sortOpen && <div className="mt-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4"><p className="mb-3 text-sm font-medium">Sort artists</p><div className="flex flex-wrap gap-2">{[{value:"recommended",label:"Recommended"},{value:"rating",label:"Highest rated"},{value:"price-low",label:"Price: low to high"},{value:"price-high",label:"Price: high to low"},{value:"name",label:"Name: A to Z"}].map((option)=><button key={option.value} type="button" onClick={()=>{setSortBy(option.value);setSortOpen(false);}} className={`rounded-full px-4 py-2 text-xs ${sortBy===option.value?"bg-[#171018] text-white":"bg-[#f1e5ff] text-[#6f6077]"}`}>{option.label}</button>)}</div></div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#8a7d91]">{filteredMuas.length} artists match your search</p><button type="button" onClick={()=>{setSearchQuery("");setSelectedCity("");setSelectedCategory("All");setMinimumRating("");setMinPrice("");setMaxPrice("");setSortBy("recommended");setAvailabilityFilter(false);setAvailableMuaIds([]);setAvailabilityError("");}} className="text-xs text-purple-700 hover:underline">Reset everything</button></div>
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
          {availabilityFilter && availabilityLoading && <div className="rounded-[2rem] border border-[#eadff5] bg-white p-8 text-center text-sm text-[#6f6077]">Checking availability for {new Date(`${availabilityDate}T12:00:00`).toLocaleDateString("en-EG", {day:"numeric",month:"long",year:"numeric"})}…</div>}
          {!loading && !availabilityLoading && filteredMuas.length===0 && (
            <div className="rounded-[2rem] border border-[#eadff5] bg-white px-6 py-14 text-center">
              <h3 className="text-3xl font-light tracking-[-0.05em]">No artists match those filters.</h3>
              <p className="mt-3 text-sm text-[#6f6077]">{availabilityFilter ? "No artists are fully free on this date. Try another date." : "Try a different city or service, or clear your filters."}</p>
              <button onClick={()=>{setSearchQuery("");setSelectedCity("");setSelectedCategory("All");setMinPrice("");setMaxPrice("");setMinimumRating("");setSortBy("recommended");setAvailabilityFilter(false);setAvailableMuaIds([]);setAvailabilityError("");}} className="mt-6 rounded-full bg-[#171018] px-6 py-3 text-sm text-white">Show all artists</button>
            </div>
          )}
          {!loading && !availabilityLoading && filteredMuas.length>0 && (
            <>
              <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {filteredMuas.slice(0,5).map((mua)=><MuaCard key={mua.id} mua={{...mua, rating: ratings[mua.id]}}/>)}
              </div>
              {filteredMuas.length>5 && (
                <details className="mt-7 rounded-[1.5rem] border border-[#eadff5] bg-white p-5">
                  <summary className="cursor-pointer list-none text-center text-sm font-medium text-purple-700">Show all {filteredMuas.length} artists</summary>
                  <div className="mt-6"><MasonryGrid>{filteredMuas.slice(5).map((mua)=><MuaCard key={mua.id} mua={{...mua, rating: ratings[mua.id]}}/>)}</MasonryGrid></div>
                </details>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );

}