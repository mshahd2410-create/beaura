"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Artist = { id: string; first_name: string | null; last_name: string | null; cities: string[] | null; bookings: number; image: string | null };

export default function TopBookedArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingCountsAvailable, setBookingCountsAvailable] = useState(true);
  const [hasCompletedBookings, setHasCompletedBookings] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [{ data: profiles, error: profileError }, { data: bookings, error: bookingError }] = await Promise.all([
          supabase.from("mua_profiles").select("id, first_name, last_name, cities, mua_portfolio(image_path)").eq("verified", true).eq("status", "active"),
          supabase.from("bookings").select("mua_id").eq("status", "completed"),
        ]);
        if (profileError || !profiles) {
          console.error("Unable to load public MUA profiles:", profileError);
          if (active) setArtists([]);
          return;
        }
        if (bookingError) console.error("Unable to load completed booking counts:", bookingError);
        if (active) {
          setBookingCountsAvailable(!bookingError);
          setHasCompletedBookings(!bookingError && (bookings || []).length > 0);
        }
        const counts = new Map<string, number>();
        (bookings || []).forEach((b: { mua_id: string | null }) => { if (b.mua_id) counts.set(b.mua_id, (counts.get(b.mua_id) || 0) + 1); });
        const ranked: Artist[] = profiles.map((p: any) => ({
          id: p.id, first_name: p.first_name, last_name: p.last_name, cities: p.cities || [],
          bookings: counts.get(p.id) || 0,
          image: p.mua_portfolio?.[0]?.image_path ? supabase.storage.from("mua-portfolio").getPublicUrl(p.mua_portfolio[0].image_path).data.publicUrl : null,
        })).sort((a: Artist, b: Artist) => b.bookings - a.bookings).slice(0, 5);
        if (active) setArtists(ranked);
      } catch (error) { console.error("Unable to load top booked artists:", error); if (active) setArtists([]); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading || artists.length === 0) return null;
  return (
    <section id="top-artists" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-purple-700"><Sparkles size={14} /> {bookingCountsAvailable && hasCompletedBookings ? "Most booked on Beaura" : "Discover Beaura artists"}</p>
            <h2 className="mt-4 max-w-3xl text-5xl font-light leading-[0.95] tracking-[-0.08em] md:text-7xl">Meet your makeup artist.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#6f6077]">Browse artist portfolios, locations and services. Find the right match for your occasion.</p>
          </div>
          <Link href="/bride/home" className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadff5] px-6 py-3 text-sm text-[#171018] transition hover:border-purple-300 hover:text-purple-700">Meet all artists <ArrowUpRight size={16} /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {artists.map((artist, index) => (
            <Link key={artist.id} href={`/bride/mua/${artist.id}`} className="group">
              <article className="overflow-hidden rounded-[2rem] border border-[#eadff5] bg-[#fffafc] transition duration-500 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f1e5ff]">
                  {artist.image ? <img src={artist.image} alt={`${artist.first_name || "Makeup artist"} portfolio`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-sm text-[#7a6b82]">Beaura artist</div>}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-purple-700 shadow-sm">No. 0{index + 1}</span>
                </div>
                <div className="p-4">
                  <h3 className="truncate text-xl font-light tracking-[-0.04em] text-[#171018]">{artist.first_name} {artist.last_name}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#6f6077]"><MapPin size={13} /> {(artist.cities || []).slice(0, 2).join(", ") || "Egypt"}</p>
                  <p className="mt-4 text-[10px] uppercase tracking-[0.15em] text-purple-700">{bookingCountsAvailable && artist.bookings > 0 ? `${artist.bookings} completed ${artist.bookings === 1 ? "booking" : "bookings"}` : "View portfolio & services"}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
