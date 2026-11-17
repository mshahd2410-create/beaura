
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Trash2, Users, Check } from "lucide-react";

type GroupTier = {
  id?: string;
  min_people: string;
  max_people: string;
  price_per_person: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  group_pricing_enabled: boolean;
  group_tiers: GroupTier[];
};

type DraftService = {
  name: string;
  price: string;
  duration_minutes: string;
  group_pricing_enabled: boolean;
  group_tiers: GroupTier[];
};

const emptyTier = (): GroupTier => ({
  min_people: "2",
  max_people: "3",
  price_per_person: "",
});

const emptyService: DraftService = {
  name: "",
  price: "",
  duration_minutes: "60",
  group_pricing_enabled: false,
  group_tiers: [],
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newService, setNewService] = useState<DraftService>({
    ...emptyService,
    group_tiers: [],
  });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("mua_services")
      .select("*")
      .eq("mua_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Could not load services:", error);
      alert("Could not load your services. Please try again.");
      setLoading(false);
      return;
    }

    const serviceRows = data || [];
    let tiersByService: Record<string, GroupTier[]> = {};

    if (serviceRows.length > 0) {
      const { data: tierRows, error: tierError } = await supabase
        .from("mua_service_group_tiers")
        .select("*")
        .in(
          "service_id",
          serviceRows.map((service) => service.id)
        )
        .order("min_people", { ascending: true });

      if (tierError) {
        console.error("Could not load group pricing:", tierError);
        alert("Your services loaded, but group pricing could not be loaded.");
      } else {
        (tierRows || []).forEach((tier) => {
          if (!tiersByService[tier.service_id]) {
            tiersByService[tier.service_id] = [];
          }

          tiersByService[tier.service_id].push({
            id: tier.id,
            min_people: String(tier.min_people),
            max_people: String(tier.max_people),
            price_per_person: String(tier.price_per_person),
          });
        });
      }
    }

    setServices(
      serviceRows.map((service) => ({
        ...service,
        group_pricing_enabled: service.group_pricing_enabled ?? false,
        group_tiers: tiersByService[service.id] || [],
      }))
    );

    setLoading(false);
  }

  function validateGroupTiers(tiers: GroupTier[]) {
    if (tiers.length === 0) {
      return "Add at least one group pricing tier, or turn off group pricing.";
    }

    const sorted = [...tiers].sort(
      (a, b) => Number(a.min_people) - Number(b.min_people)
    );

    for (const tier of sorted) {
      const min = Number(tier.min_people);
      const max = Number(tier.max_people);
      const price = Number(tier.price_per_person);

      if (
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        min < 2 ||
        max < min
      ) {
        return "Please enter valid group sizes. The minimum must be at least 2 and the maximum cannot be smaller than the minimum.";
      }

      if (
        tier.price_per_person.trim() === "" ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return "Please enter a valid price per person greater than zero for every group tier.";
      }
    }

    for (let i = 1; i < sorted.length; i++) {
      const previousMax = Number(sorted[i - 1].max_people);
      const currentMin = Number(sorted[i].min_people);

      if (currentMin <= previousMax) {
        return "Your group size ranges overlap. Please adjust them so each group size belongs to only one tier.";
      }
    }

    return null;
  }

  async function saveGroupTiers(serviceId: string, tiers: GroupTier[]) {
    const { data: existingRows, error: loadError } = await supabase
      .from("mua_service_group_tiers")
      .select("id")
      .eq("service_id", serviceId);

    if (loadError) {
      throw loadError;
    }

    const existingIds = (existingRows || []).map((row) => row.id);
    const keptIds = tiers
      .map((tier) => tier.id)
      .filter((id): id is string => Boolean(id));

    // Update existing tiers and insert new ones.
    for (const tier of tiers) {
      const payload = {
        service_id: serviceId,
        min_people: Number(tier.min_people),
        max_people: Number(tier.max_people),
        price_per_person: Number(tier.price_per_person),
      };

      if (tier.id) {
        const { error } = await supabase
          .from("mua_service_group_tiers")
          .update(payload)
          .eq("id", tier.id)
          .eq("service_id", serviceId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("mua_service_group_tiers")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          tier.id = data.id;
        }
      }
    }

    // Remove tiers deleted by the MUA.
    const removedIds = existingIds.filter(
      (id) => !keptIds.includes(id)
    );

    for (const id of removedIds) {
      const { error } = await supabase
        .from("mua_service_group_tiers")
        .delete()
        .eq("id", id)
        .eq("service_id", serviceId);

      if (error) throw error;
    }

    return tiers;
  }

  async function saveService(service: Service) {
    if (!service.name.trim()) {
      alert("Please enter a service name.");
      return;
    }

    if (!Number.isFinite(Number(service.price)) || Number(service.price) < 0) {
      alert("Please enter a valid service price.");
      return;
    }

    if (service.group_pricing_enabled) {
      const validationError = validateGroupTiers(service.group_tiers);

      if (validationError) {
        alert(validationError);
        return;
      }
    }

    setSavingId(service.id);

    try {
      const { error } = await supabase
        .from("mua_services")
        .update({
          name: service.name.trim(),
          price: Number(service.price) || 0,
          duration_minutes: Number(service.duration_minutes) || 60,
          group_pricing_enabled: service.group_pricing_enabled,
        })
        .eq("id", service.id);

      if (error) throw error;

      const savedTiers = await saveGroupTiers(
        service.id,
        service.group_tiers
      );

      setServices((prev) =>
        prev.map((item) =>
          item.id === service.id
            ? { ...item, group_tiers: [...savedTiers] }
            : item
        )
      );

      alert("Service and pricing saved successfully.");
    } catch (error) {
      console.error("Could not save service:", error);
      alert(
        "We couldn't save all your changes. Please try again. Check your connection if the problem continues."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteService(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("mua_services")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Could not delete service:", error);
      alert("Could not delete this service. Please try again.");
      return;
    }

    setServices((prev) => prev.filter((service) => service.id !== id));
  }

  async function addService() {
    if (!newService.name.trim() || !newService.price.trim()) {
      alert("Please enter a service name and price.");
      return;
    }

    if (!Number.isFinite(Number(newService.price)) || Number(newService.price) < 0) {
      alert("Please enter a valid service price.");
      return;
    }

    if (newService.group_pricing_enabled) {
      const validationError = validateGroupTiers(newService.group_tiers);

      if (validationError) {
        alert(validationError);
        return;
      }
    }

    setAdding(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in again to add a service.");
        return;
      }

      const { data, error } = await supabase
        .from("mua_services")
        .insert({
          mua_id: user.id,
          name: newService.name.trim(),
          price: Number(newService.price),
          duration_minutes: Number(newService.duration_minutes) || 60,
          group_pricing_enabled: newService.group_pricing_enabled,
        })
        .select()
        .single();

      if (error) throw error;

      let savedTiers: GroupTier[] = [];

      if (newService.group_pricing_enabled) {
        savedTiers = await saveGroupTiers(
          data.id,
          newService.group_tiers
        );
      }

      setServices((prev) => [
        ...prev,
        {
          ...data,
          group_pricing_enabled: data.group_pricing_enabled ?? false,
          group_tiers: savedTiers,
        },
      ]);

      setNewService({
        ...emptyService,
        group_tiers: [],
      });
    } catch (error) {
      console.error("Could not add service:", error);
      alert("Could not add your service. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  const totalPotential = useMemo(() => {
    return services.reduce(
      (sum, service) => sum + (Number(service.price) || 0),
      0
    );
  }, [services]);

  function updateServiceTier(
    serviceId: string,
    index: number,
    field: keyof GroupTier,
    value: string
  ) {
    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== serviceId) return service;

        const tiers = [...service.group_tiers];
        tiers[index] = { ...tiers[index], [field]: value };

        return { ...service, group_tiers: tiers };
      })
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* HERO */}
      <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-purple-700">
              services
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-[-0.04em] text-[#171018]">
              Services & pricing
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6077]">
              Manage what clients can book — update names, prices, durations,
              and optional group pricing whenever you need.
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
        <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-medium text-[#171018]">
              Your services
            </h2>
            <p className="mt-1 text-sm text-[#6f6077]">
              Edit each service individually and save your changes.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[150px] animate-pulse rounded-[1.5rem] bg-[#faf7ff]"
                />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#eadff5] bg-[#fffafc] p-8 text-center">
              <h3 className="text-lg font-medium text-[#171018]">
                No services yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                Add your first service on the right so clients can start
                booking you.
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
                        min="0"
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
                                ? {
                                    ...item,
                                    duration_minutes: Number(e.target.value),
                                  }
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
                        disabled={savingId === service.id}
                        className="h-12 rounded-full bg-[#171018] px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {savingId === service.id ? "Saving..." : "Save"}
                      </button>

                      <button
                        onClick={() => deleteService(service.id)}
                        className="grid h-12 w-12 place-items-center rounded-full border border-[#eadff5] bg-white text-[#7c6f84] transition hover:text-red-600"
                        aria-label="Delete service"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[#efe6f7] pt-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={service.group_pricing_enabled}
                        onChange={(e) =>
                          setServices((prev) =>
                            prev.map((item) =>
                              item.id === service.id
                                ? {
                                    ...item,
                                    group_pricing_enabled: e.target.checked,
                                    group_tiers:
                                      e.target.checked &&
                                      item.group_tiers.length === 0
                                        ? [emptyTier()]
                                        : item.group_tiers,
                                  }
                                : item
                            )
                          )
                        }
                        className="mt-1 h-4 w-4 accent-purple-700"
                      />

                      <span>
                        <span className="block text-sm font-medium text-[#171018]">
                          Enable group pricing
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#7d6e86]">
                          Set your own price per client for bookings with
                          multiple people. You choose the price for each group
                          size.
                        </span>
                      </span>
                    </label>

                    {service.group_pricing_enabled && (
                      <div className="mt-5">
                        <GroupPricingEditor
                          tiers={service.group_tiers}
                          onAdd={() =>
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === service.id
                                  ? {
                                      ...item,
                                      group_tiers: [
                                        ...item.group_tiers,
                                        {
                                          ...emptyTier(),
                                          min_people: item.group_tiers.length
                                            ? String(
                                                Number(
                                                  item.group_tiers[
                                                    item.group_tiers.length - 1
                                                  ].max_people
                                                ) + 1
                                              )
                                            : "2",
                                          max_people: item.group_tiers.length
                                            ? String(
                                                Number(
                                                  item.group_tiers[
                                                    item.group_tiers.length - 1
                                                  ].max_people
                                                ) + 2
                                              )
                                            : "3",
                                        },
                                      ],
                                    }
                                  : item
                              )
                            )
                          }
                          onChange={(index, field, value) =>
                            updateServiceTier(
                              service.id,
                              index,
                              field,
                              value
                            )
                          }
                          onRemove={(index) =>
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === service.id
                                  ? {
                                      ...item,
                                      group_tiers: item.group_tiers.filter(
                                        (_, i) => i !== index
                                      ),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ADD NEW + SUMMARY */}
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-medium text-[#171018]">
                Add a new service
              </h2>
              <p className="mt-1 text-sm text-[#6f6077]">
                Create additional offerings like bridal touch-ups, engagement
                looks, or photoshoot glam.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Service name">
                <input
                  value={newService.name}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Bridal makeup"
                  className="h-12 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 text-sm text-[#171018] outline-none placeholder:text-[#9b8da4] focus:border-purple-300"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price (EGP)">
                  <input
                    type="number"
                    min="0"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
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

              <div className="border-t border-[#efe6f7] pt-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={newService.group_pricing_enabled}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        group_pricing_enabled: e.target.checked,
                        group_tiers:
                          e.target.checked && prev.group_tiers.length === 0
                            ? [emptyTier()]
                            : prev.group_tiers,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-purple-700"
                  />

                  <span>
                    <span className="block text-sm font-medium text-[#171018]">
                      Enable group pricing
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#7d6e86]">
                      Set your own price per client for each group size.
                    </span>
                  </span>
                </label>

                {newService.group_pricing_enabled && (
                  <div className="mt-5">
                    <GroupPricingEditor
                      tiers={newService.group_tiers}
                      onAdd={() =>
                        setNewService((prev) => {
                          const last =
                            prev.group_tiers[prev.group_tiers.length - 1];

                          return {
                            ...prev,
                            group_tiers: [
                              ...prev.group_tiers,
                              {
                                ...emptyTier(),
                                min_people: last
                                  ? String(Number(last.max_people) + 1)
                                  : "2",
                                max_people: last
                                  ? String(Number(last.max_people) + 2)
                                  : "3",
                              },
                            ],
                          };
                        })
                      }
                      onChange={(index, field, value) =>
                        setNewService((prev) => ({
                          ...prev,
                          group_tiers: prev.group_tiers.map((tier, i) =>
                            i === index
                              ? { ...tier, [field]: value }
                              : tier
                          ),
                        }))
                      }
                      onRemove={(index) =>
                        setNewService((prev) => ({
                          ...prev,
                          group_tiers: prev.group_tiers.filter(
                            (_, i) => i !== index
                          ),
                        }))
                      }
                    />
                  </div>
                )}
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

          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.04)] sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#7d6e86]">
              quick snapshot
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MiniStat
                label="Services listed"
                value={String(services.length)}
              />
              <MiniStat
                label="Combined price total"
                value={`EGP ${totalPotential.toLocaleString()}`}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function GroupPricingEditor({
  tiers,
  onAdd,
  onChange,
  onRemove,
}: {
  tiers: GroupTier[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof GroupTier,
    value: string
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadff5] bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5edfb] text-purple-700">
          <Users size={17} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#171018]">
            Group price tiers
          </h3>
          <p className="text-xs text-[#7d6e86]">
            Set the price each person pays based on the group size.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <div
            key={tier.id || `new-tier-${index}`}
            className="rounded-2xl border border-[#efe6f7] bg-[#fffafc] p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d6e86]">
                Tier {index + 1}
              </p>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="grid h-8 w-8 place-items-center rounded-full text-[#8b7c93] transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove tier ${index + 1}`}
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="From (people)">
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={tier.min_people}
                  onChange={(e) =>
                    onChange(index, "min_people", e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#eadff5] bg-white px-3 text-sm text-[#171018] outline-none focus:border-purple-300"
                />
              </Field>

              <Field label="To (people)">
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={tier.max_people}
                  onChange={(e) =>
                    onChange(index, "max_people", e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#eadff5] bg-white px-3 text-sm text-[#171018] outline-none focus:border-purple-300"
                />
              </Field>

              <div className="col-span-2">
                <Field label="Price per person (EGP)">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={tier.price_per_person}
                    onChange={(e) =>
                      onChange(index, "price_per_person", e.target.value)
                    }
                    placeholder="e.g. 1500"
                    className="h-11 w-full rounded-xl border border-[#eadff5] bg-white px-3 text-sm text-[#171018] outline-none placeholder:text-[#9b8da4] focus:border-purple-300"
                  />
                </Field>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-[#8b7c93]">
              This is the amount charged to each client. The group total is
              calculated as this price multiplied by the number of people.
              You set the price yourself — no automatic discount is applied.
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-dashed border-purple-300 text-sm font-medium text-purple-800 transition hover:bg-[#faf6ff]"
      >
        <Plus size={15} />
        Add another tier
      </button>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#f8f4fc] p-3 text-xs leading-5 text-[#75657e]">
        <Check size={15} className="mt-0.5 shrink-0 text-purple-700" />
        Brides will see the available group sizes and the price per person
        when booking this service.
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

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#efe6f7] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#7d6e86]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#171018]">{value}</p>
    </div>
  );
}
