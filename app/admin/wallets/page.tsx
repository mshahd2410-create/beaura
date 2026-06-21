"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Wallet, Plus, X } from "lucide-react";

type Bride = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
};

type UserWallet = {
  id: string;
  user_id: string;
  user_type: string;
  available_balance: number;
  pending_balance: number;
  frozen_balance: number;
  total_earned: number;
  total_withdrawn: number;
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

type BrideWithWallet = Bride & {
  wallet?: UserWallet | null;
};

export default function AdminWalletsPage() {
  const [brides, setBrides] = useState<BrideWithWallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCredit, setAddingCredit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedBride, setSelectedBride] = useState<BrideWithWallet | null>(
    null
  );

  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");

  useEffect(() => {
    loadWallets();
  }, []);

  async function loadWallets() {
    setLoading(true);
    setLoadError(null);

    const [bridesRes, walletsRes, transactionsRes] = await Promise.all([
      supabase
        .from("bride_profiles")
        .select("id, first_name, last_name, email, phone, status")
        .order("first_name", { ascending: true }),

      supabase
        .from("wallets")
        .select("*")
        .eq("user_type", "bride"),

      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_type", "bride")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (bridesRes.error) {
      console.error("BRIDES LOAD ERROR:", bridesRes.error);
      setLoadError(bridesRes.error.message);
      setLoading(false);
      return;
    }

    if (walletsRes.error) {
      console.error("WALLETS LOAD ERROR:", walletsRes.error);
      setLoadError(walletsRes.error.message);
      setLoading(false);
      return;
    }

    if (transactionsRes.error) {
      console.error("WALLET TRANSACTIONS LOAD ERROR:", transactionsRes.error);
    }

    const walletMap = new Map<string, UserWallet>();

    ((walletsRes.data as UserWallet[]) || []).forEach((wallet) => {
      walletMap.set(wallet.user_id, wallet);
    });

    const merged =
      ((bridesRes.data as Bride[]) || []).map((bride) => ({
        ...bride,
        wallet: walletMap.get(bride.id) || null,
      })) || [];

    setBrides(merged);
    setTransactions((transactionsRes.data as WalletTransaction[]) || []);
    setLoading(false);
  }

  async function handleAddCredit() {
    if (!selectedBride) return;

    const amount = Number(creditAmount);

    if (!amount || amount <= 0) {
      alert("Enter a valid credit amount.");
      return;
    }

    setAddingCredit(true);

    const { error } = await supabase.rpc("admin_add_customer_credit", {
      p_user_id: selectedBride.id,
      p_amount: amount,
      p_description:
        creditDescription.trim() ||
        `Manual admin credit for ${getBrideName(selectedBride)}`,
    });

    if (error) {
      alert(error.message);
      setAddingCredit(false);
      return;
    }

    setCreditAmount("");
    setCreditDescription("");
    setSelectedBride(null);
    setAddingCredit(false);
    await loadWallets();

    alert("Customer credit added successfully ✨");
  }

  const filteredBrides = useMemo(() => {
    const query = search.toLowerCase();

    return brides.filter((bride) => {
      const name = getBrideName(bride).toLowerCase();

      return (
        name.includes(query) ||
        (bride.email || "").toLowerCase().includes(query) ||
        (bride.phone || "").toLowerCase().includes(query)
      );
    });
  }, [brides, search]);

  const totalCustomerCredit = brides.reduce(
    (sum, bride) => sum + Number(bride.wallet?.available_balance || 0),
    0
  );

  const creditedCustomers = brides.filter(
    (bride) => Number(bride.wallet?.available_balance || 0) > 0
  ).length;

  function getBrideName(bride: BrideWithWallet | Bride) {
    return (
      `${bride.first_name || ""} ${bride.last_name || ""}`.trim() ||
      "Unnamed customer"
    );
  }

  function formatMoney(value: number | string | null | undefined) {
    return `EGP ${Number(value || 0).toLocaleString()}`;
  }

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          admin wallets
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Wallets
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Manage customer wallet balances, add manual credits, and review recent
          wallet activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Customers" value={brides.length} />
        <Stat label="With credit" value={creditedCustomers} />
        <Stat label="Total credit" value={formatMoney(totalCustomerCredit)} />
        <Stat label="Recent transactions" value={transactions.length} />
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">Could not load wallets.</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
            size={17}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading wallets...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-4">
            {filteredBrides.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
                <h2 className="text-2xl font-light tracking-[-0.05em]">
                  No customers found.
                </h2>

                <p className="mt-3 text-sm text-[#6f6077]">
                  Try another search.
                </p>
              </div>
            ) : (
              filteredBrides.map((bride) => (
                <article
                  key={bride.id}
                  className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
                        {getBrideName(bride)}
                      </h2>

                      <p className="mt-1 break-all text-sm text-[#6f6077]">
                        {bride.email || "No email"}
                      </p>

                      <p className="mt-1 text-sm text-[#8a7d91]">
                        {bride.phone || "No phone"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                      <MiniBalance
                        label="Available"
                        value={formatMoney(bride.wallet?.available_balance)}
                      />
                      <MiniBalance
                        label="Pending"
                        value={formatMoney(bride.wallet?.pending_balance)}
                      />
                      <MiniBalance
                        label="Frozen"
                        value={formatMoney(bride.wallet?.frozen_balance)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBride(bride);
                        setCreditAmount("");
                        setCreditDescription("");
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#171018] px-4 py-2 text-sm text-white"
                    >
                      <Plus size={15} />
                      Add credit
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f7efff] text-purple-700">
                <Wallet size={17} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-purple-700">
                  recent activity
                </p>
                <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
                  Customer credits
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {transactions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#eadff5] p-5 text-sm text-[#6f6077]">
                  No wallet transactions yet.
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium capitalize text-[#171018]">
                          {transaction.transaction_type.replace("_", " ")}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#6f6077]">
                          {transaction.description || "No description"}
                        </p>

                        <p className="mt-2 text-xs text-[#8a7d91]">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-medium text-[#171018]">
                        {formatMoney(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {selectedBride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                  manual credit
                </p>

                <h2 className="mt-3 text-4xl font-light leading-[0.9] tracking-[-0.07em] text-[#171018]">
                  Add customer credit.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6f6077]">
                  This will increase the customer's available wallet balance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBride(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={17} />
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                Customer
              </p>
              <p className="mt-1 text-sm font-medium text-[#171018]">
                {getBrideName(selectedBride)}
              </p>
              <p className="mt-1 break-all text-sm text-[#6f6077]">
                {selectedBride.email || "No email"}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Credit amount">
                <input
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Example: 500"
                  className="input"
                />
              </Field>

              <Field label="Reason / note">
                <textarea
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="Example: Refund credit for canceled booking"
                  rows={4}
                  className="input min-h-[110px] resize-none py-3"
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddCredit}
                disabled={addingCredit}
                className="h-12 flex-1 rounded-full bg-[#171018] text-sm font-medium text-white disabled:opacity-60"
              >
                {addingCredit ? "Adding..." : "Add credit"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBride(null)}
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

        input.input {
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <h2 className="mt-3 break-words text-3xl font-light tracking-[-0.06em] text-[#171018]">
        {value}
      </h2>
    </div>
  );
}

function MiniBalance({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-[#171018]">{value}</p>
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