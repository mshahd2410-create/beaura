"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Heart, ArrowRight } from "lucide-react";

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("name");

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

    const { data } = await supabase
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
          ),
          mua_services (
            name,
            price
          )
        )
      `)
      .eq("bride_id", user.id);

    const formatted =
      data?.map((fav: any) => {
        const mua = fav.mua_profiles;

        const image = mua?.mua_portfolio?.[0]?.image_path
          ? supabase.storage
              .from("mua-portfolio")
              .getPublicUrl(mua.mua_portfolio[0].image_path).data.publicUrl
          : null;

        return { ...mua, image, mua_services: mua?.mua_services || [] };
      }) || [];

    setFavorites(
      formatted.filter(
        (mua: any) => mua?.verified === true && mua?.status === "active"
      )
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffafc] px-4 pb-28 pt-24 text-[#171018] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
            your collection
          </p>
          <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] sm:text-7xl">
            Favorites
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
            Your saved makeup artists, ready whenever you want to compare styles or book.
          </p>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-[#6f6077]">
            Loading your favorites…
          </p>
        ) : favorites.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f7efff] text-purple-700">
              <Heart size={22} />
            </div>
            <h2 className="mt-6 text-2xl font-light tracking-[-0.05em]">
              No favorites yet.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6f6077]">
              Save artists you love so you can come back to them later.
            </p>
            <Link
              href="/bride/home"
              className="mt-7 inline-flex rounded-full bg-[#171018] px-6 py-3 text-sm font-medium text-white"
            >
              Discover artists
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-medium text-[#6f6077]">Search favorites
                  <input value={searchQuery} onChange={(event)=>setSearchQuery(event.target.value)} placeholder="Artist, city or service" className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm text-[#171018] outline-none focus:border-purple-500"/>
                </label>
                <label className="text-xs font-medium text-[#6f6077]">City
                  <select value={selectedCity} onChange={(event)=>setSelectedCity(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm text-[#171018] outline-none focus:border-purple-500">
                    <option value="">All cities</option>
                    {favoriteCities.map((city)=> <option key={city} value={city}>{city}</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-[#6f6077]">Minimum price (EGP)
                  <input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event)=>setMinPrice(event.target.value)} placeholder="No minimum" className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm text-[#171018] outline-none focus:border-purple-500"/>
                </label>
                <label className="text-xs font-medium text-[#6f6077]">Maximum price (EGP)
                  <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event)=>setMaxPrice(event.target.value)} placeholder="No maximum" className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm text-[#171018] outline-none focus:border-purple-500"/>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs font-medium text-[#6f6077]">Sort by
                  <select value={sortBy} onChange={(event)=>setSortBy(event.target.value)} className="ml-2 rounded-xl border border-[#eadff5] bg-[#fffafc] px-3 py-2 text-sm text-[#171018]">
                    <option value="name">Artist name A–Z</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
                <button type="button" onClick={()=>{setSearchQuery("");setSelectedCity("");setMinPrice("");setMaxPrice("");setSortBy("name");}} className="text-sm font-medium text-purple-700 hover:underline">Clear filters</button>
                <span className="text-xs text-[#8a7d91]">{visibleFavorites.length} of {favorites.length} artists</span>
              </div>
            </div>
            {visibleFavorites.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">No favorites match these filters. Try adjusting your search or budget.</div>
            ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleFavorites.map((mua) => (
              <Link
                key={mua.id}
                href={`/bride/mua/${mua.id}`}
                className="group overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[4/5] bg-[#f7efff]">
                  {mua.image ? (
                    <img
                      src={mua.image}
                      alt={`${mua.first_name || "Artist"} portfolio`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[#8a7d91]">
                      Portfolio coming soon
                    </div>
                  )}

                  <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-purple-700 shadow-sm">
                    <Heart size={17} fill="currentColor" />
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="text-2xl font-light tracking-[-0.05em]">
                    {mua.first_name} {mua.last_name}
                  </h2>
                  <p className="mt-2 text-sm text-[#6f6077]">
                    {(mua.cities || []).join(", ") || "Location on request"}
                  </p>
                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-[#6f6077]">
                    {mua.bio || "Beauty artist available for Beaura bookings."}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-sm font-medium text-purple-700">
                    View profile
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}