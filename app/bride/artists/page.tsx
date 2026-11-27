"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown, CalendarDays, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import MuaCard from "@/components/MuaCard";

const SERVICE_OPTIONS = [
  { title: "Bridal", value: "Bridal makeup" },
  { title: "Engagement", value: "Engagement makeup" },
  { title: "Soiree", value: "Soiree makeup" },
  { title: "Photoshoot", value: "Photoshoot makeup" },
];
const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rated" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];
const todayInEgypt = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

export default function BrideArtistsPage() {
  const [muas, setMuas] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minimumRating, setMinimumRating] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [availabilityFilter, setAvailabilityFilter] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState(todayInEgypt);
  const [availableMuaIds, setAvailableMuaIds] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [filterOpen, setFilterOpen] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("q") || "");
    setSelectedCity(params.get("city") || "");
    setSelectedCategory(params.get("service") || "All");
    setMinimumRating(params.get("rating") || "");
    setMinPrice(params.get("min") || "");
    setMaxPrice(params.get("max") || "");
    setSortBy(params.get("sort") || "recommended");
    setAvailabilityFilter(params.get("available") === "1");
    setAvailabilityDate(params.get("date") || todayInEgypt());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadArtists() {
      setLoading(true);
      const { data, error } = await supabase
        .from("mua_profiles")
        .select(`
          id, first_name, last_name, cities, verified, status, beaura_tier,
          mua_portfolio ( image_path ),
          mua_services ( name, price )
        `)
        .eq("verified", true)
        .eq("status", "active");

      if (!cancelled && !error && data) {
        const enriched = data.map((mua: any) => ({
          ...mua,
          mua_portfolio: (mua.mua_portfolio || []).map((p: any) => ({
            publicUrl: supabase.storage.from("mua-portfolio").getPublicUrl(p.image_path).data.publicUrl,
          })),
        }));
        setMuas(enriched);
        const { data: reviewRows, error: reviewsError } = await supabase
          .from("mua_reviews")
          .select("mua_id, rating");
        if (!cancelled && !reviewsError && reviewRows) {
          const totals: Record<string, { sum: number; count: number }> = {};
          reviewRows.forEach((review: any) => {
            if (!review.mua_id || !Number.isFinite(Number(review.rating))) return;
            const current = totals[review.mua_id] || { sum: 0, count: 0 };
            current.sum += Number(review.rating);
            current.count += 1;
            totals[review.mua_id] = current;
          });
          const next: Record<string, { average: number; count: number }> = {};
          Object.entries(totals).forEach(([id, total]) => {
            next[id] = { average: total.sum / total.count, count: total.count };
          });
          setRatings(next);
        }
      }
      if (!cancelled) setLoading(false);
    }
    loadArtists();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!availabilityFilter || !availabilityDate) {
      setAvailableMuaIds([]);
      setAvailabilityError("");
      setAvailabilityLoading(false);
      return;
    }
    let cancelled = false;
    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      const { data, error } = await supabase.rpc("get_available_muas_for_date", { p_date: availabilityDate });
      if (cancelled) return;
      if (error) {
        setAvailableMuaIds([]);
        setAvailabilityError("We couldn't check availability right now. Please try again.");
      } else {
        setAvailableMuaIds((data || []).map((row: any) => row.mua_id));
      }
      setAvailabilityLoading(false);
    }
    loadAvailability();
    return () => { cancelled = true; };
  }, [availabilityFilter, availabilityDate]);

  const filteredMuas = useMemo(() => {
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);
    const query = searchQuery.trim().toLowerCase();
    const matching = muas.filter((mua) => {
      const fullName = `${mua.first_name || ""} ${mua.last_name || ""}`.toLowerCase();
      const cityText = (mua.cities || []).join(" ").toLowerCase();
      const services = mua.mua_services || [];
      const servicesText = services.map((service: any) => service.name).join(" ").toLowerCase();
      const matchesSearch = !query || fullName.includes(query) || cityText.includes(query) || servicesText.includes(query);
      const matchesCity = selectedCity === "" || (mua.cities || []).includes(selectedCity);
      const matchesCategory = selectedCategory === "All" || servicesText.includes(selectedCategory.toLowerCase());
      const prices = services.map((service: any) => Number(service?.price)).filter((price: number) => Number.isFinite(price) && price > 0);
      const startingPrice = prices.length ? Math.min(...prices) : null;
      const matchesMin = min === null || (startingPrice !== null && startingPrice >= min);
      const matchesMax = max === null || (startingPrice !== null && startingPrice <= max);
      const rating = ratings[mua.id];
      const matchesRating = minimumRating === "" || (rating?.count > 0 && rating.average >= Number(minimumRating));
      const matchesAvailability = !availabilityFilter || availableMuaIds.includes(mua.id);
      return matchesSearch && matchesCity && matchesCategory && matchesMin && matchesMax && matchesRating && matchesAvailability;
    });
    const startingPrice = (mua: any) => {
      const prices = (mua.mua_services || []).map((service: any) => Number(service?.price)).filter((price: number) => Number.isFinite(price) && price > 0);
      return prices.length ? Math.min(...prices) : null;
    };
    return [...matching].sort((a, b) => {
      if (sortBy === "recommended") return 0;
      if (sortBy === "price-low") return (startingPrice(a) ?? Number.POSITIVE_INFINITY) - (startingPrice(b) ?? Number.POSITIVE_INFINITY);
      if (sortBy === "price-high") return (startingPrice(b) ?? Number.NEGATIVE_INFINITY) - (startingPrice(a) ?? Number.NEGATIVE_INFINITY);
      if (sortBy === "rating") return (ratings[b.id]?.average ?? -1) - (ratings[a.id]?.average ?? -1) || (ratings[b.id]?.count ?? 0) - (ratings[a.id]?.count ?? 0);
      if (sortBy === "name") return `${a.first_name || ""} ${a.last_name || ""}`.localeCompare(`${b.first_name || ""} ${b.last_name || ""}`);
      return 0;
    });
  }, [muas, ratings, searchQuery, selectedCity, selectedCategory, minimumRating, minPrice, maxPrice, sortBy, availabilityFilter, availableMuaIds]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedCategory("All");
    setMinimumRating("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("recommended");
    setAvailabilityFilter(false);
    setAvailabilityDate(todayInEgypt());
    setAvailableMuaIds([]);
    setAvailabilityError("");
  };

  const clearOnlyFilters = () => {
    setSelectedCity("");
    setSelectedCategory("All");
    setMinimumRating("");
    setMinPrice("");
    setMaxPrice("");
    setAvailabilityFilter(false);
    setAvailableMuaIds([]);
    setAvailabilityError("");
  };

  return (
    <main className="min-h-screen bg-[#fffafc] px-3 pb-16 pt-24 text-[#171018] sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <Link href="/bride/home" className="inline-flex items-center gap-2 text-sm text-purple-700 hover:underline"><ArrowLeft size={16}/> Back to your Beaura home</Link>
        <header className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700">The Beaura directory</p>
            <h1 className="mt-2 text-4xl font-light tracking-[-0.06em] sm:text-6xl">All makeup artists</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#6f6077]">Explore every verified artist, compare portfolios and prices, and find the right match for your occasion.</p>
          </div>
          <span className="w-fit rounded-full bg-[#f1e5ff] px-5 py-2.5 text-sm text-purple-700">{filteredMuas.length} {filteredMuas.length === 1 ? "artist" : "artists"}</span>
        </header>

        <section className="mt-8 rounded-2xl border border-[#eadff5] bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input aria-label="Search makeup artists" placeholder="Search by artist name, city or service..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="min-w-0 rounded-xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm outline-none focus:border-purple-500 sm:rounded-2xl sm:px-5 sm:py-4"/>
            <button type="button" onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }} aria-expanded={filterOpen} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm ${filterOpen ? "border-purple-400 bg-[#f7efff]" : "border-[#eadff5] hover:bg-[#f7efff]"}`}><SlidersHorizontal size={16}/> Filters</button>
            <button type="button" onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }} aria-expanded={sortOpen} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm ${sortOpen ? "border-purple-400 bg-[#f7efff]" : "border-[#eadff5] hover:bg-[#f7efff]"}`}><ArrowUpDown size={16}/> Sort: {SORT_OPTIONS.find((item) => item.value === sortBy)?.label}</button>
          </div>

          {filterOpen && <div className="mt-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
            <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Filter artists</p><button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={16}/></button></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-medium text-[#6f6077]">City / location<select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm text-[#171018]"><option value="">All cities</option>{Array.from(new Set(muas.flatMap((mua: any) => mua.cities || []))).sort().map((city: string) => <option key={city} value={city}>{city}</option>)}</select></label>
              <label className="text-xs font-medium text-[#6f6077]">Service<select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm text-[#171018]"><option value="All">All services</option>{SERVICE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.title}</option>)}</select></label>
              <label className="text-xs font-medium text-[#6f6077]">Minimum rating<select value={minimumRating} onChange={(e) => setMinimumRating(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm text-[#171018]"><option value="">Any rating</option><option value="3">3 stars & up</option><option value="4">4 stars & up</option><option value="4.5">4.5 stars & up</option></select></label>
              <div className="grid grid-cols-2 gap-2"><label className="text-xs font-medium text-[#6f6077]">Min price (EGP)<input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Any" className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm"/></label><label className="text-xs font-medium text-[#6f6077]">Max price (EGP)<input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-3 text-sm"/></label></div>
            </div>
            <div className="mt-4 rounded-xl border border-[#eadff5] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3"><span className="rounded-xl bg-[#f1e5ff] p-2 text-purple-700"><CalendarDays size={18}/></span><div><p className="text-sm font-medium text-[#171018]">Available on a specific date</p><p className="mt-1 text-xs leading-5 text-[#8a7d91]">Only show artists with no bookings or blocked time that day.</p></div></div>
                <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm text-[#6f6077]"><input type="checkbox" checked={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.checked)} className="h-4 w-4 accent-purple-700"/> Filter by availability</label><input aria-label="Choose availability date" type="date" min={todayInEgypt()} value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} className="w-full rounded-xl border border-[#eadff5] bg-[#fffafc] px-3 py-2.5 text-sm text-[#171018] sm:w-auto"/></div>
              </div>
              {availabilityFilter && availabilityLoading && <p className="mt-3 text-xs text-purple-700">Checking artist calendars…</p>}
              {availabilityFilter && availabilityError && <p className="mt-3 text-xs text-red-600">{availabilityError}</p>}
              {availabilityFilter && !availabilityLoading && !availabilityError && <p className="mt-3 text-xs text-[#6f6077]">{availableMuaIds.length} artists are available on {new Date(`${availabilityDate}T12:00:00`).toLocaleDateString("en-EG", { day: "numeric", month: "long", year: "numeric" })}.</p>}
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-3"><button type="button" onClick={clearOnlyFilters} className="text-sm text-purple-700 hover:underline">Clear filters</button><span className="text-xs text-[#8a7d91]">Ratings are based on published reviews.</span></div>
          </div>}

          {sortOpen && <div className="mt-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4"><p className="mb-3 text-sm font-medium">Sort artists</p><div className="flex flex-wrap gap-2">{SORT_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => { setSortBy(option.value); setSortOpen(false); }} className={`rounded-full px-4 py-2 text-xs ${sortBy === option.value ? "bg-[#171018] text-white" : "bg-[#f1e5ff] text-[#6f6077]"}`}>{option.label}</button>)}</div></div>}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#8a7d91]">{filteredMuas.length} artists match your search</p><button type="button" onClick={resetFilters} className="text-xs text-purple-700 hover:underline">Reset everything</button></div>
        </section>

        <section className="mt-8">
          {loading && <div className="rounded-[2rem] border border-[#eadff5] bg-white p-12 text-center text-sm text-[#6f6077]">Loading makeup artists...</div>}
          {!loading && availabilityFilter && availabilityLoading && <div className="rounded-[2rem] border border-[#eadff5] bg-white p-8 text-center text-sm text-[#6f6077]">Checking availability for {new Date(`${availabilityDate}T12:00:00`).toLocaleDateString("en-EG", { day: "numeric", month: "long", year: "numeric" })}…</div>}
          {!loading && !availabilityLoading && filteredMuas.length === 0 && <div className="rounded-[2rem] border border-[#eadff5] bg-white px-6 py-14 text-center"><h2 className="text-3xl font-light tracking-[-0.05em]">No artists match those filters.</h2><p className="mt-3 text-sm text-[#6f6077]">Try a different search or clear your filters.</p><button type="button" onClick={resetFilters} className="mt-6 rounded-full bg-[#171018] px-6 py-3 text-sm text-white">Show all artists</button></div>}
          {!loading && !availabilityLoading && filteredMuas.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">{filteredMuas.map((mua) => <MuaCard key={mua.id} mua={{ ...mua, rating: ratings[mua.id] }} compact/>)}</div>}
        </section>
      </div>
    </main>
  );
}
