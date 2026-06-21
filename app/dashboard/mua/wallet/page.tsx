"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowDownToLine, Clock, Search, Wallet, X } from "lucide-react";

type MuaWallet = {
  id: string;
  user_id: string;
  user_type: string;
  available_balance: number;
  pending_balance: number;
  frozen_balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string | null;
  updated_at: string | null;
};

type WalletTransaction = {
  id: string;
  wallet_id: string;
  user_id: string;
  user_type: string;
  booking_id: string | null;
  transaction_type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
};

type PayoutRequest = {
  id: string;
  wallet_id: string;
  mua_id: string;
  amount: number;
  payout_method: string | null;
  payout_details: string | null;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
};

type Filter = "all" | "earning" | "payout_request" | "payout_completed" | "freeze" | "unfreeze";

export default function MuaWalletPage() {
  const [wallet, setWallet] = useState<MuaWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    setLoadError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadError("You must be logged in.");
      setLoading(false);
      return;
    }

    let { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("user_type", "mua")
      .maybeSingle();

    if (walletError) {
      setLoadError(walletError.message);
      setLoading(false);
      return;
    }

    if (!walletData) {
      const { data: createdWallet, error: createError } = await supabase
        .from("wallets")
        .insert({
          user_id: user.id,
          user_type: "mua",
          available_balance: 0,
          pending_balance: 0,
          frozen_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
        })
        .select()
        .single();

      if (createError) {
        setLoadError(createError.message);
        setLoading(false);
        return;
      }

      walletData = createdWallet;
    }

    const [transactionsRes, payoutsRes] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_type", "mua")
        .order("created_at", { ascending: false }),

      supabase
        .from("payout_requests")
        .select("*")
        .eq("mua_id", user.id)
        .order("requested_at", { ascending: false }),
    ]);

    if (transactionsRes.error) {
      console.error("MUA WALLET TRANSACTIONS ERROR:", transactionsRes.error);
    }

    if (payoutsRes.error) {
      console.error("MUA PAYOUT REQUESTS ERROR:", payoutsRes.error);
    }

    setWallet(walletData as MuaWallet);
    setTransactions((transactionsRes.data as WalletTransaction[]) || []);
    setPayouts((payoutsRes.data as PayoutRequest[]) || []);
    setLoading(false);
  }

  async function handleRequestPayout() {
    const amount = Number(payoutAmount);

    if (!amount || amount <= 0) {
      alert("Enter a valid payout amount.");
      return;
    }

    if (!wallet || amount > Number(wallet.available_balance || 0)) {
      alert("You cannot request more than your available balance.");
      return;
    }

    setRequesting(true);

    const { error } = await supabase.rpc("request_mua_payout", {
      p_amount: amount,
      p_payout_method: payoutMethod.trim() || null,
      p_payout_details: payoutDetails.trim() || null,
    });

    if (error) {
      alert(error.message);
      setRequesting(false);
      return;
    }

    setPayoutAmount("");
    setPayoutMethod("");
    setPayoutDetails("");
    setPayoutOpen(false);
    setRequesting(false);
    await loadWallet();

    alert("Payout request sent ✨");
  }

  const filteredTransactions = useMemo(() => {
    const query = search.toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.transaction_type.toLowerCase().includes(query) ||
        transaction.status.toLowerCase().includes(query) ||
        (transaction.description || "").toLowerCase().includes(query) ||
        (transaction.booking_id || "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" || transaction.transaction_type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  function formatMoney(value: number | string | null | undefined) {
    return `EGP ${Number(value || 0).toLocaleString()}`;
  }

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  function cleanText(value: string) {
    return value.replaceAll("_", " ");
  }

  function statusClass(status: string) {
    if (status === "paid" || status === "approved" || status === "completed") {
      return "bg-green-50 text-green-700";
    }

    if (status === "rejected" || status === "failed" || status === "cancelled") {
      return "bg-red-50 text-red-700";
    }

    if (status === "pending") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-[#f3f0f5] text-[#6f6077]";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          mua wallet
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Wallet
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Track your Beaura earnings, payout requests, frozen balance, and
          completed withdrawals.
        </p>
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">Could not load wallet.</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading wallet...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat
              label="Available"
              value={formatMoney(wallet?.available_balance)}
              icon={<Wallet size={17} />}
            />
            <Stat
              label="Pending"
              value={formatMoney(wallet?.pending_balance)}
              icon={<Clock size={17} />}
            />
            <Stat
              label="Frozen"
              value={formatMoney(wallet?.frozen_balance)}
              icon={<Wallet size={17} />}
            />
            <Stat
              label="Total earned"
              value={formatMoney(wallet?.total_earned)}
              icon={<ArrowDownToLine size={17} />}
            />
            <Stat
              label="Withdrawn"
              value={formatMoney(wallet?.total_withdrawn)}
              icon={<ArrowDownToLine size={17} />}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
                      Wallet activity
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                      Earnings, payout requests, freezes, and completed payouts.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPayoutOpen(true)}
                    disabled={Number(wallet?.available_balance || 0) <= 0}
                    className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Request payout
                  </button>
                </div>

                <div className="mt-5 flex flex-col gap-4">
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
                      size={17}
                    />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search transactions..."
                      className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
                    {(
                      [
                        "all",
                        "earning",
                        "payout_request",
                        "payout_completed",
                        "freeze",
                        "unfreeze",
                      ] as Filter[]
                    ).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilter(value)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm capitalize ${
                          filter === value
                            ? "bg-[#171018] text-white"
                            : "text-[#6f6077] hover:bg-[#f7efff]"
                        }`}
                      >
                        {cleanText(value)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
                  <h2 className="text-2xl font-light tracking-[-0.05em]">
                    No wallet activity yet.
                  </h2>

                  <p className="mt-3 text-sm text-[#6f6077]">
                    Earnings will appear here after completed bookings.
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <article
                    key={transaction.id}
                    className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-purple-700">
                          {cleanText(transaction.transaction_type)}
                        </p>

                        <h3 className="mt-2 text-2xl font-light tracking-[-0.05em] text-[#171018]">
                          {formatMoney(transaction.amount)}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                          {transaction.description || "No description"}
                        </p>

                        <p className="mt-2 text-xs text-[#8a7d91]">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                          transaction.status
                        )}`}
                      >
                        {cleanText(transaction.status)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>

            <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
                  payout requests
                </p>

                <h2 className="mt-2 text-2xl font-light tracking-[-0.05em] text-[#171018]">
                  Payout history
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                  Beaura admins will review and process your payout requests.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {payouts.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#eadff5] p-5 text-sm text-[#6f6077]">
                    No payout requests yet.
                  </p>
                ) : (
                  payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#171018]">
                            {formatMoney(payout.amount)}
                          </p>

                          <p className="mt-1 text-xs text-[#6f6077]">
                            {payout.payout_method || "No method selected"}
                          </p>

                          <p className="mt-2 text-xs text-[#8a7d91]">
                            Requested {formatDate(payout.requested_at)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                            payout.status
                          )}`}
                        >
                          {cleanText(payout.status)}
                        </span>
                      </div>

                      {payout.admin_notes && (
                        <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#6f6077]">
                          {payout.admin_notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {payoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                  request payout
                </p>

                <h2 className="mt-3 text-4xl font-light leading-[0.9] tracking-[-0.07em] text-[#171018]">
                  Withdraw earnings.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6f6077]">
                  Available balance:{" "}
                  <span className="font-medium text-[#171018]">
                    {formatMoney(wallet?.available_balance)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPayoutOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Payout amount">
                <input
                  type="number"
                  min="1"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Example: 1500"
                  className="input"
                />
              </Field>

              <Field label="Payout method">
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="input"
                >
                  <option value="">Select method</option>
                  <option value="Vodafone Cash">Vodafone Cash</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="InstaPay">InstaPay</option>
                  <option value="Paymob payout">Paymob payout</option>
                </select>
              </Field>

              <Field label="Payout details">
                <textarea
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder="Example: Vodafone Cash number, bank account, or InstaPay handle"
                  rows={4}
                  className="input min-h-[110px] resize-none py-3"
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRequestPayout}
                disabled={requesting}
                className="h-12 flex-1 rounded-full bg-[#171018] text-sm font-medium text-white disabled:opacity-60"
              >
                {requesting ? "Sending..." : "Request payout"}
              </button>

              <button
                type="button"
                onClick={() => setPayoutOpen(false)}
                className="h-12 flex-1 rounded-full border border-[#eadff5] text-sm font-medium text-[#171018]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #eadff5;
          background: #fffafc;
          padding: 0 1rem;
          font-size: 0.875rem;
          color: #171018;
          outline: none;
        }

        input.input,
        select.input {
          height: 48px;
        }

        textarea.input {
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }

        .input:focus {
          border-color: #a855f7;
        }
      `}</style>
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f7efff] text-purple-700">
        {icon}
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <h2 className="mt-2 break-words text-2xl font-light tracking-[-0.06em] text-[#171018]">
        {value}
      </h2>
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
      <span className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
        {label}
      </span>
      {children}
    </label>
  );
}