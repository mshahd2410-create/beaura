"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabaseClient";
import { CalendarDays, Clock, Sparkles, X } from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
};

type ManualEventType = "blocked" | "external";

export default function MuaCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [actionType, setActionType] = useState<ManualEventType | "">("");
  const [customTitle, setCustomTitle] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState("");

  useEffect(() => {
    loadCalendar();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel("mua-calendar-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `mua_id=eq.${user.id}`,
          },
          () => loadCalendar()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "mua_calendar_events",
            filter: `mua_id=eq.${user.id}`,
          },
          () => loadCalendar()
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedPreview("");
      return;
    }

    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationHours * 60);

    setSelectedPreview(`${formatDateTime(start)} → ${formatTime(end)}`);
  }, [selectedDate, durationHours]);

  async function loadCalendar() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [bookingsRes, manualEventsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          `
          id,
          booking_date,
          booking_time,
          start_time,
          end_time,
          status,
          service_id,
          service_duration_minutes,
          mua_services(name, duration_minutes)
        `
        )
        .eq("mua_id", user.id)
        .in("status", ["pending", "confirmed", "paid", "accepted"]),

      supabase
        .from("mua_calendar_events")
        .select("*")
        .eq("mua_id", user.id),
    ]);

    if (bookingsRes.error) {
      console.error("BOOKINGS CALENDAR LOAD ERROR:", bookingsRes.error);
    }

    if (manualEventsRes.error) {
      console.error("MANUAL CALENDAR LOAD ERROR:", manualEventsRes.error);
    }

    const bookings = bookingsRes.data || [];
    const manualEvents = manualEventsRes.data || [];

    const bookingEvents: CalendarEvent[] = bookings.flatMap((b: any) => {
      try {
        const service = Array.isArray(b.mua_services)
          ? b.mua_services[0]
          : b.mua_services;

        let start: Date | null = null;
        let end: Date | null = null;

        if (b.start_time && b.end_time) {
          start = new Date(b.start_time);
          end = new Date(b.end_time);
        } else if (b.booking_date && b.booking_time) {
          const duration =
            b.service_duration_minutes || service?.duration_minutes || 120;

          start = new Date(`${b.booking_date}T${b.booking_time}`);
          end = new Date(start);
          end.setMinutes(end.getMinutes() + duration);
        }

        if (
          !start ||
          !end ||
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime())
        ) {
          console.warn("Skipping invalid booking calendar row:", b);
          return [];
        }

        return [
          {
            id: `booking-${b.id}`,
            title: service?.name
              ? `${service.name}${b.status === "pending" ? " • Pending" : ""}`
              : `Booking${b.status === "pending" ? " • Pending" : ""}`,
            start: start.toISOString(),
            end: end.toISOString(),
            backgroundColor: b.status === "pending" ? "#6f6077" : "#171018",
            borderColor: b.status === "pending" ? "#6f6077" : "#171018",
            textColor: "#ffffff",
          },
        ];
      } catch (err) {
        console.error("BOOKING EVENT MAP ERROR:", err, b);
        return [];
      }
    });

    const extraEvents: CalendarEvent[] = manualEvents.flatMap((e: any) => {
      try {
        if (!e.start_time || !e.end_time) return [];

        const start = new Date(e.start_time);
        const end = new Date(e.end_time);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          console.warn("Skipping invalid manual calendar row:", e);
          return [];
        }

        return [
          {
            id: `manual-${e.id}`,
            title:
              e.event_type === "blocked"
                ? e.title || "Blocked time"
                : e.title || "External booking",
            start: start.toISOString(),
            end: end.toISOString(),
            backgroundColor:
              e.event_type === "blocked" ? "#f7efff" : "#fff7fb",
            borderColor: e.event_type === "blocked" ? "#c084fc" : "#eadff5",
            textColor: "#171018",
          },
        ];
      } catch (err) {
        console.error("MANUAL EVENT MAP ERROR:", err, e);
        return [];
      }
    });

    setEvents([...bookingEvents, ...extraEvents]);
    setLoading(false);
  }

  async function handleSave() {
    setError(null);

    if (!selectedDate || !actionType) {
      setError("Please choose what you want to add.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSaving(true);

    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationHours * 60);

    const { data: conflicts, error: conflictError } = await supabase.rpc(
      "check_mua_time_conflict",
      {
        p_mua_id: user.id,
        p_start_time: start.toISOString(),
        p_end_time: end.toISOString(),
      }
    );

    if (conflictError) {
      console.error("CALENDAR CONFLICT CHECK ERROR:", conflictError);
      setError(conflictError.message);
      setSaving(false);
      return;
    }

    if (conflicts && conflicts.length > 0) {
      setError(
        "This time overlaps with an existing booking or blocked slot. Please choose another time."
      );
      setSaving(false);
      return;
    }

    const title =
      actionType === "blocked"
        ? "Blocked time"
        : customTitle.trim() || "External booking";

    const { error } = await supabase.from("mua_calendar_events").insert({
      mua_id: user.id,
      title,
      event_type: actionType,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });

    if (error) {
      console.error("CALENDAR INSERT ERROR:", error);
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    resetModal();
    await loadCalendar();
  }

  function resetModal() {
    setSelectedDate(null);
    setActionType("");
    setCustomTitle("");
    setDurationHours(1);
    setError(null);
    setSelectedPreview("");
  }

  function formatDateTime(date: Date) {
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
          Beaura MUA dashboard
        </p>

        <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#171018] sm:text-7xl">
          Calendar
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6077]">
          View your booking schedule, block unavailable time, and add external
          bookings so brides cannot request overlapping slots.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniCard
          icon={<CalendarDays size={17} />}
          label="Calendar rule"
          value="No overlaps"
        />
        <MiniCard
          icon={<Clock size={17} />}
          label="Visible hours"
          value="8 AM - 11 PM"
        />
        <MiniCard
          icon={<Sparkles size={17} />}
          label="Bookings"
          value="Auto synced"
        />
        <MiniCard
          icon={<CalendarDays size={17} />}
          label="Blocked time"
          value="Protected"
        />
      </div>

      <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-light tracking-[-0.05em] text-[#171018]">
              Your schedule
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6077]">
              Click any time slot to block it or add an external booking.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Legend label="Confirmed booking" dotClass="bg-[#171018]" />
            <Legend label="Pending booking" dotClass="bg-[#6f6077]" />
            <Legend
              label="Blocked time"
              dotClass="bg-[#f7efff] ring-1 ring-purple-300"
            />
            <Legend
              label="External booking"
              dotClass="bg-[#fff7fb] ring-1 ring-[#eadff5]"
            />
          </div>
        </div>
      </div>

      <div className="calendar-shell rounded-[2rem] border border-[#eadff5] bg-white p-4 shadow-sm sm:p-5">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          nowIndicator
          selectable
          events={events}
          dateClick={(info) => {
            setSelectedDate(info.date);
          }}
        />
      </div>

      {loading && (
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 text-sm text-[#6f6077]">
          Loading calendar…
        </div>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
                  add calendar item
                </p>

                <h2 className="mt-3 text-4xl font-light leading-[0.9] tracking-[-0.07em] text-[#171018]">
                  Protect this time.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6f6077]">
                  Add blocked time or an external booking. Brides will not be
                  able to request this slot.
                </p>
              </div>

              <button
                type="button"
                onClick={resetModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5]"
              >
                <X size={17} />
              </button>
            </div>

            {selectedPreview && (
              <div className="mb-5 rounded-[1.5rem] border border-[#eadff5] bg-[#fffafc] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
                  Selected time
                </p>
                <p className="mt-1 text-sm font-medium text-[#171018]">
                  {selectedPreview}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Field label="Action">
                <select
                  value={actionType}
                  onChange={(e) =>
                    setActionType(e.target.value as ManualEventType | "")
                  }
                  className="input"
                >
                  <option value="">Select action</option>
                  <option value="blocked">Block time</option>
                  <option value="external">External booking</option>
                </select>
              </Field>

              {actionType === "external" && (
                <Field label="External booking title">
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Example: Salon client / private booking"
                    className="input"
                  />
                </Field>
              )}

              <Field label="Duration">
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="input"
                >
                  <option value={0.5}>30 minutes</option>
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1 hour 30 minutes</option>
                  <option value={2}>2 hours</option>
                  <option value={2.5}>2 hours 30 minutes</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={5}>5 hours</option>
                  <option value={6}>6 hours</option>
                </select>
              </Field>
            </div>

            {error && (
              <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-12 flex-1 rounded-full bg-[#171018] text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                onClick={resetModal}
                className="h-12 flex-1 rounded-full border border-[#eadff5] text-sm font-medium text-[#171018]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .calendar-shell .fc {
          font-family: inherit;
          color: #171018;
        }

        .calendar-shell .fc-toolbar {
          gap: 1rem;
          flex-wrap: wrap;
        }

        .calendar-shell .fc-toolbar-title {
          font-size: 1.4rem;
          font-weight: 300;
          letter-spacing: -0.05em;
          color: #171018;
        }

        .calendar-shell .fc-button {
          background: #171018 !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 9999px !important;
          padding: 0.55rem 0.95rem !important;
          font-size: 0.82rem !important;
          text-transform: capitalize !important;
        }

        .calendar-shell .fc-button:hover {
          background: #2a202b !important;
        }

        .calendar-shell .fc-button-active {
          background: #7e22ce !important;
        }

        .calendar-shell .fc-theme-standard td,
        .calendar-shell .fc-theme-standard th,
        .calendar-shell .fc-theme-standard .fc-scrollgrid {
          border-color: #eadff5 !important;
        }

        .calendar-shell .fc-scrollgrid {
          border-radius: 1.5rem;
          overflow: hidden;
        }

        .calendar-shell .fc-col-header-cell {
          background: #fffafc;
          padding: 0.5rem 0;
        }

        .calendar-shell .fc-timegrid-slot {
          height: 2.2rem;
        }

        .calendar-shell .fc-timegrid-slot-label,
        .calendar-shell .fc-col-header-cell-cushion {
          color: #6f6077;
          font-size: 0.78rem;
          font-weight: 500;
        }

        .calendar-shell .fc-day-today {
          background: #fff7fb !important;
        }

        .calendar-shell .fc-timegrid-now-indicator-line {
          border-color: #a855f7 !important;
        }

        .calendar-shell .fc-timegrid-now-indicator-arrow {
          border-color: #a855f7 !important;
        }

        .calendar-shell .fc-event {
          border-radius: 14px !important;
          padding: 3px 5px !important;
          font-size: 0.78rem !important;
          border-width: 1px !important;
          box-shadow: 0 10px 25px rgba(88, 28, 135, 0.08);
        }

        .calendar-shell .fc-event-title {
          font-weight: 500;
        }
      `}</style>
    </section>
  );
}

function MiniCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f7efff] text-purple-700">
        {icon}
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#8a7d91]">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-[#171018]">{value}</p>
    </div>
  );
}

function Legend({ label, dotClass }: { label: string; dotClass: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] bg-[#fffafc] px-3 py-2 text-xs text-[#6f6077]">
      <span className={`h-3 w-3 rounded-full ${dotClass}`} />
      <span>{label}</span>
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

        .input:focus {
          border-color: #a855f7;
        }
      `}</style>
    </label>
  );
}