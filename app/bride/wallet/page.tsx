"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowDownToLine,
  Clock,
  CreditCard,
  Search,
  Wallet,
  X,
} from "lucide-react";

type BrideWallet = {
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

type CashRequest = {
  id: string;
  wallet_id: string;
  user_id: string;
  user_type: string;
  request_type: string;
  amount: number;
  payout_method: string | null;
  payout_details: string | null;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
};

type Filter = "all" | "refund" | "wallet_payment" | "adjustment";

export default function BrideWalletPage() {
  const [wallet, setWallet] = useState<BrideWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [cashRequests, setCashRequests] = useState<CashRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [refundDetails, setRefundDetails] = useState("");

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

    const [walletRes, transactionsRes, requestsRes] = await Promise.all([
      supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_type", "bride")
        .maybeSingle(),

      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_type", "bride")
        .order("created_at", { ascending: false }),

      supabase
        .from("wallet_cash_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_type", "bride")
        .order("requested_at", { ascending: false }),
    ]);

    if (walletRes.error) {
      setLoadError(walletRes.error.message);
      setLoading(false);
      return;
    }

    if (transactionsRes.error) {
      console.error("BRIDE WALLET TRANSACTIONS ERROR:", transactionsRes.error);
    }

    if (requestsRes.error) {
      console.error("BRIDE CASH REQUESTS ERROR:", requestsRes.error);
    }

    setWallet((walletRes.data as BrideWallet) || null);
    setTransactions((transactionsRes.data as WalletTransaction[]) || []);
    setCashRequests((requestsRes.data as CashRequest[]) || []);
    setLoading(false);
  }

  async function handleRequestCashRefund() {
    const amount = Number(refundAmount);

    if (!amount || amount <= 0) {
      alert("Enter a valid refund amount.");
      return;
    }

    if (!wallet || amount > Number(wallet.available_balance || 0)) {
      alert("You cannot request more than your available wallet credit.");
      return;
    }

    setRequesting(true);

    const { error } = await supabase.rpc("request_wallet_cash_out", {
      p_user_type: "bride",
      p_amount: amount,
      p_payout_method: refundMethod.trim() || null,
      p_payout_details: refundDetails.trim() || null,
    });

    if (error) {
      alert(error.message);
      setRequesting(false);
      return;
    }

    setRefundAmount("");
    setRefundMethod("");
    setRefundDetails("");
    setRefundOpen(false);
    setRequesting(false);
    await loadWallet();

    alert("Cash refund request sent ✨");
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
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
    <main className="min-h-screen px-5 pb-16 pt-24 sm:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
            bride wallet
          </p>

          <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
            Wallet
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
            View your Beaura credits, refund activity, and request a cash refund
            instead of keeping credit in your wallet.
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Available credit"
                value={formatMoney(wallet?.available_balance)}
                icon={<Wallet size={17} />}
              />
              <Stat
                label="Pending cash refund"
                value={formatMoney(wallet?.pending_balance)}
                icon={<Clock size={17} />}
              />
              <Stat
                label="Frozen balance"
                value={formatMoney(wallet?.frozen_balance)}
                icon={<CreditCard size={17} />}
              />
              <Stat
                label="Cash refunded"
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
                        Refund credits, wallet payments, and manual Beaura
                        adjustments.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRefundOpen(true)}
                      disabled={Number(wallet?.available_balance || 0) <= 0}
                      className="rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
                    >
                      Request cash refund
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
                        placeholder="Search wallet activity..."
                        className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
                      {(["all", "refund", "wallet_payment", "adjustment"] as Filter[]).map(
                        (value) => (
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
                        )
                      )}
                    </div>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
                    <h2 className="text-2xl font-light tracking-[-0.05em]">
                      No wallet activity yet.
                    </h2>

                    <p className="mt-3 text-sm text-[#6f6077]">
                      Refunds and credits will appear here.
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
                    cash refund requests
                  </p>

                  <h2 className="mt-2 text-2xl font-light tracking-[-0.05em] text-[#171018]">
                    Request history
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6f6077]">
                    Beaura admins will review and process your cash refund
                    requests.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {cashRequests.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#eadff5] p-5 text-sm text-[#6f6077]">
                      No cash refund requests yet.
                    </p>
                  ) : (
                    cashRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-[#171018]">
                              {formatMoney(request.amount)}
                            </p>

                            <p className="mt-1 text-xs text-[#6f6077]">
                              {request.payout_method || "No method selected"}
                            </p>

                            <p className="mt-2 text-xs text-[#8a7d91]">
                              Requested {formatDate(request.requested_at)}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                              request.status
                            )}`}
                          >
                            {cleanText(request.status)}
                          </span>
                        </div>

                        {request.admin_notes && (
                          <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#6f6077]">
                            {request.admin_notes}
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

        {refundOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                    cash refund
                  </p>

                  <h2 className="mt-3 text-4xl font-light leading-[0.9] tracking-[-0.07em] text-[#171018]">
                    Request cash refund.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#6f6077]">
                    Available credit:{" "}
                    <span className="font-medium text-[#171018]">
                      {formatMoney(wallet?.available_balance)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setRefundOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5]"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Refund amount">
                  <input
                    type="number"
                    min="1"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Example: 500"
                    className="input"
                  />
                </Field>

                <Field label="Refund method">
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="input"
                  >
                    <option value="">Select method</option>
                    <option value="Vodafone Cash">Vodafone Cash</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="InstaPay">InstaPay</option>
                    <option value="Card refund">Card refund</option>
                  </select>
                </Field>

                <Field label="Refund details">
                  <textarea
                    value={refundDetails}
                    onChange={(e) => setRefundDetails(e.target.value)}
                    placeholder="Example: Vodafone Cash number, bank account, InstaPay handle, or original payment note"
                    rows={4}
                    className="input min-h-[110px] resize-none py-3"
                  />
                </Field>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRequestCashRefund}
                  disabled={requesting}
                  className="h-12 flex-1 rounded-full bg-[#171018] text-sm font-medium text-white disabled:opacity-60"
                >
                  {requesting ? "Sending..." : "Request refund"}
                </button>

                <button
                  type="button"
                  onClick={() => setRefundOpen(false)}
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
    </main>
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