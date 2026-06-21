"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Check, X, Eye, Phone, Instagram, Mail, MapPin } from "lucide-react";

type MuaService = {
  id: string;
  name: string | null;
  price: number | null;
  duration_minutes: number | null;
};

type MuaPortfolio = {
  image_path: string;
};

type Mua = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  bio: string | null;
  cities: string[] | null;
  instagram: string | null;
  created_at: string;
  experience: string | null;
  phone: string | null;
  verified: boolean;
  status: string;
  beaura_tier: string | null;
  mua_services?: MuaService[];
  mua_portfolio?: MuaPortfolio[];
};

export default function AdminApprovalsPage() {
  const [muas, setMuas] = useState<Mua[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMua, setSelectedMua] = useState<Mua | null>(null);

  useEffect(() => {
    loadPendingMuas();
  }, []);

  async function loadPendingMuas() {
    setLoading(true);

    const { data, error } = await supabase
      .from("mua_profiles")
      .select(`
        *,
        mua_services (
          id,
          name,
          price,
          duration_minutes
        ),
        mua_portfolio (
          image_path
        )
      `)
      .eq("verified", false)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("APPROVALS LOAD ERROR:", error);
      alert(error.message);
    } else {
      setMuas((data as Mua[]) || []);
    }

    setLoading(false);
  }

  async function approveMua(id: string) {
    const { error } = await supabase
      .from("mua_profiles")
      .update({ verified: true, status: "active" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setMuas((prev) => prev.filter((mua) => mua.id !== id));
    setSelectedMua(null);
  }

  async function rejectMua(id: string) {
    const { error } = await supabase
      .from("mua_profiles")
      .update({ verified: false, status: "suspended" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setMuas((prev) => prev.filter((mua) => mua.id !== id));
    setSelectedMua(null);
  }

  function formatDate(date: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  function getImageUrl(path: string) {
    return supabase.storage.from("mua-portfolio").getPublicUrl(path).data.publicUrl;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          verification queue
        </p>
        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          MUA Approvals
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Review artist applications, contact details, services, portfolio, and profile info before approval.
        </p>
      </div>

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
          Pending approvals
        </p>
        <h2 className="mt-3 text-4xl font-light tracking-[-0.06em]">
          {muas.length}
        </h2>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading pending MUAs...
        </div>
      ) : muas.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No pending approvals.
          </h2>
          <p className="mt-3 text-sm text-[#6f6077]">
            New artists waiting for verification will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {muas.map((mua) => {
            const fullName =
              `${mua.first_name || ""} ${mua.last_name || ""}`.trim() ||
              "Unnamed artist";

            return (
              <article
                key={mua.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em]">
                      {fullName}
                    </h2>
                    <p className="mt-1 text-sm text-[#6f6077]">
                      Joined {formatDate(mua.created_at)}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-medium text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm text-[#6f6077]">
                  <Info icon={<Phone size={14} />} text={mua.phone || "No phone"} />
                  <Info icon={<Mail size={14} />} text={mua.email || "No email saved"} />
                  <Info icon={<Instagram size={14} />} text={mua.instagram || "No Instagram"} />
                  <Info icon={<MapPin size={14} />} text={mua.cities?.join(", ") || "No cities"} />
                </div>

                <p className="mt-5 line-clamp-3 rounded-2xl bg-[#fffafc] p-4 text-sm leading-6 text-[#6f6077]">
                  {mua.bio || "No bio provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedMua(mua)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2 text-sm"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    onClick={() => approveMua(mua.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#171018] px-4 py-2 text-sm text-white"
                  >
                    <Check size={15} />
                    Approve
                  </button>

                  <button
                    onClick={() => rejectMua(mua.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
                  >
                    <X size={15} />
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedMua && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setSelectedMua(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadff5] bg-white px-5 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                  artist application
                </p>
                <h2 className="mt-1 text-2xl font-light tracking-[-0.05em]">
                  {selectedMua.first_name} {selectedMua.last_name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedMua(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <Section title="Contact details">
                <Detail label="Email" value={selectedMua.email || "No email saved"} />
                <Detail label="Phone" value={selectedMua.phone || "—"} />
                <Detail label="Instagram" value={selectedMua.instagram || "—"} />
              </Section>

              <Section title="Profile details">
                <Detail label="Experience" value={selectedMua.experience || "—"} />
                <Detail label="Cities" value={selectedMua.cities?.join(", ") || "—"} />
                <Detail label="Beaura tier" value={selectedMua.beaura_tier || "—"} />
                <Detail label="Joined" value={formatDate(selectedMua.created_at)} />
                <Detail label="Bio" value={selectedMua.bio || "No bio provided."} large />
              </Section>

              <Section title="Services">
                {selectedMua.mua_services?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedMua.mua_services.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4"
                      >
                        <p className="font-medium text-[#171018]">
                          {service.name || "Service"}
                        </p>
                        <p className="mt-2 text-sm text-[#6f6077]">
                          EGP {service.price || 0} · {service.duration_minutes || "—"} min
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6f6077]">No services added.</p>
                )}
              </Section>

              <Section title="Portfolio">
                {selectedMua.mua_portfolio?.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedMua.mua_portfolio.map((img, index) => (
                      <img
                        key={`${img.image_path}-${index}`}
                        src={getImageUrl(img.image_path)}
                        alt="Portfolio"
                        className="aspect-square rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6f6077]">No portfolio uploaded.</p>
                )}
              </Section>

              <div className="flex flex-wrap gap-3 pb-6">
                <button
                  onClick={() => approveMua(selectedMua.id)}
                  className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white"
                >
                  Approve Artist
                </button>

                <button
                  onClick={() => rejectMua(selectedMua.id)}
                  className="rounded-full border border-red-200 px-5 py-3 text-sm font-medium text-red-600"
                >
                  Reject / Suspend
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-purple-700">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-[#eadff5] bg-[#fffafc] p-5">
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-purple-700">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Detail({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <p className={`mt-1 text-sm leading-7 text-[#171018] ${large ? "" : "break-all"}`}>
        {value}
      </p>
    </div>
  );
}