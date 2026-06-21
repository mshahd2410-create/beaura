"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Plus,
  Search,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Tag,
  X,
  Save,
  Sparkles,
  TicketPercent,
} from "lucide-react";

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PromoForm = {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: PromoForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  max_uses: "",
  expires_at: "",
  is_active: true,
};

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setPromos([]);
    } else {
      setPromos((data || []) as PromoCode[]);
    }

    setLoading(false);
  }

  const filteredPromos = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return promos;

    return promos.filter((promo) => {
      return (
        promo.code.toLowerCase().includes(q) ||
        promo.description?.toLowerCase().includes(q) ||
        promo.discount_type.toLowerCase().includes(q)
      );
    });
  }, [promos, search]);

  function getPromoStatus(promo: PromoCode) {
    const now = new Date();

    if (!promo.is_active) return "inactive";

    if (promo.expires_at && new Date(promo.expires_at) < now) {
      return "expired";
    }

    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return "used up";
    }

    return "active";
  }

  function openCreateForm() {
    setEditingPromo(null);
    setForm(emptyForm);
    setErrorMessage("");
    setShowForm(true);
  }

  function openEditForm(promo: PromoCode) {
    setEditingPromo(promo);
    setForm({
      code: promo.code,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      max_uses: promo.max_uses === null ? "" : String(promo.max_uses),
      expires_at: promo.expires_at ? promo.expires_at.slice(0, 10) : "",
      is_active: promo.is_active,
    });
    setErrorMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPromo(null);
    setForm(emptyForm);
    setErrorMessage("");
  }

  function validateForm() {
    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discount_value);
    const maxUses = form.max_uses ? Number(form.max_uses) : null;

    if (!code) return "Promo code is required.";

    if (!form.discount_value || Number.isNaN(discountValue) || discountValue <= 0) {
      return "Discount value must be greater than 0.";
    }

    if (form.discount_type === "percentage" && discountValue > 100) {
      return "Percentage discount cannot be more than 100%.";
    }

    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
      return "Max usage must be a whole number greater than 0.";
    }

    return "";
  }

  async function savePromo() {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (editingPromo) {
      result = await supabase
        .from("promo_codes")
        .update(payload)
        .eq("id", editingPromo.id);
    } else {
      result = await supabase.from("promo_codes").insert(payload);
    }

    if (result.error) {
      setErrorMessage(result.error.message);
      setSaving(false);
      return;
    }

    await fetchPromos();
    closeForm();
    setSaving(false);
  }

  async function togglePromoStatus(promo: PromoCode) {
    setErrorMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .update({
        is_active: !promo.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promo.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await fetchPromos();
  }

  function formatDate(date: string | null) {
    if (!date) return "No expiry";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDiscount(promo: PromoCode) {
    if (promo.discount_type === "percentage") {
      return `${Number(promo.discount_value || 0).toLocaleString()}%`;
    }

    return `EGP ${Number(promo.discount_value || 0).toLocaleString()}`;
  }

  function statusClass(status: string) {
    if (status === "active") {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (status === "expired") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (status === "used up") {
      return "border-purple-200 bg-purple-50 text-purple-700";
    }

    return "border-[#eadff5] bg-[#fffafc] text-[#6f6077]";
  }

  const activeCount = promos.filter(
    (promo) => getPromoStatus(promo) === "active"
  ).length;

  const inactiveCount = promos.filter((promo) => !promo.is_active).length;

  const totalUses = promos.reduce(
    (sum, promo) => sum + Number(promo.used_count || 0),
    0
  );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white shadow-sm">
        <div className="relative p-7">
          <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-full bg-[#f7efff] blur-2xl md:block" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-purple-700">
                <Sparkles size={15} />
                Beaura Admin
              </p>

              <h1 className="mt-3 text-4xl font-light tracking-[-0.07em] text-[#171018]">
                Promotions
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6f6077]">
                Create bride-only promo codes for campaigns and launch offers.
                Discounts reduce the bride&apos;s checkout total only. The MUA
                payout stays protected and unchanged.
              </p>
            </div>

            <button
              onClick={openCreateForm}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#171018] px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Create promo code
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total codes" value={promos.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Inactive" value={inactiveCount} />
        <StatCard label="Total uses" value={totalUses} />
      </section>

      <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
              Promo codes
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6077]">
              Manage discounts, expiry dates, usage limits, and active status.
            </p>
          </div>

          <div className="relative w-full xl:w-[360px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promo code..."
              className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm text-[#171018] outline-none transition focus:border-purple-400"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-[1.4rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-6 text-sm text-[#6f6077]">
            Loading promotions…
          </div>
        ) : filteredPromos.length === 0 ? (
          <div className="rounded-[1.7rem] border border-dashed border-[#eadff5] bg-[#fffafc] p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f7efff] text-purple-700">
              <TicketPercent size={26} />
            </div>
            <h3 className="mt-5 text-2xl font-light tracking-[-0.05em] text-[#171018]">
              No promo codes yet.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f6077]">
              Create your first bride-only promo code for launch campaigns,
              referrals, or seasonal offers.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPromos.map((promo) => {
              const status = getPromoStatus(promo);
              const usageText =
                promo.max_uses === null
                  ? `${promo.used_count} used · unlimited`
                  : `${promo.used_count} / ${promo.max_uses} used`;

              return (
                <div
                  key={promo.id}
                  className="rounded-[1.7rem] border border-[#eadff5] bg-[#fffafc] p-5 transition hover:-translate-y-[1px] hover:shadow-sm"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#171018] text-white">
                        <Tag size={19} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-medium tracking-[-0.02em] text-[#171018]">
                            {promo.code}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[#6f6077]">
                          {promo.description || "No description added."}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
                      <MiniInfo label="Discount" value={formatDiscount(promo)} />
                      <MiniInfo label="Usage" value={usageText} />
                      <MiniInfo label="Expiry" value={formatDate(promo.expires_at)} />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        onClick={() => openEditForm(promo)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#eadff5] bg-white px-4 text-sm font-medium text-[#171018] transition hover:border-purple-200 hover:text-purple-700"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        onClick={() => togglePromoStatus(promo)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#eadff5] bg-white px-4 text-sm font-medium text-[#171018] transition hover:border-purple-200 hover:text-purple-700"
                      >
                        {promo.is_active ? (
                          <ToggleRight size={17} />
                        ) : (
                          <ToggleLeft size={17} />
                        )}
                        {promo.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                  {editingPromo ? "edit promotion" : "new promotion"}
                </p>

                <h2 className="mt-3 text-3xl font-light tracking-[-0.06em] text-[#171018]">
                  {editingPromo ? "Edit promo code" : "Create promo code"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                  Bride-only promo. MUA payout will not be reduced.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5] bg-[#fffafc] text-[#171018]"
                aria-label="Close promo form"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-[1.4rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Promo code">
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="BEAURA10"
                  className="input"
                />
              </Field>

              <Field label="Discount type">
                <select
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      discount_type: e.target.value as "percentage" | "fixed",
                    }))
                  }
                  className="input"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </Field>

              <Field
                label={
                  form.discount_type === "percentage"
                    ? "Discount value (%)"
                    : "Discount value (EGP)"
                }
              >
                <input
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      discount_value: e.target.value,
                    }))
                  }
                  type="number"
                  min="1"
                  placeholder={form.discount_type === "percentage" ? "10" : "200"}
                  className="input"
                />
              </Field>

              <Field label="Max usage">
                <input
                  value={form.max_uses}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      max_uses: e.target.value,
                    }))
                  }
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  className="input"
                />
              </Field>

              <Field label="Expiry date">
                <input
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      expires_at: e.target.value,
                    }))
                  }
                  type="date"
                  className="input"
                />
              </Field>

              <label className="flex h-12 items-center justify-between rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4">
                <span className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                  Active
                </span>
                <input
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  type="checkbox"
                  className="h-5 w-5 accent-purple-700"
                />
              </label>

              <Field label="Description" wide>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Example: Launch discount for first-time brides"
                  rows={4}
                  className="input min-h-[120px] resize-none py-3"
                />
              </Field>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeForm}
                className="h-12 rounded-full border border-[#eadff5] px-6 text-sm font-medium text-[#171018]"
              >
                Cancel
              </button>

              <button
                onClick={savePromo}
                disabled={saving}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#171018] px-6 text-sm font-medium text-white disabled:opacity-50"
              >
                <Save size={17} />
                {saving
                  ? "Saving..."
                  : editingPromo
                  ? "Save changes"
                  : "Create promo"}
              </button>
            </div>

            <style jsx>{`
              .input {
                width: 100%;
                height: 48px;
                border-radius: 1rem;
                border: 1px solid #eadff5;
                background: #fffafc;
                padding: 0 1rem;
                font-size: 0.875rem;
                color: #171018;
                outline: none;
              }

              textarea.input {
                height: auto;
              }

              .input:focus {
                border-color: #a855f7;
              }
            `}</style>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-light tracking-[-0.06em] text-[#171018]">
        {Number(value || 0).toLocaleString()}
      </p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadff5] bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#171018]">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`block space-y-2 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </span>
      {children}
    </label>
  );
}