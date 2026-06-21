"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Search, X } from "lucide-react";

type Ticket = {
  id: string;
  user_id: string | null;
  user_type: string | null;
  subject: string | null;
  message: string | null;
  status: string | null;
  priority: string | null;
  admin_notes: string | null;
  created_at: string;

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

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";
type PriorityFilter = "all" | "low" | "medium" | "high" | "urgent";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);

    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, user_id, user_type, subject, message, status, priority, admin_notes, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPPORT TICKETS LOAD ERROR:", error);
      setLoadError(error.message);
      setTickets([]);
      setLoading(false);
      return;
    }

    const rawTickets = (data as Ticket[]) || [];
    const hydratedTickets = await attachUserProfiles(rawTickets);

    setTickets(hydratedTickets);
    setLoading(false);
  }

  async function attachUserProfiles(rawTickets: Ticket[]) {
    const userIds = rawTickets
      .map((ticket) => ticket.user_id)
      .filter(Boolean) as string[];

    if (userIds.length === 0) return rawTickets;

    const uniqueUserIds = Array.from(new Set(userIds));

    const [bridesRes, muasRes] = await Promise.all([
      supabase
        .from("bride_profiles")
        .select("id, first_name, last_name, email, phone")
        .in("id", uniqueUserIds),

      supabase
        .from("mua_profiles")
        .select("id, first_name, last_name, email, phone")
        .in("id", uniqueUserIds),
    ]);

    if (bridesRes.error) {
      console.error("BRIDE PROFILE LOOKUP ERROR:", bridesRes.error);
    }

    if (muasRes.error) {
      console.error("MUA PROFILE LOOKUP ERROR:", muasRes.error);
    }

    const profileMap = new Map<string, Profile>();

    ((bridesRes.data as Profile[]) || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    ((muasRes.data as Profile[]) || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    return rawTickets.map((ticket) => {
      const profile = ticket.user_id ? profileMap.get(ticket.user_id) : null;

      const fullName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : "";

      return {
        ...ticket,
        user_name: fullName || null,
        user_email: profile?.email || null,
        user_phone: profile?.phone || null,
      };
    });
  }

  async function updateTicketStatus(id: string, status: string) {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", id);

    if (error) {
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
    const query = search.toLowerCase();

    return tickets.filter((ticket) => {
      const status = ticket.status || "open";
      const priority = ticket.priority || "medium";

      const matchesSearch =
        ticket.id.toLowerCase().includes(query) ||
        (ticket.subject || "").toLowerCase().includes(query) ||
        (ticket.message || "").toLowerCase().includes(query) ||
        (ticket.user_type || "").toLowerCase().includes(query) ||
        (ticket.user_id || "").toLowerCase().includes(query) ||
        (ticket.user_name || "").toLowerCase().includes(query) ||
        (ticket.user_email || "").toLowerCase().includes(query) ||
        (ticket.user_phone || "").toLowerCase().includes(query) ||
        (ticket.admin_notes || "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const openCount = tickets.filter((t) => (t.status || "open") === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const urgentCount = tickets.filter((t) => t.priority === "urgent").length;

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  function shortId(id: string | null) {
    if (!id) return "—";
    return `#${id.slice(0, 8)}`;
  }

  function cleanStatus(statusValue: string | null) {
    return (statusValue || "open").replace("_", " ");
  }

  function statusClass(statusValue: string | null) {
    const status = statusValue || "open";

    if (status === "resolved") return "bg-green-50 text-green-700";
    if (status === "closed") return "bg-[#f3f0f5] text-[#6f6077]";
    if (status === "in_progress") return "bg-purple-50 text-purple-700";
    return "bg-amber-50 text-amber-700";
  }

  function priorityClass(priorityValue: string | null) {
    const priority = priorityValue || "medium";

    if (priority === "urgent") return "bg-red-50 text-red-700";
    if (priority === "high") return "bg-orange-50 text-orange-700";
    if (priority === "low") return "bg-[#f3f0f5] text-[#6f6077]";
    return "bg-purple-50 text-purple-700";
  }

  function displayUserName(ticket: Ticket) {
    return ticket.user_name || "Unknown user";
  }

  function displayUserEmail(ticket: Ticket) {
    return ticket.user_email || "No email saved";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          support inbox
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Support
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          Track, prioritize, and resolve support requests from brides, makeup
          artists, and platform users.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open tickets" value={openCount} />
        <Stat label="In progress" value={inProgressCount} />
        <Stat label="Resolved" value={resolvedCount} />
        <Stat label="Urgent" value={urgentCount} />
      </div>

      {loadError && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">Could not load support tickets.</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d91]"
              size={17}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name, email, phone, subject, message, or notes..."
              className="h-12 w-full rounded-full border border-[#eadff5] bg-[#fffafc] pl-11 pr-4 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
              {(["all", "open", "in_progress", "resolved", "closed"] as StatusFilter[]).map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm capitalize ${
                      statusFilter === value
                        ? "bg-[#171018] text-white"
                        : "text-[#6f6077] hover:bg-[#f7efff]"
                    }`}
                  >
                    {value.replace("_", " ")}
                  </button>
                )
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto rounded-full border border-[#eadff5] bg-[#fffafc] p-2">
              {(["all", "low", "medium", "high", "urgent"] as PriorityFilter[]).map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriorityFilter(value)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm capitalize ${
                      priorityFilter === value
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

      {loading ? (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-10 text-center text-sm text-[#6f6077]">
          Loading support tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-12 text-center">
          <h2 className="text-2xl font-light tracking-[-0.05em]">
            No support tickets found.
          </h2>

          <p className="mt-3 text-sm text-[#6f6077]">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredTickets.map((ticket) => {
            const status = ticket.status || "open";
            const priority = ticket.priority || "medium";

            return (
              <article
                key={ticket.id}
                className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
                      {displayUserName(ticket)}
                    </h2>

                    <p className="mt-1 break-all text-sm text-[#6f6077]">
                      {displayUserEmail(ticket)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                      status
                    )}`}
                  >
                    {cleanStatus(status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[#6f6077] sm:grid-cols-2">
                  <Info label="User type" value={ticket.user_type || "—"} />
                  <Info label="Phone" value={ticket.user_phone || "—"} />
                  <Info label="Priority" value={priority} />
                  <Info label="Ticket" value={shortId(ticket.id)} />
                </div>

                <div className="mt-5 rounded-2xl bg-[#fffafc] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                    Subject
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#171018]">
                    {ticket.subject || "No subject"}
                  </p>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6f6077]">
                    {ticket.message || "No message provided."}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${priorityClass(
                      priority
                    )}`}
                  >
                    {priority}
                  </span>

                  {ticket.admin_notes && (
                    <span className="rounded-full bg-[#f3f0f5] px-3 py-1 text-xs font-medium text-[#6f6077]">
                      Notes added
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setAdminNotes(ticket.admin_notes || "");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2 text-sm"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <StatusButtons
                    onStart={() => updateTicketStatus(ticket.id, "in_progress")}
                    onResolve={() => updateTicketStatus(ticket.id, "resolved")}
                    onClose={() => updateTicketStatus(ticket.id, "closed")}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <DrawerHeader
              eyebrow="ticket details"
              title={displayUserName(selectedTicket)}
              onClose={() => setSelectedTicket(null)}
            />

            <div className="space-y-5 p-5">
              <Section title="User information">
                <Detail label="Name" value={displayUserName(selectedTicket)} />
                <Detail label="Email" value={displayUserEmail(selectedTicket)} />
                <Detail label="Phone" value={selectedTicket.user_phone || "—"} />
                <Detail
                  label="User type"
                  value={selectedTicket.user_type || "—"}
                />
                <Detail label="User ID" value={selectedTicket.user_id || "—"} />
              </Section>

              <Section title="Ticket information">
                <Detail
                  label="Ticket"
                  value={shortId(selectedTicket.id)}
                />

                <Detail
                  label="Subject"
                  value={selectedTicket.subject || "No subject"}
                />

                <Detail
                  label="Created"
                  value={formatDate(selectedTicket.created_at)}
                />

                <Detail
                  label="Status"
                  value={cleanStatus(selectedTicket.status)}
                />

                <Detail
                  label="Priority"
                  value={selectedTicket.priority || "medium"}
                />
              </Section>

              <Section title="Message">
                <Detail
                  label="Message"
                  value={selectedTicket.message || "No message provided."}
                  large
                />
              </Section>

              <Section title="Priority">
                <div className="flex flex-wrap gap-2">
                  {(["low", "medium", "high", "urgent"] as const).map(
                    (priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() =>
                          updateTicketPriority(selectedTicket.id, priority)
                        }
                        className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                          (selectedTicket.priority || "medium") === priority
                            ? "bg-[#171018] text-white"
                            : "border border-[#eadff5] text-[#6f6077] hover:bg-[#f7efff]"
                        }`}
                      >
                        {priority}
                      </button>
                    )
                  )}
                </div>
              </Section>

              <Section title="Admin notes">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Write internal notes about this ticket..."
                  rows={5}
                  className="w-full rounded-2xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={saveAdminNotes}
                  className="mt-4 rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white"
                >
                  Save notes
                </button>
              </Section>

              <div className="flex flex-wrap gap-3 pb-6">
                <StatusButtons
                  onStart={() =>
                    updateTicketStatus(selectedTicket.id, "in_progress")
                  }
                  onResolve={() =>
                    updateTicketStatus(selectedTicket.id, "resolved")
                  }
                  onClose={() =>
                    updateTicketStatus(selectedTicket.id, "closed")
                  }
                  large
                />
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
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

      <p className="mt-1 break-all text-sm text-[#171018]">{value}</p>
    </div>
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
  onStart,
  onResolve,
  onClose,
  large = false,
}: {
  onStart: () => void;
  onResolve: () => void;
  onClose: () => void;
  large?: boolean;
}) {
  const size = large ? "px-5 py-3 text-sm" : "px-4 py-2 text-sm";

  return (
    <>
      <button
        type="button"
        onClick={onStart}
        className={`rounded-full border border-purple-200 text-purple-700 ${size}`}
      >
        Start
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