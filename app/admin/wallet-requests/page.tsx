"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  CheckCircle2,
  Clock,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

type CashRequest = {
  id: string;
  wallet_id: string;
  user_id: string;
  user_type: "bride" | "mua";
  request_type: "cash_refund" | "payout";
  amount: number;
  payout_method: string | null;
  payout_details: string | null;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type Filter = "all" | "pending" | "paid" | "rejected" | "bride" | "mua";

export default function AdminWalletRequestsPage() {
  const [requests, setRequests] = useState<CashRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");

  const [selectedRequest, setSelectedRequest] = useState<CashRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<"paid" | "rejected" | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("admin-wallet-cash-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_cash_requests" },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadRequests() {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("wallet_cash_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("ADMIN CASH REQUESTS ERROR:", error);
      setLoadError(error.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const rawRequests = (data as CashRequest[]) || [];
    const enriched = await attachUserProfiles(rawRequests);

    setRequests(enriched);
    setLoading(false);
  }

  async function attachUserProfiles(rawRequests: CashRequest[]) {
    const brideIds = [
      ...new Set(
        rawRequests
          .filter((request) => request.user_type === "bride")
          .map((request) => request.user_id)
          .filter(Boolean)
      ),
    ];

    const muaIds = [
      ...new Set(
        rawRequests
          .filter((request) => request.user_type === "mua")
          .map((request) => request.user_id)
          .filter(Boolean)
      ),
    ];

    const [bridesRes, muasRes] = await Promise.all([
      brideIds.length
        ? supabase
            .from("bride_profiles")
            .select("id, first_name, last_name, email, phone")
            .in("id", brideIds)
        : Promise.resolve({ data: [] as Profile[] }),

      muaIds.length
        ? supabase
            .from("mua_profiles")
            .select("id, first_name, last_name, email, phone")
            .in("id", muaIds)
        : Promise.resolve({ data: [] as Profile[] }),
    ]);

    if ("error" in bridesRes && bridesRes.error) {
      console.error("BRIDE PROFILE LOAD ERROR:", bridesRes.error);
    }

    if ("error" in muasRes && muasRes.error) {
      console.error("MUA PROFILE LOAD ERROR:", muasRes.error);
    }

    const profileMap = new Map<string, Profile>();

    ((bridesRes.data as Profile[]) || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    ((muasRes.data as Profile[]) || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    return rawRequests.map((request) => {
      const profile = profileMap.get(request.user_id);

      const name =
        `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
        null;

      return {
        ...request,
        user_name: name,
        user_email: profile?.email || null,
        user_phone: profile?.phone || null,
      };
    });
  }

  function openActionModal(
    request: CashRequest,
    nextAction: "paid" | "rejected"
  ) {
    setSelectedRequest(request);
    setActionType(nextAction);
    setAdminNotes("");
  }

  function closeActionModal() {
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes("");
  }

  async function processRequest() {
    if (!selectedRequest || !actionType) return;

    setProcessingId(selectedRequest.id);

    const { error } = await supabase.rpc(
      "admin_process_wallet_cash_request",
      {
        p_request_id: selectedRequest.id,
        p_new_status: actionType,
        p_admin_notes:
          adminNotes.trim() ||
          (actionType === "paid"
            ? "Processed by Beaura admin"
            : "Rejected by Beaura admin"),
      }
    );

    if (error) {
      alert(error.message);
      setProcessingId(null);
      return;
    }

    closeActionModal();
    await loadRequests();
    setProcessingId(null);
  }

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        (request.user_name || "").toLowerCase().includes(query) ||
        (request.user_email || "").toLowerCase().includes(query) ||
        (request.user_phone || "").toLowerCase().includes(query) ||
        request.user_id.toLowerCase().includes(query) ||
        request.request_type.toLowerCase().includes(query) ||
        request.user_type.toLowerCase().includes(query) ||
        request.status.toLowerCase().includes(query) ||
        (request.payout_method || "").toLowerCase().includes(query) ||
        (request.payout_details || "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        request.status === filter ||
        request.user_type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [requests, search, filter]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const brideRefundCount = requests.filter(
    (r) => r.user_type === "bride"
  ).length;
  const muaPayoutCount = requests.filter((r) => r.user_type === "mua").length;
  const pendingAmount = requests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

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

  function getUserName(request: CashRequest) {
    return (
      request.user_name ||
      (request.user_type === "bride" ? "Unnamed bride" : "Unnamed MUA")
    );
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
          admin wallet requests
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Money requests
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Review bride cash refund requests and MUA payout requests from one
          place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Pending requests" value={pendingCount} />
        <Stat label="Pending amount" value={formatMoney(pendingAmount)} />
        <Stat label="Bride refunds" value={brideRefundCount} />
        <Stat label="MUA payouts" value={muaPayoutCount} />
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">Could not load requests.</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
              size={17}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, method, status..."
              className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
            {(["all", "pending", "paid", "rejected", "bride", "mua"] as Filter[]).map(
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

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading wallet requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No requests found.
          </h2>

          <p className="mt-3 text-sm text-[#6f6077]">
            Cash refunds and payouts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#171018] text-sm font-semibold text-white">
                      {getUserName(request).charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-xl font-light tracking-[-0.04em] text-[#171018]">
                        {getUserName(request)}
                      </h2>

                      <p className="mt-1 break-all text-sm text-[#6f6077]">
                        {request.user_email || "No email"} ·{" "}
                        {request.user_phone || "No phone"}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#f7efff] px-3 py-1 text-xs font-medium capitalize text-purple-700">
                      {request.user_type}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                        request.status
                      )}`}
                    >
                      {cleanText(request.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard
                      label="Request type"
                      value={cleanText(request.request_type)}
                    />
                    <InfoCard
                      label="Amount"
                      value={formatMoney(request.amount)}
                    />
                    <InfoCard
                      label="Method"
                      value={request.payout_method || "Not provided"}
                    />
                    <InfoCard
                      label="Requested"
                      value={formatDate(request.requested_at)}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                      Payment / refund details
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#171018]">
                      {request.payout_details || "No details provided."}
                    </p>
                  </div>

                  {request.admin_notes && (
                    <div className="mt-3 rounded-2xl border border-[#eadff5] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                        Admin notes
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#171018]">
                        {request.admin_notes}
                      </p>
                    </div>
                  )}
                </div>

                {request.status === "pending" && (
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openActionModal(request, "paid")}
                      disabled={processingId === request.id}
                      className="inline-flex items-center gap-2 rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      Mark paid
                    </button>

                    <button
                      type="button"
                      onClick={() => openActionModal(request, "rejected")}
                      disabled={processingId === request.id}
                      className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-5 py-3 text-sm font-medium text-[#171018] transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                  {actionType === "paid" ? "mark paid" : "reject request"}
                </p>

                <h2 className="mt-3 text-4xl font-light leading-[0.9] tracking-[-0.07em] text-[#171018]">
                  {actionType === "paid"
                    ? "Confirm money sent."
                    : "Reject this request."}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6f6077]">
                  {getUserName(selectedRequest)} ·{" "}
                  {formatMoney(selectedRequest.amount)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeActionModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={17} />
              </button>
            </div>

            <Field label="Admin note">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === "paid"
                    ? "Example: Sent via Vodafone Cash / Bank transfer reference..."
                    : "Example: Rejected because details were incorrect..."
                }
                rows={5}
                className="input min-h-[120px] resize-none py-3"
              />
            </Field>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={processRequest}
                disabled={processingId === selectedRequest.id}
                className={`h-12 flex-1 rounded-full text-sm font-medium text-white disabled:opacity-60 ${
                  actionType === "paid" ? "bg-[#171018]" : "bg-red-600"
                }`}
              >
                {processingId === selectedRequest.id
                  ? "Processing..."
                  : actionType === "paid"
                  ? "Mark as paid"
                  : "Reject request"}
              </button>

              <button
                type="button"
                onClick={closeActionModal}
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
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f7efff] text-purple-700">
        {label.toLowerCase().includes("pending") ? (
          <Clock size={17} />
        ) : (
          <Wallet size={17} />
        )}
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-[#171018]">{value}</p>
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