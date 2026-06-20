"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Trash2 } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

type DraftService = {
  name: string;
  price: string;
  duration_minutes: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newService, setNewService] = useState<DraftService>({
    name: "",
    price: "",
    duration_minutes: "60",
  });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("mua_services")
      .select("*")
      .eq("mua_id", user.id)
      .order("created_at", { ascending: true });

    setServices(data || []);
    setLoading(false);
  }

  async function saveService(service: Service) {
    setSavingId(service.id);

    await supabase
      .from("mua_services")
      .update({
        name: service.name,
        price: Number(service.price) || 0,
        duration_minutes: Number(service.duration_minutes) || 60,
      })
      .eq("id", service.id);

    setSavingId(null);
  }

  async function deleteService(id: string) {
    await supabase.from("mua_services").delete().eq("id", id);
    setServices((prev) => prev.filter((service) => service.id !== id));
  }

  async function addService() {
    if (!newService.name.trim() || !newService.price.trim()) return;

    setAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdding(false);
      return;
    }

    const { data } = await supabase
      .from("mua_services")
      .insert({
        mua_id: user.id,
        name: newService.name.trim(),
        price: Number(newService.price),
        duration_minutes: Number(newService.duration_minutes) || 60,
      })
      .select()
      .single();

    if (data) {
      setServices((prev) => [...prev, data]);
      setNewService({
        name: "",
        price: "",
        duration_minutes: "60",
      });
    }

    setAdding(false);
  }

  const totalPotential = useMemo(() => {
    return services.reduce((sum, service) => sum + (Number(service.price) || 0), 0);
  }, [services]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* HERO */}
      <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-purple-700">
              services
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-[-0.04em] text-[#171018]">
              Services & pricing
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6077]">
              Manage what clients can book — update names, prices, and durations whenever you need.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7d6e86]">
              current services
            </p>
            <p className="mt-1 text-2xl font-medium text-[#171018]">
              {services.length}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        {/* EXISTING SERVICES */}
        <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-[#171018]">Your services</h2>
              <p className="mt-1 text-sm text-[#6f6077]">
                Edit each service individually and save it instantly.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[150px] animate-pulse rounded-[1.5rem] bg-[#faf7ff]" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#eadff5] bg-[#fffafc] p-8 text-center">
              <h3 className="text-lg font-medium text-[#171018]">No services yet</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                Add your first service on the right so clients can start booking you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-[1.7rem] border border-[#efe6f7] bg-[#fffafc] p-5"
                >
                  <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:items-end">
                    <Field label="Service name">
                      <input
                        value={service.name}
                        onChange={(e) =>
                          setServices((prev) =>
                            prev.map((item) =>
                              item.id === service.id
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="h-12 w-full rounded-2xl border border-[#eadff5] bg-white px-4 text-sm text-[#171018] outline-none focus:border-purple-300"
                      />
                    </Field>

                    <Field label="Price (EGP)">
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) =>
                          setServices((prev) =>
                            prev.map((item) =>
                              item.id === service.id
                                ? { ...item, price: Number(e.target.value) }
                                : item
                            )
                          )
                        }
                        className="h-12 w-full rounded-2xl border border-[#eadff5] bg-white px-4 text-sm text-[#171018] outline-none focus:border-purple-300"
                      />
                    </Field>

                    <Field label="Duration">
                      <select
                        value={service.duration_minutes}
                        onChange={(e) =>
                          setServices((prev) =>
                            prev.map((item) =>
                              item.id === service.id
                                ? { ...item, duration_minutes: Number(e.target.value) }
                                : item
                            )
                          )
                        }
                        className="h-12 w-full rounded-2xl border border-[#eadff5] bg-white px-4 text-sm text-[#171018] outline-none focus:border-purple-300"
                      >
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                        <option value={75}>75 min</option>
                        <option value={90}>90 min</option>
                        <option value={120}>120 min</option>
                        <option value={150}>150 min</option>
                      </select>
                    </Field>

                    <div className="flex gap-2 md:justify-end">
                      <button
                        onClick={() => saveService(service)}
                        className="h-12 rounded-full bg-[#171018] px-5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        {savingId === service.id ? "Saving..." : "Save"}
                      </button>

                      <button
                        onClick={() => deleteService(service.id)}
                        className="grid h-12 w-12 place-items-center rounded-full border border-[#eadff5] bg-white text-[#7c6f84] transition hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ADD NEW + SUMMARY */}
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
            <div className="mb-5">
              <h2 className="text-xl font-medium text-[#171018]">Add a new service</h2>
              <p className="mt-1 text-sm text-[#6f6077]">
                Create additional offerings like bridal touch-ups, engagement looks, or photoshoot glam.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Service name">
                <input
                  value={newService.name}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Bridal makeup"
                  className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm text-[#171018] outline-none placeholder:text-[#9b8da4] focus:border-purple-300"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price (EGP)">
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService((prev) => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="1500"
                    className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm text-[#171018] outline-none placeholder:text-[#9b8da4] focus:border-purple-300"
                  />
                </Field>

                <Field label="Duration">
                  <select
                    value={newService.duration_minutes}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        duration_minutes: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm text-[#171018] outline-none focus:border-purple-300"
                  >
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="75">75 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                    <option value="150">150 min</option>
                  </select>
                </Field>
              </div>

              <button
                onClick={addService}
                disabled={adding}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#171018] text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <Plus size={16} />
                {adding ? "Adding..." : "Add service"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#7d6e86]">
              quick snapshot
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MiniStat label="Services listed" value={String(services.length)} />
              <MiniStat label="Combined price total" value={`EGP ${totalPotential.toLocaleString()}`} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#7d6e86]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#efe6f7] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#7d6e86]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#171018]">{value}</p>
    </div>
  );
}