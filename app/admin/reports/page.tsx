"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Search, X } from "lucide-react";

type Report = {
  id: string;
  booking_id: string | null;
  reporter_id: string | null;
  reported_user_id: string | null;
  report_type: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
};

type Dispute = {
  id: string;
  booking_id: string | null;
  bride_id: string | null;
  mua_id: string | null;
  reason: string | null;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  status: string | null;
  bride_id: string | null;
  mua_id: string | null;
  service_price: number | null;
  platform_fee: number | null;
  tax_fee: number | null;
  total_price: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  wallet_charged?: boolean | null;
  wallet_credit_amount?: number | null;
  card_paid?: boolean | null;
  refund_processed?: boolean | null;
  refund_amount?: number | null;
  dispute_resolved?: boolean | null;
  dispute_resolution?: string | null;
  dispute_admin_notes?: string | null;
};

type Tab = "reports" | "disputes";
type StatusFilter = "all" | "open" | "investigating" | "resolved" | "closed";
type ResolutionType =
  | "refund_bride"
  | "partial_refund"
  | "release_to_mua"
  | "close_no_action";

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>("reports");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const [adminNotes, setAdminNotes] = useState("");

  const [resolveDispute, setResolveDispute] = useState<Dispute | null>(null);
  const [resolutionType, setResolutionType] =
    useState<ResolutionType>("refund_bride");
  const [refundAmount, setRefundAmount] = useState("");
  const [muaReleaseAmount, setMuaReleaseAmount] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [bookingPreview, setBookingPreview] = useState<Booking | null>(null);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("admin-reports-disputes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disputes" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadError(null);

    const [reportsRes, disputesRes] = await Promise.all([
      supabase
        .from("reports")
        .select(
          "id, booking_id, reporter_id, reported_user_id, report_type, description, status, created_at"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("disputes")
        .select(
          "id, booking_id, bride_id, mua_id, reason, status, admin_notes, created_at"
        )
        .order("created_at", { ascending: false }),
    ]);

    if (reportsRes.error) {
      console.error("REPORTS LOAD ERROR:", reportsRes.error);
      setLoadError(reportsRes.error.message);
      setReports([]);
    } else {
      setReports((reportsRes.data as Report[]) || []);
    }

    if (disputesRes.error) {
      console.error("DISPUTES LOAD ERROR:", disputesRes.error);
      setLoadError(disputesRes.error.message);
      setDisputes([]);
    } else {
      setDisputes((disputesRes.data as Dispute[]) || []);
    }

    setLoading(false);
  }

  async function updateReportStatus(id: string, status: string) {
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, status } : report))
    );

    if (selectedReport?.id === id) {
      setSelectedReport({ ...selectedReport, status });
    }
  }

  async function updateDisputeStatus(id: string, status: string) {
    const { error } = await supabase
      .from("disputes")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setDisputes((prev) =>
      prev.map((dispute) =>
        dispute.id === id ? { ...dispute, status } : dispute
      )
    );

    if (selectedDispute?.id === id) {
      setSelectedDispute({ ...selectedDispute, status });
    }
  }

  async function saveDisputeNotes() {
    if (!selectedDispute) return;

    const { error } = await supabase
      .from("disputes")
      .update({ admin_notes: adminNotes })
      .eq("id", selectedDispute.id);

    if (error) {
      alert(error.message);
      return;
    }

    setDisputes((prev) =>
      prev.map((dispute) =>
        dispute.id === selectedDispute.id
          ? { ...dispute, admin_notes: adminNotes }
          : dispute
      )
    );

    setSelectedDispute({
      ...selectedDispute,
      admin_notes: adminNotes,
    });

    alert("Admin notes saved ✨");
  }

  async function openResolveModal(
    dispute: Dispute,
    type: ResolutionType = "refund_bride"
  ) {
    setResolveDispute(dispute);
    setResolutionType(type);
    setResolutionNotes(dispute.admin_notes || "");
    setRefundAmount("");
    setMuaReleaseAmount("");
    setBookingPreview(null);

    if (dispute.booking_id) {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, bride_id, mua_id, service_price, platform_fee, tax_fee, total_price, payment_method, payment_status, wallet_charged, wallet_credit_amount, card_paid, refund_processed, refund_amount, dispute_resolved, dispute_resolution, dispute_admin_notes"
        )
        .eq("id", dispute.booking_id)
        .maybeSingle();

      if (!error && data) {
        const booking = data as Booking;
        setBookingPreview(booking);

        if (type === "refund_bride") {
          setRefundAmount(String(Number(booking.total_price || 0)));
          setMuaReleaseAmount("0");
        }

        if (type === "partial_refund") {
          setRefundAmount("");
          setMuaReleaseAmount("");
        }

        if (type === "release_to_mua") {
          const servicePrice = Number(
            booking.service_price || booking.total_price || 0
          );
          const platformFee = Number(
            booking.platform_fee || Math.round(servicePrice * 0.1)
          );
          const earning = Math.max(servicePrice - platformFee, 0);

          setRefundAmount("0");
          setMuaReleaseAmount(String(earning));
        }

        if (type === "close_no_action") {
          setRefundAmount("0");
          setMuaReleaseAmount("0");
        }
      }
    }
  }

  function closeResolveModal() {
    setResolveDispute(null);
    setResolutionType("refund_bride");
    setRefundAmount("");
    setMuaReleaseAmount("");
    setResolutionNotes("");
    setBookingPreview(null);
    setResolving(false);
  }

  async function submitDisputeResolution() {
    if (!resolveDispute) return;

    if (!resolveDispute.booking_id) {
      alert("This dispute has no booking ID.");
      return;
    }

    const refund = Number(refundAmount || 0);
    const release = Number(muaReleaseAmount || 0);

    if (refund < 0 || release < 0) {
      alert("Amounts cannot be negative.");
      return;
    }

    if (resolutionType === "refund_bride" && refund <= 0) {
      alert("Enter a refund amount.");
      return;
    }

    if (resolutionType === "partial_refund" && refund <= 0) {
      alert("Enter a partial refund amount.");
      return;
    }

    if (resolutionType === "release_to_mua" && release <= 0) {
      alert("Enter an amount to release to the MUA.");
      return;
    }

    setResolving(true);

    const { error } = await supabase.rpc("admin_resolve_booking_dispute", {
      p_booking_id: resolveDispute.booking_id,
      p_resolution: resolutionType,
      p_refund_amount: refund,
      p_mua_release_amount: release,
      p_admin_notes:
        resolutionNotes.trim() ||
        `Dispute resolved by admin: ${resolutionType.replaceAll("_", " ")}`,
    });

    if (error) {
      alert(error.message);
      setResolving(false);
      return;
    }

    const { error: disputeError } = await supabase
      .from("disputes")
      .update({
        status: "resolved",
        admin_notes:
          resolutionNotes.trim() ||
          `Dispute resolved by admin: ${resolutionType.replaceAll("_", " ")}`,
      })
      .eq("id", resolveDispute.id);

    if (disputeError) {
      alert(disputeError.message);
      setResolving(false);
      return;
    }

    closeResolveModal();
    setSelectedDispute(null);
    await loadData();
    alert("Dispute resolved ✨");
  }

  const filteredReports = useMemo(() => {
    const query = search.toLowerCase();

    return reports.filter((report) => {
      const status = report.status || "open";

      const matchesSearch =
        report.id.toLowerCase().includes(query) ||
        (report.booking_id || "").toLowerCase().includes(query) ||
        (report.reporter_id || "").toLowerCase().includes(query) ||
        (report.reported_user_id || "").toLowerCase().includes(query) ||
        (report.report_type || "").toLowerCase().includes(query) ||
        (report.description || "").toLowerCase().includes(query);

      return matchesSearch && (filter === "all" || status === filter);
    });
  }, [reports, search, filter]);

  const filteredDisputes = useMemo(() => {
    const query = search.toLowerCase();

    return disputes.filter((dispute) => {
      const status = dispute.status || "open";

      const matchesSearch =
        dispute.id.toLowerCase().includes(query) ||
        (dispute.booking_id || "").toLowerCase().includes(query) ||
        (dispute.bride_id || "").toLowerCase().includes(query) ||
        (dispute.mua_id || "").toLowerCase().includes(query) ||
        (dispute.reason || "").toLowerCase().includes(query) ||
        (dispute.admin_notes || "").toLowerCase().includes(query);

      return matchesSearch && (filter === "all" || status === filter);
    });
  }, [disputes, search, filter]);

  const openReports = reports.filter((r) => (r.status || "open") === "open")
    .length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;
  const openDisputes = disputes.filter((d) => (d.status || "open") === "open")
    .length;
  const resolvedDisputes = disputes.filter((d) => d.status === "resolved")
    .length;

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatMoney(value: number | string | null | undefined) {
    return `EGP ${Number(value || 0).toLocaleString()}`;
  }

  function shortId(id: string | null) {
    if (!id) return "—";
    return `#${id.slice(0, 8)}`;
  }

  function cleanText(value: string | null | undefined) {
    return (value || "—").replaceAll("_", " ");
  }

  function statusClass(statusValue: string | null) {
    const status = statusValue || "open";

    if (status === "resolved") return "bg-green-50 text-green-700";
    if (status === "closed") return "bg-[#f3f0f5] text-[#6f6077]";
    if (status === "investigating") return "bg-purple-50 text-purple-700";
    return "bg-amber-50 text-amber-700";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          reports & disputes
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Cases
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Review complaints, booking disputes, safety issues, refunds, and
          payment releases from one admin workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open reports" value={openReports} />
        <Stat label="Resolved reports" value={resolvedReports} />
        <Stat label="Open disputes" value={openDisputes} />
        <Stat label="Resolved disputes" value={resolvedDisputes} />
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">Could not load reports or disputes.</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
            <button
              type="button"
              onClick={() => {
                setTab("reports");
                setFilter("all");
                setSearch("");
              }}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm ${
                tab === "reports"
                  ? "bg-[#171018] text-white"
                  : "text-[#6f6077] hover:bg-[#f7efff]"
              }`}
            >
              Reports
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("disputes");
                setFilter("all");
                setSearch("");
              }}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm ${
                tab === "disputes"
                  ? "bg-[#171018] text-white"
                  : "text-[#6f6077] hover:bg-[#f7efff]"
              }`}
            >
              Disputes
            </button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
                size={17}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "reports"
                    ? "Search reports by ID, booking, type, or description..."
                    : "Search disputes by ID, booking, reason, or notes..."
                }
                className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
              {(["all", "open", "investigating", "resolved", "closed"] as StatusFilter[]).map(
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
                    {value}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {tab === "reports" && (
        <CaseList
          loading={loading}
          emptyTitle="No reports found."
          emptyText="Try changing your search or filters."
        >
          {filteredReports.map((report) => {
            const status = report.status || "open";

            return (
              <article
                key={report.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
                      {shortId(report.id)}
                    </h2>

                    <p className="mt-1 text-sm text-[#6f6077]">
                      Created {formatDate(report.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[#6f6077] sm:grid-cols-2">
                  <Info label="Type" value={report.report_type || "—"} />
                  <Info label="Booking" value={shortId(report.booking_id)} />
                  <Info label="Reporter" value={shortId(report.reporter_id)} />
                  <Info
                    label="Reported user"
                    value={shortId(report.reported_user_id)}
                  />
                </div>

                <p className="mt-5 rounded-2xl bg-[#fffafc] p-4 text-sm leading-6 text-[#6f6077]">
                  {report.description || "No description provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2 text-sm"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <StatusButtons
                    onInvestigate={() =>
                      updateReportStatus(report.id, "investigating")
                    }
                    onResolve={() => updateReportStatus(report.id, "resolved")}
                    onClose={() => updateReportStatus(report.id, "closed")}
                  />
                </div>
              </article>
            );
          })}
        </CaseList>
      )}

      {tab === "disputes" && (
        <CaseList
          loading={loading}
          emptyTitle="No disputes found."
          emptyText="Try changing your search or filters."
        >
          {filteredDisputes.map((dispute) => {
            const status = dispute.status || "open";

            return (
              <article
                key={dispute.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
                      {shortId(dispute.id)}
                    </h2>

                    <p className="mt-1 text-sm text-[#6f6077]">
                      Created {formatDate(dispute.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[#6f6077] sm:grid-cols-2">
                  <Info label="Booking" value={shortId(dispute.booking_id)} />
                  <Info label="Bride" value={shortId(dispute.bride_id)} />
                  <Info label="MUA" value={shortId(dispute.mua_id)} />
                  <Info
                    label="Admin notes"
                    value={dispute.admin_notes ? "Added" : "No notes"}
                  />
                </div>

                <p className="mt-5 rounded-2xl bg-[#fffafc] p-4 text-sm leading-6 text-[#6f6077]">
                  {dispute.reason || "No reason provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setAdminNotes(dispute.admin_notes || "");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2 text-sm"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => openResolveModal(dispute, "refund_bride")}
                    className="rounded-full border border-green-200 px-4 py-2 text-sm text-green-700"
                  >
                    Resolve money
                  </button>

                  <StatusButtons
                    onInvestigate={() =>
                      updateDisputeStatus(dispute.id, "investigating")
                    }
                    onResolve={() =>
                      updateDisputeStatus(dispute.id, "resolved")
                    }
                    onClose={() => updateDisputeStatus(dispute.id, "closed")}
                  />
                </div>
              </article>
            );
          })}
        </CaseList>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <DrawerHeader
              eyebrow="report details"
              title={shortId(selectedReport.id)}
              onClose={() => setSelectedReport(null)}
            />

            <div className="space-y-5 p-5">
              <Section title="Report information">
                <Detail
                  label="Report type"
                  value={selectedReport.report_type || "—"}
                />
                <Detail label="Status" value={selectedReport.status || "open"} />
                <Detail
                  label="Booking ID"
                  value={selectedReport.booking_id || "—"}
                />
                <Detail
                  label="Reporter ID"
                  value={selectedReport.reporter_id || "—"}
                />
                <Detail
                  label="Reported user ID"
                  value={selectedReport.reported_user_id || "—"}
                />
                <Detail
                  label="Created"
                  value={formatDate(selectedReport.created_at)}
                />
              </Section>

              <Section title="Description">
                <Detail
                  label="Details"
                  value={
                    selectedReport.description || "No description provided."
                  }
                  large
                />
              </Section>

              <div className="flex flex-wrap gap-3 pb-6">
                <StatusButtons
                  onInvestigate={() =>
                    updateReportStatus(selectedReport.id, "investigating")
                  }
                  onResolve={() =>
                    updateReportStatus(selectedReport.id, "resolved")
                  }
                  onClose={() => updateReportStatus(selectedReport.id, "closed")}
                  large
                />
              </div>
            </div>
          </aside>
        </div>
      )}

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setSelectedDispute(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <DrawerHeader
              eyebrow="dispute details"
              title={shortId(selectedDispute.id)}
              onClose={() => setSelectedDispute(null)}
            />

            <div className="space-y-5 p-5">
              <Section title="Dispute information">
                <Detail
                  label="Status"
                  value={selectedDispute.status || "open"}
                />
                <Detail
                  label="Booking ID"
                  value={selectedDispute.booking_id || "—"}
                />
                <Detail
                  label="Bride ID"
                  value={selectedDispute.bride_id || "—"}
                />
                <Detail label="MUA ID" value={selectedDispute.mua_id || "—"} />
                <Detail
                  label="Created"
                  value={formatDate(selectedDispute.created_at)}
                />
              </Section>

              <Section title="Reason">
                <Detail
                  label="Details"
                  value={selectedDispute.reason || "No reason provided."}
                  large
                />
              </Section>

              <Section title="Admin notes">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Write internal notes about this dispute..."
                  rows={5}
                  className="w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={saveDisputeNotes}
                  className="mt-4 rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white"
                >
                  Save notes
                </button>
              </Section>

              <Section title="Resolve money">
                <p className="text-sm leading-6 text-[#6f6077]">
                  Decide whether to refund the bride, release payment to the MUA,
                  or close the dispute without wallet movement.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      openResolveModal(selectedDispute, "refund_bride")
                    }
                    className="rounded-full border border-green-200 px-5 py-3 text-sm text-green-700"
                  >
                    Refund bride
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openResolveModal(selectedDispute, "partial_refund")
                    }
                    className="rounded-full border border-amber-200 px-5 py-3 text-sm text-amber-700"
                  >
                    Partial refund
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openResolveModal(selectedDispute, "release_to_mua")
                    }
                    className="rounded-full border border-purple-200 px-5 py-3 text-sm text-purple-700"
                  >
                    Release to MUA
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openResolveModal(selectedDispute, "close_no_action")
                    }
                    className="rounded-full border border-[#eadff5] px-5 py-3 text-sm text-[#6f6077]"
                  >
                    Close no action
                  </button>
                </div>
              </Section>

              <div className="flex flex-wrap gap-3 pb-6">
                <StatusButtons
                  onInvestigate={() =>
                    updateDisputeStatus(selectedDispute.id, "investigating")
                  }
                  onResolve={() =>
                    updateDisputeStatus(selectedDispute.id, "resolved")
                  }
                  onClose={() => updateDisputeStatus(selectedDispute.id, "closed")}
                  large
                />
              </div>
            </div>
          </aside>
        </div>
      )}

      {resolveDispute && (
        <ResolveDisputeModal
          dispute={resolveDispute}
          booking={bookingPreview}
          resolutionType={resolutionType}
          setResolutionType={setResolutionType}
          refundAmount={refundAmount}
          setRefundAmount={setRefundAmount}
          muaReleaseAmount={muaReleaseAmount}
          setMuaReleaseAmount={setMuaReleaseAmount}
          resolutionNotes={resolutionNotes}
          setResolutionNotes={setResolutionNotes}
          resolving={resolving}
          formatMoney={formatMoney}
          shortId={shortId}
          cleanText={cleanText}
          onClose={closeResolveModal}
          onSubmit={submitDisputeResolution}
        />
      )}
    </section>
  );
}

function ResolveDisputeModal({
  dispute,
  booking,
  resolutionType,
  setResolutionType,
  refundAmount,
  setRefundAmount,
  muaReleaseAmount,
  setMuaReleaseAmount,
  resolutionNotes,
  setResolutionNotes,
  resolving,
  formatMoney,
  shortId,
  cleanText,
  onClose,
  onSubmit,
}: any) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
              resolve dispute
            </p>

            <h2 className="mt-3 text-4xl font-light leading-[0.9] tracking-[-0.07em] text-[#171018]">
              Money decision.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#6f6077]">
              Dispute {shortId(dispute.id)} · Booking{" "}
              {shortId(dispute.booking_id)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5]"
          >
            <X size={17} />
          </button>
        </div>

        {booking && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info label="Booking status" value={cleanText(booking.status)} />
            <Info label="Total" value={formatMoney(booking.total_price)} />
            <Info
              label="Payment method"
              value={cleanText(booking.payment_method)}
            />
            <Info
              label="Payment status"
              value={
                booking.wallet_charged
                  ? "wallet charged"
                  : booking.card_paid || booking.payment_status === "paid"
                  ? "card paid"
                  : cleanText(booking.payment_status || "pending")
              }
            />
          </div>
        )}

        <div className="mt-6 rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
            Resolution
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ResolutionOption
              label="Refund bride"
              value="refund_bride"
              active={resolutionType === "refund_bride"}
              onClick={() => setResolutionType("refund_bride")}
            />

            <ResolutionOption
              label="Partial refund"
              value="partial_refund"
              active={resolutionType === "partial_refund"}
              onClick={() => setResolutionType("partial_refund")}
            />

            <ResolutionOption
              label="Release to MUA"
              value="release_to_mua"
              active={resolutionType === "release_to_mua"}
              onClick={() => setResolutionType("release_to_mua")}
            />

            <ResolutionOption
              label="Close no action"
              value="close_no_action"
              active={resolutionType === "close_no_action"}
              onClick={() => setResolutionType("close_no_action")}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Bride refund amount">
            <input
              type="number"
              min="0"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              disabled={
                resolutionType === "release_to_mua" ||
                resolutionType === "close_no_action"
              }
              placeholder="0"
              className="input"
            />
          </Field>

          <Field label="MUA release amount">
            <input
              type="number"
              min="0"
              value={muaReleaseAmount}
              onChange={(e) => setMuaReleaseAmount(e.target.value)}
              disabled={
                resolutionType === "refund_bride" ||
                resolutionType === "partial_refund" ||
                resolutionType === "close_no_action"
              }
              placeholder="0"
              className="input"
            />
          </Field>
        </div>

        <Field label="Admin notes">
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={5}
            placeholder="Explain the final decision..."
            className="input min-h-[120px] resize-none py-3"
          />
        </Field>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onSubmit}
            disabled={resolving}
            className="h-12 flex-1 rounded-full bg-[#171018] text-sm font-medium text-white disabled:opacity-60"
          >
            {resolving ? "Resolving..." : "Resolve dispute"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-full border border-[#eadff5] text-sm"
          >
            Cancel
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

          .input:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}

function ResolutionOption({
  label,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left text-sm transition ${
        active
          ? "border-purple-400 bg-white text-purple-700"
          : "border-[#eadff5] bg-white text-[#6f6077] hover:border-purple-300"
      }`}
    >
      {label}
    </button>
  );
}

function CaseList({
  loading,
  emptyTitle,
  emptyText,
  children,
}: {
  loading: boolean;
  emptyTitle: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
        Loading cases...
      </div>
    );
  }

  const count = Array.isArray(children) ? children.length : 1;

  if (count === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
        <h2 className="text-2xl font-light tracking-[-0.05em]">
          {emptyTitle}
        </h2>

        <p className="mt-3 text-sm text-[#6f6077]">{emptyText}</p>
      </div>
    );
  }

  return <div className="grid gap-5 lg:grid-cols-2">{children}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <h2 className="mt-3 text-4xl font-light tracking-[-0.06em] text-[#171018]">
        {value}
      </h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <p className="mt-1 break-all text-sm capitalize text-[#171018]">
        {value}
      </p>
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
    <label className="mt-5 block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-[#8a7d91]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

      <p
        className={`mt-1 text-sm leading-7 text-[#171018] ${
          large ? "" : "break-all"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DrawerHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadff5] bg-white px-5 py-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-light tracking-[-0.05em] text-[#171018]">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="grid h-10 w-10 place-items-center rounded-full border border-[#eadff5]"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function StatusButtons({
  onInvestigate,
  onResolve,
  onClose,
  large = false,
}: {
  onInvestigate: () => void;
  onResolve: () => void;
  onClose: () => void;
  large?: boolean;
}) {
  const size = large ? "px-5 py-3 text-sm" : "px-4 py-2 text-sm";

  return (
    <>
      <button
        type="button"
        onClick={onInvestigate}
        className={`rounded-full border border-purple-200 text-purple-700 ${size}`}
      >
        Investigate
      </button>

      <button
        type="button"
        onClick={onResolve}
        className={`rounded-full border border-green-200 text-green-700 ${size}`}
      >
        Resolve
      </button>

      <button
        type="button"
        onClick={onClose}
        className={`rounded-full border border-[#eadff5] text-[#6f6077] ${size}`}
      >
        Close
      </button>
    </>
  );
}