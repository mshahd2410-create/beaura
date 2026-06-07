"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Report = {
  id: string;
  booking_id: string | null;
  reporter_id: string | null;
  reported_user_id: string | null;
  report_type: string;
  description: string | null;
  status: string;
  created_at: string;
};

type Dispute = {
  id: string;
  booking_id: string | null;
  bride_id: string | null;
  mua_id: string | null;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

type Tab = "reports" | "disputes";
type StatusFilter = "all" | "open" | "investigating" | "resolved" | "closed";

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>("reports");
  const [loading, setLoading] = useState(true);

  const [reports, setReports] = useState<Report[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [reportsRes, disputesRes] = await Promise.all([
      supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (reportsRes.error) {
      console.error("REPORTS LOAD ERROR:", reportsRes.error);
    } else {
      setReports((reportsRes.data as Report[]) || []);
    }

    if (disputesRes.error) {
      console.error("DISPUTES LOAD ERROR:", disputesRes.error);
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
      console.error("REPORT UPDATE ERROR:", error);
      alert(error.message);
      return;
    }

    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, status } : report
      )
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
      console.error("DISPUTE UPDATE ERROR:", error);
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
      console.error("SAVE ADMIN NOTES ERROR:", error);
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

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const query = search.toLowerCase();

      const matchesSearch =
        report.id.toLowerCase().includes(query) ||
        (report.booking_id || "").toLowerCase().includes(query) ||
        (report.report_type || "").toLowerCase().includes(query) ||
        (report.description || "").toLowerCase().includes(query);

      const matchesFilter = filter === "all" || report.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [reports, search, filter]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const query = search.toLowerCase();

      const matchesSearch =
        dispute.id.toLowerCase().includes(query) ||
        (dispute.booking_id || "").toLowerCase().includes(query) ||
        (dispute.reason || "").toLowerCase().includes(query) ||
        (dispute.admin_notes || "").toLowerCase().includes(query);

      const matchesFilter = filter === "all" || dispute.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [disputes, search, filter]);

  const openReports = reports.filter((r) => r.status === "open").length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;

  const openDisputes = disputes.filter((d) => d.status === "open").length;
  const resolvedDisputes = disputes.filter((d) => d.status === "resolved").length;

  function formatDate(date: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  function statusClass(status: string) {
    if (status === "resolved") return "bg-green-50 text-green-700";
    if (status === "closed") return "bg-gray-100 text-gray-700";
    if (status === "investigating") return "bg-purple-50 text-purple-700";
    return "bg-amber-50 text-amber-700";
  }

  return (
    <main className="min-h-screen bg-[#FAF8FF] p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Reports & Disputes
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Review complaints, disputes, safety issues, and platform incidents.
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-5 md:grid-cols-4 mb-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Open Reports</p>
          <h2 className="mt-3 text-3xl font-semibold text-amber-500">
            {openReports}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Resolved Reports</p>
          <h2 className="mt-3 text-3xl font-semibold text-green-600">
            {resolvedReports}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Open Disputes</p>
          <h2 className="mt-3 text-3xl font-semibold text-red-500">
            {openDisputes}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Resolved Disputes</p>
          <h2 className="mt-3 text-3xl font-semibold text-purple-600">
            {resolvedDisputes}
          </h2>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col gap-5">
          {/* TABS */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTab("reports");
                setFilter("all");
                setSearch("");
              }}
              className={`px-5 py-2 rounded-full text-sm transition ${
                tab === "reports"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Reports
            </button>

            <button
              onClick={() => {
                setTab("disputes");
                setFilter("all");
                setSearch("");
              }}
              className={`px-5 py-2 rounded-full text-sm transition ${
                tab === "disputes"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Disputes
            </button>
          </div>

          {/* SEARCH + FILTERS */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                tab === "reports"
                  ? "Search reports by ID, booking, type, or description..."
                  : "Search disputes by ID, booking, reason, or notes..."
              }
              className="w-full md:max-w-md h-12 rounded-2xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex flex-wrap gap-2">
              {["all", "open", "investigating", "resolved", "closed"].map(
                (value) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value as StatusFilter)}
                    className={`px-4 py-2 rounded-full text-sm capitalize transition ${
                      filter === value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            {/* REPORTS TABLE */}
      {tab === "reports" && (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-medium text-gray-700">
                No reports found
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Report</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Booking</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-gray-900">
                          #{report.id.slice(0, 8)}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Reporter:{" "}
                          {report.reporter_id
                            ? report.reporter_id.slice(0, 8)
                            : "—"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                          {report.report_type}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {report.booking_id
                          ? `#${report.booking_id.slice(0, 8)}`
                          : "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600 max-w-xs">
                        <p className="line-clamp-2">
                          {report.description || "No description provided."}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(report.created_at)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              updateReportStatus(report.id, "investigating")
                            }
                            className="rounded-full border border-purple-200 px-3 py-1 text-xs text-purple-700 hover:bg-purple-50"
                          >
                            Investigate
                          </button>

                          <button
                            onClick={() =>
                              updateReportStatus(report.id, "resolved")
                            }
                            className="rounded-full border border-green-200 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                          >
                            Resolve
                          </button>

                          <button
                            onClick={() =>
                              updateReportStatus(report.id, "closed")
                            }
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DISPUTES TABLE */}
      {tab === "disputes" && (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading disputes...
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-medium text-gray-700">
                No disputes found
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Dispute</th>
                    <th className="px-6 py-4 font-medium">Booking</th>
                    <th className="px-6 py-4 font-medium">Bride</th>
                    <th className="px-6 py-4 font-medium">MUA</th>
                    <th className="px-6 py-4 font-medium">Reason</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDisputes.map((dispute) => (
                    <tr
                      key={dispute.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-gray-900">
                          #{dispute.id.slice(0, 8)}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {dispute.booking_id
                          ? `#${dispute.booking_id.slice(0, 8)}`
                          : "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {dispute.bride_id
                          ? dispute.bride_id.slice(0, 8)
                          : "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {dispute.mua_id
                          ? dispute.mua_id.slice(0, 8)
                          : "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600 max-w-xs">
                        <p className="line-clamp-2">
                          {dispute.reason || "No reason provided."}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                            dispute.status
                          )}`}
                        >
                          {dispute.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(dispute.created_at)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setAdminNotes(dispute.admin_notes || "");
                            }}
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              updateDisputeStatus(dispute.id, "investigating")
                            }
                            className="rounded-full border border-purple-200 px-3 py-1 text-xs text-purple-700 hover:bg-purple-50"
                          >
                            Investigate
                          </button>

                          <button
                            onClick={() =>
                              updateDisputeStatus(dispute.id, "resolved")
                            }
                            className="rounded-full border border-green-200 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                          >
                            Resolve
                          </button>

                          <button
                            onClick={() =>
                              updateDisputeStatus(dispute.id, "closed")
                            }
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
            {/* REPORT DRAWER */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedReport(null)}
          />

          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Report Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  #{selectedReport.id.slice(0, 8)}
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 p-6">
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Report Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Report Type</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedReport.report_type}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                        selectedReport.status
                      )}`}
                    >
                      {selectedReport.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Booking ID</p>
                    <p className="mt-1 text-gray-700">
                      {selectedReport.booking_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Reporter ID</p>
                    <p className="mt-1 text-gray-700 break-all">
                      {selectedReport.reporter_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Reported User ID</p>
                    <p className="mt-1 text-gray-700 break-all">
                      {selectedReport.reported_user_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(selectedReport.created_at)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Description
                </h3>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <p className="text-sm leading-relaxed text-gray-700">
                    {selectedReport.description || "No description provided."}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Admin Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      updateReportStatus(selectedReport.id, "investigating")
                    }
                    className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 transition hover:bg-purple-50"
                  >
                    Mark Investigating
                  </button>

                  <button
                    onClick={() =>
                      updateReportStatus(selectedReport.id, "resolved")
                    }
                    className="rounded-full border border-green-200 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                  >
                    Mark Resolved
                  </button>

                  <button
                    onClick={() =>
                      updateReportStatus(selectedReport.id, "closed")
                    }
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                  >
                    Close Report
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE DRAWER */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedDispute(null)}
          />

          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Dispute Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  #{selectedDispute.id.slice(0, 8)}
                </p>
              </div>

              <button
                onClick={() => setSelectedDispute(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 p-6">
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Dispute Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                        selectedDispute.status
                      )}`}
                    >
                      {selectedDispute.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Booking ID</p>
                    <p className="mt-1 text-gray-700">
                      {selectedDispute.booking_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Bride ID</p>
                    <p className="mt-1 text-gray-700 break-all">
                      {selectedDispute.bride_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">MUA ID</p>
                    <p className="mt-1 text-gray-700 break-all">
                      {selectedDispute.mua_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(selectedDispute.created_at)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Reason
                </h3>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <p className="text-sm leading-relaxed text-gray-700">
                    {selectedDispute.reason || "No reason provided."}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Admin Notes
                </h3>

                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Write internal notes about this dispute..."
                  rows={5}
                  className="w-full rounded-3xl border border-gray-200 bg-gray-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <button
                  onClick={saveDisputeNotes}
                  className="mt-4 rounded-full bg-purple-600 px-5 py-2 text-sm text-white transition hover:bg-purple-700"
                >
                  Save Notes
                </button>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Admin Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      updateDisputeStatus(selectedDispute.id, "investigating")
                    }
                    className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 transition hover:bg-purple-50"
                  >
                    Mark Investigating
                  </button>

                  <button
                    onClick={() =>
                      updateDisputeStatus(selectedDispute.id, "resolved")
                    }
                    className="rounded-full border border-green-200 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                  >
                    Mark Resolved
                  </button>

                  <button
                    onClick={() =>
                      updateDisputeStatus(selectedDispute.id, "closed")
                    }
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                  >
                    Close Dispute
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}