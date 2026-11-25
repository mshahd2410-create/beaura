"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ReceiptText, Wallet, ArrowDownToLine, RotateCcw, Clock3 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type BookingRow = {
  id: string;
  created_at: string;
  status: string | null;
  total_price: number | null;
  platform_fee: number | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_proof_status: string | null;
  payment_proof_reviewed_at: string | null;
  deposit_amount: number | null;
  card_paid_at: string | null;
  wallet_charged_at: string | null;
  amount_due_after_wallet: number | null;
  refund_processed: boolean | null;
  refund_amount: number | null;
  card_paid: boolean | null;
  wallet_charged: boolean | null;
};

type WalletRow = {
  user_type: string;
  available_balance: number | null;
  pending_balance: number | null;
  frozen_balance: number | null;
};

type AmountStatusRow = { amount: number | null; status: string | null };
type CashRequestRow = {
  amount: number | null;
  status: string | null;
  request_type: string | null;
  user_type: string | null;
};

function money(value: number) {
  return `EGP ${value.toLocaleString("en-EG", { maximumFractionDigits: 2 })}`;
}

function isFullyPaid(booking: BookingRow) {
  if (booking.card_paid === true) return true;
  if (booking.payment_method === "credit_balance" && booking.wallet_charged === true) return true;
  if (booking.payment_method === "transfer" && booking.payment_proof_status === "approved") return false;
  return booking.payment_status === "paid";
}

function paymentDate(booking: BookingRow) {
  if (booking.card_paid === true) return booking.card_paid_at;
  if (booking.payment_method === "credit_balance" && booking.wallet_charged === true) return booking.wallet_charged_at;
  return booking.payment_status === "paid"
    ? booking.card_paid_at || booking.wallet_charged_at
    : null;
}

function cairoDateFor(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function StatCard({ label, value, detail, icon }: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[1.7rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#6f6077]">{label}</p>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7efff] text-purple-700">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-light tracking-[-0.05em] text-[#171018]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#8a7d91]">{detail}</p>
    </article>
  );
}

function QueueLink({ href, label, count, amount }: {
  href: string;
  label: string;
  count: number;
  amount?: number;
}) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4 transition hover:border-purple-300">
      <span>
        <span className="block text-sm font-medium text-[#171018]">{label}</span>
        {amount !== undefined && <span className="mt-1 block text-xs text-[#6f6077]">{money(amount)}</span>}
      </span>
      <span className="rounded-full bg-[#f7efff] px-3 py-1.5 text-sm font-semibold text-purple-700">{count}</span>
    </Link>
  );
}

