
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
  Users,
  Star,
} from "lucide-react";

type PortfolioImage = {
  url: string;
};

type MuaProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  cities: string[] | null;
  verified: boolean;
  status: string;
  instagram: string | null;
  experience: string | null;
  portfolio: PortfolioImage[];
  services: any[];
};

type LocationOption = {
  location_type: string;
  is_accepted: boolean;
};

type ReviewSummary = {
  average: number;
  count: number;
};

function formatEGP(value: number) {
  return `EGP ${Number(value || 0).toLocaleString("en-EG")}`;
}

export default function MuaProfilePage() {
  const params = useParams<{
    id?: string | string[];
    muaId?: string | string[];
  }>();

  const router = useRouter();

  // Supports either app/bride/mua/[id] or app/bride/mua/[muaId].
  const rawId = params.id ?? params.muaId;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [mua, setMua] = useState<MuaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState<string | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({ average: 0, count: 0 });
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);

  const loadMua = useCallback(async () => {
    if (!id) {
      setMua(null);
      setLoadError("The artist profile link is invalid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
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
        mua_portfolio (
          image_path
        ),
        mua_services (
          id,
          name,
          price,
          duration_minutes,
          group_pricing_enabled,
          mua_service_group_tiers (
            id,
            min_people,
            max_people,
            price_per_person
          )
        )
      `)
      .eq("id", id)
      .eq("verified", true)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Error loading MUA profile:", error);
      setMua(null);
      setLoadError(
        "We couldn't load this artist's profile. Please try again."
      );
      setLoading(false);
      return;
    }

    if (!data) {
      setMua(null);
      setLoadError(null);
      setLoading(false);
      return;
    }

    const portfolio: PortfolioImage[] =
      data.mua_portfolio?.map((item: any) => ({
        url: supabase.storage
          .from("mua-portfolio")
          .getPublicUrl(item.image_path).data.publicUrl,
      })) || [];

    const services = (data.mua_services || []).map((service: any) => ({
      ...service,
      group_tiers: [
        ...(service.mua_service_group_tiers || []),
      ].sort(
        (a: any, b: any) =>
          Number(a.min_people) - Number(b.min_people)
      ),
    }));

    setMua({
      ...data,
      portfolio,
      services,
    });

    const { data: locationRows, error: locationError } = await supabase
      .from("mua_service_locations")
      .select("location_type, is_accepted")
      .eq("mua_id", id)
      .eq("is_accepted", true);

    if (locationError) {
      console.error("Error loading artist service locations:", locationError);
      setLocationOptions([]);
    } else {
      setLocationOptions(locationRows || []);
    }

    const { data: reviewRows, error: reviewsError } = await supabase
      .from("mua_reviews")
      .select("rating")
      .eq("mua_id", id);

    if (reviewsError) {
      console.error("Error loading artist reviews:", reviewsError);
      setReviewSummary({ average: 0, count: 0 });
    } else {
      const ratings = (reviewRows || [])
        .map((review: any) => Number(review.rating))
        .filter((rating: number) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
      setReviewSummary({
        average: ratings.length
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
          : 0,
        count: ratings.length,
      });
    }

    // Keep a small, local history so brides can quickly return to artists they viewed.
    try {
      const storageKey = "beaura_recently_viewed_muas";
      const previous = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const recentIds = Array.isArray(previous)
        ? previous.filter((item: unknown) => typeof item === "string" && item !== id)
        : [];
      localStorage.setItem(storageKey, JSON.stringify([id, ...recentIds].slice(0, 8)));
    } catch (storageError) {
      console.warn("Could not save recently viewed artists:", storageError);
    }

    // Check whether the current bride has saved this artist.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error checking current user:", userError);
    }

    if (user) {
      const { data: favorite, error: favoriteError } = await supabase
        .from("favorites")
        .select("id")
        .eq("bride_id", user.id)
        .eq("mua_id", id)
        .maybeSingle();

      if (favoriteError) {
        console.error("Error checking favorite:", favoriteError);
      } else {
        setIsFavorite(!!favorite);
      }
    } else {
      setIsFavorite(false);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadMua();
  }, [loadMua]);

  function goToBooking() {
    if (!id) return;
    router.push(`/bride/booking/${id}`);
  }

  async function handleMessage() {
    if (!id) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting current user:", userError);
    }

    if (!user) return;

    const { data: existingConversation, error: conversationError } =
      await supabase
        .from("conversations")
        .select("id")
        .eq("bride_id", user.id)
        .eq("mua_id", id)
        .maybeSingle();

    if (conversationError) {
      console.error("Error checking conversation:", conversationError);
      return;
    }

    if (existingConversation) {
      router.push(`/bride/messages/${existingConversation.id}`);
      return;
    }

    const { data: newConversation, error: insertError } = await supabase
      .from("conversations")
      .insert({
        bride_id: user.id,
        mua_id: id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating conversation:", insertError);
      return;
    }

    if (newConversation) {
      router.push(`/bride/messages/${newConversation.id}`);
    }
  }

  async function toggleFavorite() {
    if (favoriteLoading || !id) return;

    setFavoriteLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting current user:", userError);
        return;
      }

      if (!user) return;

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("bride_id", user.id)
          .eq("mua_id", id);

        if (error) {
          console.error("Error removing favorite:", error);
          return;
        }

        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("favorites").insert({
          bride_id: user.id,
          mua_id: id,
        });

        if (error) {
          console.error("Error saving favorite:", error);
          return;
        }

        setIsFavorite(true);
      }
    } finally {
      setFavoriteLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-4 pt-28 text-[#6f6077]">
        <div className="mx-auto max-w-7xl">
          Loading artist…
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-4 pt-28 text-[#6f6077]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#eadff5] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-[#171018]">
            Unable to load profile
          </h1>

          <p className="mt-3 text-sm leading-7">
            {loadError}
          </p>

          <button
            onClick={() => void loadMua()}
            className="mt-6 rounded-full bg-[#171018] px-6 py-3 text-sm font-medium text-white"
          >
            Try again
          </button>

          <button
            onClick={() => router.back()}
            className="mt-3 block w-full text-sm text-purple-700"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  if (!mua) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-4 pt-28 text-[#6f6077]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#eadff5] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-[#171018]">
            Artist not found
          </h1>

          <p className="mt-3 text-sm leading-7">
            This artist may no longer be available, or their profile may
            not be published yet.
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 rounded-full bg-[#171018] px-6 py-3 text-sm font-medium text-white"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const artistName =
    `${mua.first_name || ""} ${mua.last_name || ""}`.trim() ||
    "Makeup artist";

  const heroImage = mua.portfolio?.[0]?.url;
  const sideImages = mua.portfolio?.slice(1, 4) || [];

  const lowestPrice =
    mua.services.length > 0
      ? Math.min(
          ...mua.services.map((service: any) =>
            Number(service.price || 0)
          )
        )
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
            <Heart
              size={16}
              fill={isFavorite ? "currentColor" : "none"}
            />
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
                  Portfolio photos will appear here when available
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

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat
                label="Starting from"
                value={
                  lowestPrice !== null
                    ? formatEGP(lowestPrice)
                    : "Ask"
                }
              />

              <MiniStat
                label="Services"
                value={`${mua.services.length}`}
              />

              <MiniStat
                label="Photos"
                value={`${mua.portfolio.length}`}
              />

              <MiniStat
                label="Client rating"
                value={reviewSummary.count ? `${reviewSummary.average.toFixed(1)} / 5` : "Not rated yet"}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={goToBooking}
                className="rounded-full bg-[#171018] px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Request a booking
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
            {sideImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setImageOpen(img.url)}
                className="aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#f7efff] sm:rounded-[2rem]"
              >
                <img
                  src={img.url}
                  alt={`${artistName} portfolio ${index + 2}`}
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
                Services offered
              </h2>
            </div>

            <button
              onClick={goToBooking}
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

                  <div className="mt-4 rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8a7d91]">Service price</p>
                    <p className="mt-1 text-xl font-semibold text-[#171018]">{formatEGP(Number(service.price))}</p>
                    <p className="mt-1 text-xs text-[#6f6077]">Estimated service duration · {service.duration_minutes || "—"} min</p>
                  </div>

                  {service.group_pricing_enabled &&
                    service.group_tiers?.length > 0 && (
                      <div className="mt-5 border-t border-[#eadff5] pt-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                          <Users size={16} />
                          Group pricing
                        </div>

                        <p className="mt-1 text-xs leading-5 text-[#8a7d91]">
                          Price per person. The group total is calculated
                          using the number of people.
                        </p>

                        <div className="mt-3 space-y-2">
                          {service.group_tiers.map((tier: any) => (
                            <div
                              key={tier.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-sm"
                            >
                              <span className="text-[#6f6077]">
                                {tier.min_people}–{tier.max_people} people
                              </span>

                              <span className="font-medium text-[#171018]">
                                {formatEGP(
                                  Number(tier.price_per_person)
                                )}{" "}
                                / person
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
              View the artist’s work, check the details, and request a booking.
            </h2>
          </div>

          <div className="rounded-[2.5rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-3xl font-light tracking-[-0.06em]">
              About the artist
            </h2>

            <p className="mt-5 text-sm leading-8 text-[#6f6077]">
              {mua.bio ||
                "View the artist’s portfolio and services, or send a message if you have a question before booking."}
            </p>

            {mua.experience && (
              <div className="mt-5 rounded-2xl bg-[#fffafc] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-purple-700">Experience level</p>
                <p className="mt-1 text-sm font-medium text-[#171018]">{mua.experience}</p>
              </div>
            )}

            {(mua.cities || []).length > 0 && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.16em] text-purple-700">Areas served</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(mua.cities || []).map((city: string) => (
                    <span key={city} className="rounded-full bg-[#f7efff] px-3 py-2 text-xs text-purple-700">{city}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.16em] text-purple-700">Where the artist works</p>
              {locationOptions.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {locationOptions.map((option) => {
                    const labels: Record<string, string> = {
                      client_home: "At your home",
                      hotel: "At your hotel",
                      event_venue: "At your venue",
                      own_studio: "At the artist’s studio",
                    };
                    return (
                      <span key={option.location_type} className="rounded-full border border-[#eadff5] bg-white px-3 py-2 text-xs text-[#6f6077]">
                        {labels[option.location_type] || option.location_type}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#6f6077]">Ask the artist which location options are available for your appointment.</p>
              )}
            </div>

            {mua.instagram && (
              <a
                href={mua.instagram}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium"
              >
                View Instagram
              </a>
            )}
          </div>
        </section>

        {/* CLIENT REVIEWS */}
        <section className="rounded-[2.5rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Bride feedback</p>
              <h2 className="mt-3 text-3xl font-light tracking-[-0.06em]">Client reviews</h2>
              <p className="mt-2 text-sm text-[#6f6077]">Ratings are from brides who have reviewed this artist after a completed booking.</p>
            </div>
            <div className="rounded-2xl bg-[#fffafc] px-5 py-4">
              {reviewSummary.count > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <Star size={19} className="fill-[#d4a843] text-[#d4a843]" />
                    <span className="text-2xl font-semibold text-[#171018]">{reviewSummary.average.toFixed(1)}</span>
                    <span className="text-sm text-[#8a7d91]">/ 5</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6f6077]">{reviewSummary.count} {reviewSummary.count === 1 ? "review" : "reviews"}</p>
                </>
              ) : (
                <p className="text-sm text-[#6f6077]">No ratings yet</p>
              )}
            </div>
          </div>
        </section>

        {mua.portfolio.length > 1 && (
          <button
            onClick={() => setGalleryOpen(true)}
            className="w-full rounded-full border border-[#eadff5] bg-white px-6 py-3.5 text-sm font-medium transition hover:border-purple-300"
          >
            View all portfolio photos
          </button>
        )}
      </section>

      {/* FULL GALLERY */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fffafc] px-4 py-6">
          <div className="mx-auto max-w-6xl">
            <div className="sticky top-0 z-10 mb-5 flex items-center justify-between rounded-full border border-[#eadff5] bg-white/90 px-4 py-3 backdrop-blur">
              <p className="text-sm font-medium">
                {artistName} portfolio
              </p>

              <button
                onClick={() => setGalleryOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#171018] text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mua.portfolio.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setImageOpen(img.url)}
                  className="aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#f7efff]"
                >
                  <img
                    src={img.url}
                    className="h-full w-full object-cover"
                    alt={`${artistName} portfolio ${index + 1}`}
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
    </main>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-[#171018]">
        {value}
      </p>
    </div>
  );
}
