"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabaseClient";

/* ============================
   TYPES
============================ */

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
};

/* ============================
   PAGE
============================ */

export default function MuaCalendarPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [actionType, setActionType] = useState<
    "service" | "blocked" | "external" | ""
  >("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [loading, setLoading] = useState(true);

  /* ============================
     LOAD DATA
  ============================ */

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([fetchServices(), fetchBookings()]);
    setLoading(false);
  }

  async function fetchServices() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("mua_services")
      .select("*")
      .eq("mua_id", user.id);

    if (!error) {
      setServices(data || []);
    }
  }

  async function fetchBookings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("mua_id", user.id);

    if (error) return;

    const formatted: CalendarEvent[] =
      data?.map((b) => ({
        id: b.id,
        title:
          b.type === "service"
            ? b.service_name
            : b.type === "blocked"
            ? "Blocked"
            : "External Booking",
        start: b.start_time,
        end: b.end_time,
        backgroundColor:
          b.type === "service"
            ? "#000000"
            : b.type === "blocked"
            ? "#9ca3af"
            : "#6b7280",
      })) || [];

    setEvents(formatted);
  }

  /* ============================
     ACTION HANDLER
  ============================ */

  async function handleSave() {
    if (!selectedDate || !actionType) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const start = new Date(selectedDate);
    let end = new Date(start);

    let service: Service | undefined;

    if (actionType === "service") {
      service = services.find(
        (s) => s.id === selectedServiceId
      );

      if (!service) return;

      end.setMinutes(
        end.getMinutes() + service.duration_minutes
      );
    } else {
      // blocked / external default 1 hour
      end.setHours(end.getHours() + 1);
    }

    await supabase.from("bookings").insert({
      mua_id: user.id,
      type: actionType,
      service_name:
        actionType === "service"
          ? service?.name
          : null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });

    resetModal();
    fetchBookings();
  }

  function resetModal() {
    setSelectedDate(null);
    setActionType("");
    setSelectedServiceId("");
  }

  /* ============================
     RENDER
  ============================ */

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h1 className="text-2xl font-light mb-6">
        Calendar
      </h1>

      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right:
            "dayGridMonth,timeGridWeek,timeGridDay",
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

      {/* ============================
         ACTION MODAL
      ============================ */}

      {selectedDate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6">
            <h2 className="text-lg font-light">
              Add to calendar
            </h2>

            <select
              value={actionType}
              onChange={(e) =>
                setActionType(
                  e.target.value as any
                )
              }
              className="w-full border px-4 py-3 rounded-xl"
            >
              <option value="">
                Select action
              </option>
              <option value="service">
                Service booking
              </option>
              <option value="blocked">
                Block time
              </option>
              <option value="external">
                External booking
              </option>
            </select>

            {actionType === "service" && (
              <select
                value={selectedServiceId}
                onChange={(e) =>
                  setSelectedServiceId(
                    e.target.value
                  )
                }
                className="w-full border px-4 py-3 rounded-xl"
              >
                <option value="">
                  Select service
                </option>
                {services.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                  >
                    {s.name} ({s.duration_minutes} min)
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-black text-white py-3 rounded-full"
              >
                Save
              </button>
              <button
                onClick={resetModal}
                className="flex-1 border py-3 rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}