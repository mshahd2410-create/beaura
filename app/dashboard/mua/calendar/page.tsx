"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabaseClient";

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

  async function loadCalendar() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: bookings }, { data: manualEvents }] = await Promise.all([
      supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          service_id,
          mua_services(name, duration_minutes)
        `)
        .eq("mua_id", user.id)
        .in("status", ["pending", "confirmed"]),
      supabase
        .from("mua_calendar_events")
        .select("*")
        .eq("mua_id", user.id),
    ]);

    const bookingEvents: CalendarEvent[] =
      bookings?.flatMap((b: any) => {
        if (!b.booking_date || !b.booking_time) return [];

        const service = Array.isArray(b.mua_services)
          ? b.mua_services[0]
          : b.mua_services;

        const duration = service?.duration_minutes || 120;

        const start = new Date(`${b.booking_date}T${b.booking_time}`);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);

        return [
          {
            id: `booking-${b.id}`,
            title: service?.name
              ? `${service.name}${b.status === "pending" ? " • Pending" : ""}`
              : `Booking${b.status === "pending" ? " • Pending" : ""}`,
            start: start.toISOString(),
            end: end.toISOString(),
            backgroundColor: b.status === "pending" ? "#3a3a3a" : "#000000",
            borderColor: b.status === "pending" ? "#3a3a3a" : "#000000",
            textColor: "#ffffff",
          },
        ];
      }) || [];

    const extraEvents: CalendarEvent[] =
      manualEvents?.map((e: any) => ({
        id: `manual-${e.id}`,
        title: e.title,
        start: e.start_time,
        end: e.end_time,
        backgroundColor:
          e.event_type === "blocked" ? "#e7d8de" : "#ddd6fe",
        borderColor:
          e.event_type === "blocked" ? "#d4b8c2" : "#c4b5fd",
        textColor: "#111111",
      })) || [];

    setEvents([...bookingEvents, ...extraEvents]);
    setLoading(false);
  }

  async function handleSave() {
    if (!selectedDate || !actionType) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSaving(true);

    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setHours(end.getHours() + durationHours);

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
  }

  return (
    <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Beaura MUA Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
            Calendar
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Your confirmed and pending bookings appear here automatically. You can also block time or add external bookings.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Legend label="Confirmed booking" color="bg-black" />
        <Legend label="Pending booking" color="bg-[#3a3a3a]" />
        <Legend label="Blocked time" color="bg-[#e7d8de]" darkText />
        <Legend label="External booking" color="bg-[#ddd6fe]" darkText />
      </div>

      <div className="calendar-shell">
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
        <p className="mt-4 text-sm text-gray-500">Loading calendar…</p>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Add calendar item
              </p>
              <h2 className="mt-2 text-xl font-semibold text-black">
                Add to calendar
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Choose whether you want to block time or add an external booking.
              </p>
            </div>

            <div className="space-y-4">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ManualEventType | "")}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                <option value="">Select action</option>
                <option value="blocked">Block time</option>
                <option value="external">External booking</option>
              </select>

              {actionType === "external" && (
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Example: Salon client / private booking"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a1a1a] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={resetModal}
                className="flex-1 rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
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
        }

        .calendar-shell .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #111;
        }

        .calendar-shell .fc-button {
          background: #000 !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 9999px !important;
          padding: 0.45rem 0.9rem !important;
          font-size: 0.85rem !important;
        }

        .calendar-shell .fc-button:hover {
          background: #1b1b1b !important;
        }

        .calendar-shell .fc-theme-standard td,
        .calendar-shell .fc-theme-standard th,
        .calendar-shell .fc-theme-standard .fc-scrollgrid {
          border-color: rgba(0, 0, 0, 0.08) !important;
        }

        .calendar-shell .fc-col-header-cell {
          background: #fafafa;
        }

        .calendar-shell .fc-timegrid-slot-label,
        .calendar-shell .fc-col-header-cell-cushion {
          color: #444;
          font-size: 0.82rem;
        }

        .calendar-shell .fc-event {
          border-radius: 14px;
          padding: 2px 4px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

function Legend({
  label,
  color,
  darkText = false,
}: {
  label: string;
  color: string;
  darkText?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-gray-700">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className={darkText ? "text-black" : ""}>{label}</span>
    </div>
  );
}