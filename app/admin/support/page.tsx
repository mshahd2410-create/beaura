"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Ticket = {
  id: string;
  user_id: string | null;
  user_type: string | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
};

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";
type PriorityFilter = "all" | "low" | "medium" | "high" | "urgent";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPPORT TICKETS LOAD ERROR:", error);
    } else {
      setTickets((data as Ticket[]) || []);
    }

    setLoading(false);
  }

  async function updateTicketStatus(id: string, status: string) {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("UPDATE TICKET STATUS ERROR:", error);
      alert(error.message);
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id ? { ...ticket, status } : ticket
      )
    );

    if (selectedTicket?.id === id) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  }

  async function updateTicketPriority(id: string, priority: string) {
    const { error } = await supabase
      .from("support_tickets")
      .update({ priority })
      .eq("id", id);

    if (error) {
      console.error("UPDATE TICKET PRIORITY ERROR:", error);
      alert(error.message);
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id ? { ...ticket, priority } : ticket
      )
    );

    if (selectedTicket?.id === id) {
      setSelectedTicket({ ...selectedTicket, priority });
    }
  }

  async function saveAdminNotes() {
    if (!selectedTicket) return;

    const { error } = await supabase
      .from("support_tickets")
      .update({ admin_notes: adminNotes })
      .eq("id", selectedTicket.id);

    if (error) {
      console.error("SAVE ADMIN NOTES ERROR:", error);
      alert(error.message);
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === selectedTicket.id
          ? { ...ticket, admin_notes: adminNotes }
          : ticket
      )
    );

    setSelectedTicket({
      ...selectedTicket,
      admin_notes: adminNotes,
    });

    alert("Admin notes saved ✨");
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const query = search.toLowerCase();

      const matchesSearch =
        ticket.id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.message.toLowerCase().includes(query) ||
        (ticket.user_type || "").toLowerCase().includes(query) ||
        (ticket.user_id || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress"
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const urgentCount = tickets.filter((t) => t.priority === "urgent").length;

  function formatDate(date: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  function statusClass(status: string) {
    if (status === "resolved") return "bg-green-50 text-green-700";
    if (status === "closed") return "bg-gray-100 text-gray-700";
    if (status === "in_progress") return "bg-purple-50 text-purple-700";
    return "bg-amber-50 text-amber-700";
  }

  function priorityClass(priority: string) {
    if (priority === "urgent") return "bg-red-50 text-red-700";
    if (priority === "high") return "bg-orange-50 text-orange-700";
    if (priority === "low") return "bg-gray-100 text-gray-600";
    return "bg-purple-50 text-purple-700";
  }

  return (
    <main className="min-h-screen bg-[#FAF8FF] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Support Inbox
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Track and resolve customer support requests from brides and MUAs.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4 mb-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Open Tickets</p>
          <h2 className="mt-3 text-3xl font-semibold text-amber-500">
            {openCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">In Progress</p>
          <h2 className="mt-3 text-3xl font-semibold text-purple-600">
            {inProgressCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Resolved</p>
          <h2 className="mt-3 text-3xl font-semibold text-green-600">
            {resolvedCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Urgent</p>
          <h2 className="mt-3 text-3xl font-semibold text-red-500">
            {urgentCount}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col gap-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by subject, message, user type, or ID..."
            className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {["all", "open", "in_progress", "resolved", "closed"].map(
                (value) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value as StatusFilter)}
                    className={`px-4 py-2 rounded-full text-sm capitalize transition ${
                      statusFilter === value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {value.replace("_", " ")}
                  </button>
                )
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {["all", "low", "medium", "high", "urgent"].map((value) => (
                <button
                  key={value}
                  onClick={() => setPriorityFilter(value as PriorityFilter)}
                  className={`px-4 py-2 rounded-full text-sm capitalize transition ${
                    priorityFilter === value
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-gray-700">
              No support tickets found
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
                  <th className="px-6 py-4 font-medium">Ticket</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-gray-900">
                        #{ticket.id.slice(0, 8)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {ticket.user_type || "user"}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      {ticket.user_id ? ticket.user_id.slice(0, 8) : "—"}
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-700 max-w-xs">
                      <p className="font-medium text-gray-900">
                        {ticket.subject}
                      </p>

                      <p className="mt-1 line-clamp-2 text-gray-500">
                        {ticket.message}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${priorityClass(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      {formatDate(ticket.created_at)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setAdminNotes(ticket.admin_notes || "");
                          }}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            updateTicketStatus(ticket.id, "in_progress")
                          }
                          className="rounded-full border border-purple-200 px-3 py-1 text-xs text-purple-700 hover:bg-purple-50"
                        >
                          Start
                        </button>

                        <button
                          onClick={() =>
                            updateTicketStatus(ticket.id, "resolved")
                          }
                          className="rounded-full border border-green-200 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                        >
                          Resolve
                        </button>

                        <button
                          onClick={() =>
                            updateTicketStatus(ticket.id, "closed")
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

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedTicket(null)}
          />

          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Ticket Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  #{selectedTicket.id.slice(0, 8)}
                </p>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 p-6">
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Ticket Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Subject</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedTicket.subject}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">User Type</p>
                    <p className="mt-1 capitalize text-gray-700">
                      {selectedTicket.user_type || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">User ID</p>
                    <p className="mt-1 break-all text-gray-700">
                      {selectedTicket.user_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(selectedTicket.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Priority</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${priorityClass(
                        selectedTicket.priority
                      )}`}
                    >
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Message
                </h3>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <p className="text-sm leading-relaxed text-gray-700">
                    {selectedTicket.message}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Priority
                </h3>

                <div className="flex flex-wrap gap-2">
                  {["low", "medium", "high", "urgent"].map((priority) => (
                    <button
                      key={priority}
                      onClick={() =>
                        updateTicketPriority(selectedTicket.id, priority)
                      }
                      className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                        selectedTicket.priority === priority
                          ? "bg-black text-white"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Admin Notes
                </h3>

                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Write internal notes about this ticket..."
                  rows={5}
                  className="w-full rounded-3xl border border-gray-200 bg-gray-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <button
                  onClick={saveAdminNotes}
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
                      updateTicketStatus(selectedTicket.id, "in_progress")
                    }
                    className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 transition hover:bg-purple-50"
                  >
                    Mark In Progress
                  </button>

                  <button
                    onClick={() =>
                      updateTicketStatus(selectedTicket.id, "resolved")
                    }
                    className="rounded-full border border-green-200 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                  >
                    Mark Resolved
                  </button>

                  <button
                    onClick={() =>
                      updateTicketStatus(selectedTicket.id, "closed")
                    }
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                  >
                    Close Ticket
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