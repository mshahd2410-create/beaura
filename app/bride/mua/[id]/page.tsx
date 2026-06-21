"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RequestBookingModal from "@/components/booking/RequestBookingModal";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

export default function MuaProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [mua, setMua] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openBooking, setOpenBooking] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadMua();
  }, [id]);

  async function loadMua() {
    setLoading(true);

    const { data } = await supabase
      .from("mua_profiles")
      .select(`
        id,
        first_name,
        last_name,
        bio,
        cities,
        verified,
        status,
        instagram,
        experience,
        mua_portfolio ( image_path ),
        mua_services (
          id,
          name,
          price,
          duration_minutes
        )
      `)
      .eq("id", id)
      .eq("verified", true)
      .eq("status", "active")
      .single();

    if (!data) {
      setLoading(false);
      return;
    }

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: favorite } = await supabase
        .from("favorites")
        .select("id")
        .eq("bride_id", user.id)
        .eq("mua_id", id)
        .maybeSingle();

      setIsFavorite(!!favorite);
    }

    setLoading(false);
  }

  async function handleMessage() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !id) return;

    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("bride_id", user.id)
      .eq("mua_id", id)
      .maybeSingle();

    if (existingConversation) {
      router.push(`/bride/messages/${existingConversation.id}`);
      return;
    }

    const { data: newConversation } = await supabase
      .from("conversations")
      .insert({
        bride_id: user.id,
        mua_id: id,
      })
      .select()
      .single();

    if (newConversation) {
      router.push(`/bride/messages/${newConversation.id}`);
    }
  }

  async function toggleFavorite() {
    if (favoriteLoading) return;

    setFavoriteLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFavoriteLoading(false);
      return;
    }

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("bride_id", user.id)
        .eq("mua_id", id);

      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({
        bride_id: user.id,
        mua_id: id,
      });

      setIsFavorite(true);
    }

    setFavoriteLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-4 pt-28 text-[#6f6077]">
        Loading artist…
      </main>
    );
  }

  if (!mua) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-4 pt-28 text-[#6f6077]">
        Artist not found.
      </main>
    );
  }

  const artistName =
    `${mua.first_name || ""} ${mua.last_name || ""}`.trim() ||
    "Makeup artist";

  const heroImage = mua.portfolio?.[0]?.url;
  const sideImages = mua.portfolio?.slice(1, 4) || [];

  const lowestPrice =
    mua.services?.length > 0
      ? Math.min(...mua.services.map((s: any) => Number(s.price || 0)))
      : null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffafc] px-4 pb-28 pt-24 text-[#171018] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        {/* TOP */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[#eadff5] bg-white px-4 text-sm text-[#171018]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[#eadff5] bg-white px-4 text-sm text-purple-700 disabled:opacity-60"
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            {isFavorite ? "Saved" : "Save"}
          </button>
        </div>

        {/* HERO */}
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[2.5rem] border border-[#eadff5] bg-white shadow-sm">
            <div className="relative">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={`${artistName} portfolio`}
                  className="h-[420px] w-full object-cover sm:h-[560px]"
                />
              ) : (
                <div className="grid h-[420px] place-items-center bg-[#f7efff] text-[#6f6077] sm:h-[560px]">
                  Portfolio coming soon
                </div>
              )}

              <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs uppercase tracking-[0.16em] text-purple-700 backdrop-blur">
                Beaura artist
              </div>

              {mua.verified && (
                <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-[#171018] backdrop-blur">
                  <ShieldCheck size={14} />
                  Verified
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
              artist profile
            </p>

            <h1 className="mt-4 text-5xl font-light leading-[0.9] tracking-[-0.08em] sm:text-7xl">
              {artistName}
            </h1>

            <div className="mt-5 flex flex-wrap gap-2">
              {(mua.cities || []).map((city: string) => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f7efff] px-3 py-1.5 text-xs text-purple-700"
                >
                  <MapPin size={12} />
                  {city}
                </span>
              ))}

              {mua.experience && (
                <span className="rounded-full bg-[#171018] px-3 py-1.5 text-xs text-white">
                  {mua.experience}
                </span>
              )}
            </div>

            <p className="mt-6 text-sm leading-7 text-[#6f6077]">
              {mua.bio ||
                "This artist hasn’t added a bio yet, but their portfolio and services are ready to view."}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label="Starting from"
                value={lowestPrice ? `EGP ${lowestPrice}` : "Ask"}
              />
              <MiniStat label="Services" value={`${mua.services.length}`} />
              <MiniStat label="Photos" value={`${mua.portfolio.length}`} />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setOpenBooking(true)}
                className="rounded-full bg-[#171018] px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Request booking
              </button>

              <button
                onClick={handleMessage}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadff5] bg-white px-6 py-3.5 text-sm font-medium text-[#171018] transition hover:border-purple-300"
              >
                <MessageCircle size={16} />
                Message artist
              </button>
            </div>
          </div>
        </section>

        {/* PHOTO STRIP */}
        {sideImages.length > 0 && (
          <section className="grid grid-cols-3 gap-3">
            {sideImages.map((img: any, index: number) => (
              <button
                key={index}
                onClick={() => setImageOpen(img.url)}
                className="aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#f7efff] sm:rounded-[2rem]"
              >
                <img
                  src={img.url}
                  alt="Portfolio"
                  className="h-full w-full object-cover transition duration-500 hover:scale-[1.04]"
                />
              </button>
            ))}
          </section>
        )}

        {/* SERVICES */}
        <section className="rounded-[2.5rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                service menu
              </p>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.07em]">
                Choose your glam.
              </h2>
            </div>

            <button
              onClick={() => setOpenBooking(true)}
              className="rounded-full bg-[#171018] px-6 py-3 text-sm font-medium text-white"
            >
              Book now
            </button>
          </div>

          {mua.services.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-[#eadff5] bg-[#fffafc] p-8 text-center text-sm text-[#6f6077]">
              No services added yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mua.services.map((service: any) => (
                <div
                  key={service.id}
                  className="rounded-[2rem] border border-[#eadff5] bg-[#fffafc] p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7efff] text-purple-700">
                    <Sparkles size={17} />
                  </div>

                  <h3 className="mt-5 text-2xl font-light tracking-[-0.05em]">
                    {service.name}
                  </h3>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[#6f6077]">
                      {service.duration_minutes} min
                    </span>
                    <span className="font-medium text-[#171018]">
                      EGP {service.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ABOUT */}
        <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[2.5rem] bg-[#171018] p-6 text-white sm:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              why clients book
            </p>
            <h2 className="mt-4 text-4xl font-light leading-none tracking-[-0.07em]">
              Pretty work. Clear details. Easier planning.
            </h2>
          </div>

          <div className="rounded-[2.5rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-3xl font-light tracking-[-0.06em]">
              About {mua.first_name}
            </h2>

            <p className="mt-5 text-sm leading-8 text-[#6f6077]">
              {mua.bio ||
                "This artist is part of Beaura’s beauty booking experience. You can message them, request a booking, and keep everything organized in one place."}
            </p>

            {mua.instagram && (
              <a
                href={mua.instagram}
                target="_blank"
                className="mt-6 inline-block rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium"
              >
                View Instagram
              </a>
            )}
          </div>
        </section>

        {mua.portfolio.length > 1 && (
          <button
            onClick={() => setGalleryOpen(true)}
            className="w-full rounded-full border border-[#eadff5] bg-white px-6 py-3.5 text-sm font-medium transition hover:border-purple-300"
          >
            Open full portfolio
          </button>
        )}
      </section>

      {/* FULL GALLERY */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fffafc] px-4 py-6">
          <div className="mx-auto max-w-6xl">
            <div className="sticky top-0 z-10 mb-5 flex items-center justify-between rounded-full border border-[#eadff5] bg-white/90 px-4 py-3 backdrop-blur">
              <p className="text-sm font-medium">{artistName} portfolio</p>
              <button
                onClick={() => setGalleryOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#171018] text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mua.portfolio.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setImageOpen(img.url)}
                  className="aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#f7efff]"
                >
                  <img
                    src={img.url}
                    className="h-full w-full object-cover"
                    alt="Portfolio"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULL IMAGE */}
      {imageOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setImageOpen(null)}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-[#171018]"
          >
            <X size={18} />
          </button>

          <img
            src={imageOpen}
            className="max-h-[88vh] max-w-full rounded-2xl object-contain"
            alt="Portfolio"
          />
        </div>
      )}

      <RequestBookingModal
        muaId={mua.id}
        services={mua.services}
        open={openBooking}
        onClose={() => setOpenBooking(false)}
      />
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[#171018]">{value}</p>
    </div>
  );
}