export default function AdminFinancePage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [payouts, setPayouts] = useState<AmountStatusRow[]>([]);
  const [cashRequests, setCashRequests] = useState<CashRequestRow[]>([]);
  const [depositTransfers, setDepositTransfers] = useState<AmountStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [bookingsRes, walletsRes, payoutsRes, cashRes, transfersRes] = await Promise.all([
      supabase.from("bookings").select("id, created_at, status, total_price, platform_fee, payment_status, payment_method, payment_proof_status, payment_proof_reviewed_at, deposit_amount, card_paid, card_paid_at, wallet_charged, wallet_charged_at, amount_due_after_wallet, refund_processed, refund_amount").order("created_at", { ascending: false }),
      supabase.from("wallets").select("user_type, available_balance, pending_balance, frozen_balance"),
      supabase.from("payout_requests").select("amount, status"),
      supabase.from("wallet_cash_requests").select("amount, status, request_type, user_type"),
      supabase.from("booking_deposit_transfers").select("amount, status"),
    ]);

    const errors = [bookingsRes.error, walletsRes.error, payoutsRes.error, cashRes.error, transfersRes.error].filter(Boolean);
    if (errors.length) setError(errors.map((item) => item?.message).join(" · "));

    setBookings((bookingsRes.data as BookingRow[]) || []);
    setWallets((walletsRes.data as WalletRow[]) || []);
    setPayouts((payoutsRes.data as AmountStatusRow[]) || []);
    setCashRequests((cashRes.data as CashRequestRow[]) || []);
    setDepositTransfers((transfersRes.data as AmountStatusRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-finance-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "payout_requests" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_cash_requests" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_deposit_transfers" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const now = new Date();
  const cairoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const cairoMonth = cairoDate.slice(0, 7);
  const fullyPaidBookings = bookings.filter(isFullyPaid);
  const datedPaidBookings = fullyPaidBookings
    .map((booking) => ({ booking, paidAt: paymentDate(booking) }))
    .filter((entry): entry is { booking: BookingRow; paidAt: string } => !!entry.paidAt);
  const todayPaid = datedPaidBookings.filter((entry) => cairoDateFor(entry.paidAt) === cairoDate);
  const monthPaid = datedPaidBookings.filter((entry) => cairoDateFor(entry.paidAt).slice(0, 7) === cairoMonth);
  const approvedDepositBookings = bookings.filter(
    (booking) => booking.payment_method === "transfer" && booking.payment_proof_status === "approved"
  );
  const todayApprovedDeposits = approvedDepositBookings.filter(
    (booking) => !!booking.payment_proof_reviewed_at && cairoDateFor(booking.payment_proof_reviewed_at) === cairoDate
  );
  const monthApprovedDeposits = approvedDepositBookings.filter(
    (booking) => !!booking.payment_proof_reviewed_at && cairoDateFor(booking.payment_proof_reviewed_at).slice(0, 7) === cairoMonth
  );
  const sum = (rows: BookingRow[], field: "total_price" | "platform_fee") =>
    rows.reduce((total, row) => total + Number(row[field] || 0), 0);
  const depositSum = (rows: BookingRow[]) =>
    rows.reduce((total, row) => total + Number(row.deposit_amount || 0), 0);

  const pendingProofs = bookings.filter((booking) => booking.payment_proof_status === "pending_review");
  const failedPayments = bookings.filter((booking) => booking.payment_status === "failed");
  const processedRefunds = bookings.filter((booking) => booking.refund_processed);
  const refundTotal = processedRefunds.reduce((total, booking) => total + Number(booking.refund_amount || 0), 0);
  const pendingPayouts = payouts.filter((row) => row.status === "pending");
  const pendingTransfers = depositTransfers.filter((row) => row.status === "pending");
  const pendingBrideRefunds = cashRequests.filter((row) =>
    row.user_type === "bride" && row.request_type === "cash_refund" && row.status === "pending"
  );
  const artistPendingBalance = wallets
    .filter((wallet) => wallet.user_type === "mua")
    .reduce((total, wallet) => total + Number(wallet.pending_balance || 0), 0);

  return (
    <section className="space-y-6 text-[#171018]">
      <header className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Admin · Finance</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-[-0.07em] sm:text-5xl">Finance overview</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6077]">
              A live snapshot of recorded payments, platform fees, artist balances, payouts, and refunds.
            </p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadff5] px-5 py-3 text-sm disabled:opacity-50">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Some finance data could not be loaded: {error}</p>}

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">Loading finance overview…</div>
      ) : (
        <>
          <div>
            <h2 className="mb-3 text-lg font-medium">Recorded collections</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Full payments · today" value={money(sum(todayPaid.map((entry) => entry.booking), "total_price"))} detail={`${todayPaid.length} fully paid bookings with a recorded payment date`} icon={<ReceiptText size={18} />} />
              <StatCard label="Full payments · this month" value={money(sum(monthPaid.map((entry) => entry.booking), "total_price"))} detail={`${monthPaid.length} fully paid bookings with a recorded payment date`} icon={<ReceiptText size={18} />} />
              <StatCard label="Approved deposits · this month" value={money(depositSum(monthApprovedDeposits))} detail={`${monthApprovedDeposits.length} approved deposit proofs`} icon={<ReceiptText size={18} />} />
              <StatCard label="Platform fees · this month" value={money(sum(monthPaid.map((entry) => entry.booking), "platform_fee"))} detail="Recorded platform fees on fully paid bookings; not net profit" icon={<Wallet size={18} />} />
              <StatCard label="Approved deposits · today" value={money(depositSum(todayApprovedDeposits))} detail={`${todayApprovedDeposits.length} approved deposit proofs`} icon={<Clock3 size={18} />} />
              <StatCard label="Refunds recorded" value={money(refundTotal)} detail={`${processedRefunds.length} booking refunds; may include wallet credit, not cash-only`} icon={<RotateCcw size={18} />} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-medium">Outstanding balances & queues</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Artist pending balances" value={money(artistPendingBalance)} detail="Total pending balance across MUA wallets" icon={<Wallet size={18} />} />
              <StatCard label="Payouts awaiting admin" value={money(pendingPayouts.reduce((total, row) => total + Number(row.amount || 0), 0))} detail={`${pendingPayouts.length} MUA payout requests`} icon={<ArrowDownToLine size={18} />} />
              <StatCard label="Pending bride cash refunds" value={money(pendingBrideRefunds.reduce((total, row) => total + Number(row.amount || 0), 0))} detail={`${pendingBrideRefunds.length} requests to review`} icon={<RotateCcw size={18} />} />
              <StatCard label="Approved deposits to transfer" value={money(pendingTransfers.reduce((total, row) => total + Number(row.amount || 0), 0))} detail={`${pendingTransfers.length} artist deposit transfers`} icon={<Clock3 size={18} />} />
            </div>
          </div>

          <section className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-light tracking-[-0.05em]">Payment work queue</h2>
            <p className="mt-2 text-sm text-[#6f6077]">Open the relevant screen to review or process each item.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <QueueLink href="/admin/payment-proofs" label="Deposit proofs awaiting review" count={pendingProofs.length} />
              <QueueLink href="/admin/pending-deposits" label="Approved deposits awaiting transfer" count={pendingTransfers.length} amount={pendingTransfers.reduce((total, row) => total + Number(row.amount || 0), 0)} />
              <QueueLink href="/admin/wallet-requests" label="Payout and cash-refund requests" count={pendingPayouts.length + pendingBrideRefunds.length} />
              <QueueLink href="/admin/bookings" label="Bookings with failed payment status" count={failedPayments.length} />
              <QueueLink href="/admin/wallets" label="Customer and artist wallets" count={wallets.length} />
            </div>
            <p className="mt-5 text-xs leading-5 text-[#8a7d91]">
              Full-payment totals exclude approved InstaPay/mobile-wallet deposits, which are shown separately. Daily and monthly totals use recorded payment timestamps; records without a payment timestamp are not assigned to a day or month. Refund totals may include wallet credit and should not be treated as cash refunds. These figures are operational summaries, not an accounting ledger.
            </p>
          </section>
        </>
      )}
    </section>
  );
}
