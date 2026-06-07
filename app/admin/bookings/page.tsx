"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  bride_id: string | null;
  mua_id: string | null;
  service_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  service_price: number | null;
  platform_fee: number | null;
  tax_fee: number | null;
  total_price: number | null;
  deposit_amount: number | null;
  deposit_held: boolean;
  deposit_released: boolean;
  remaining_amount: number | null;
  remaining_paid: boolean;
  mua_photo_url: string | null;

  bride?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;

  mua?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;

  service?: {
    id: string;
    name: string | null;
    price: number | null;
    duration_minutes: number | null;
  } | null;
};

type StatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);

    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BOOKINGS LOAD ERROR:", error);
      setLoading(false);
      return;
    }

    const rawBookings = (bookingsData || []) as Booking[];

    const brideIds = Array.from(
      new Set(rawBookings.map((b) => b.bride_id).filter(Boolean))
    ) as string[];

    const muaIds = Array.from(
      new Set(rawBookings.map((b) => b.mua_id).filter(Boolean))
    ) as string[];

    const serviceIds = Array.from(
      new Set(rawBookings.map((b) => b.service_id).filter(Boolean))
    ) as string[];

    const [bridesRes, muasRes, servicesRes] = await Promise.all([
      brideIds.length
        ? supabase
            .from("bride_profiles")
            .select("id, first_name, last_name")
            .in("id", brideIds)
        : Promise.resolve({ data: [], error: null }),

      muaIds.length
        ? supabase
            .from("mua_profiles")
            .select("id, first_name, last_name")
            .in("id", muaIds)
        : Promise.resolve({ data: [], error: null }),

      serviceIds.length
        ? supabase
            .from("mua_services")
            .select("id, name, price, duration_minutes")
            .in("id", serviceIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (bridesRes.error) console.error("BRIDES LOAD ERROR:", bridesRes.error);
    if (muasRes.error) console.error("MUAS LOAD ERROR:", muasRes.error);
    if (servicesRes.error) console.error("SERVICES LOAD ERROR:", servicesRes.error);

    const brides = (bridesRes.data || []) as Booking["bride"][];
    const muas = (muasRes.data || []) as Booking["mua"][];
    const services = (servicesRes.data || []) as Booking["service"][];

    const enriched = rawBookings.map((booking) => ({
      ...booking,
      bride: brides.find((b) => b?.id === booking.bride_id) || null,
      mua: muas.find((m) => m?.id === booking.mua_id) || null,
      service: services.find((s) => s?.id === booking.service_id) || null,
    }));

    setBookings(enriched);
    setLoading(false);
  }

  async function updateBookingStatus(id: string, status: string) {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("UPDATE BOOKING STATUS ERROR:", error);
      alert(error.message);
      return;
    }

    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status } : booking
      )
    );

    if (selectedBooking?.id === id) {
      setSelectedBooking({
        ...selectedBooking,
        status,
      });
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const brideName = `${booking.bride?.first_name || ""} ${
        booking.bride?.last_name || ""
      }`.toLowerCase();

      const muaName = `${booking.mua?.first_name || ""} ${
        booking.mua?.last_name || ""
      }`.toLowerCase();

      const serviceName = booking.service?.name?.toLowerCase() || "";
      const bookingId = booking.id.toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch =
        brideName.includes(query) ||
        muaName.includes(query) ||
        serviceName.includes(query) ||
        bookingId.includes(query);

      let matchesFilter = true;

      if (filter !== "all") {
        if (filter === "cancelled") {
          matchesFilter = booking.status?.includes("cancelled");
        } else {
          matchesFilter = booking.status === filter;
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [bookings, search, filter]);

  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter((b) =>
    b.status?.includes("cancelled")
  ).length;

  function formatMoney(value: number | null) {
    if (value === null || value === undefined) return "EGP 0";
    return `EGP ${Number(value).toLocaleString()}`;
  }

  function formatDate(date: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  }

  return (
    <main className="min-h-screen bg-[#FAF8FF] p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Bookings
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Monitor, manage, and resolve all Beaura bookings.
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-5 md:grid-cols-5 mb-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total</p>
          <h2 className="mt-3 text-3xl font-semibold">{totalBookings}</h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pending</p>
          <h2 className="mt-3 text-3xl font-semibold text-amber-500">
            {pendingCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Confirmed</p>
          <h2 className="mt-3 text-3xl font-semibold text-purple-600">
            {confirmedCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Completed</p>
          <h2 className="mt-3 text-3xl font-semibold text-green-600">
            {completedCount}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Cancelled</p>
          <h2 className="mt-3 text-3xl font-semibold text-red-500">
            {cancelledCount}
          </h2>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bride, MUA, service, or booking ID..."
            className="w-full md:max-w-md h-12 rounded-2xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="flex flex-wrap gap-2">
            {["all", "pending", "confirmed", "completed", "cancelled"].map(
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
            {/* TABLE */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-gray-700">
              No bookings found
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
                  <th className="px-6 py-4 font-medium">Booking</th>
                  <th className="px-6 py-4 font-medium">Bride</th>
                  <th className="px-6 py-4 font-medium">MUA</th>
                  <th className="px-6 py-4 font-medium">Service</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-gray-900">
                        #{booking.id.slice(0, 8)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Created {formatDate(booking.created_at)}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-700">
                      {booking.bride
                        ? `${booking.bride.first_name || ""} ${
                            booking.bride.last_name || ""
                          }`
                        : "Unknown bride"}
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-700">
                      {booking.mua
                        ? `${booking.mua.first_name || ""} ${
                            booking.mua.last_name || ""
                          }`
                        : "Unknown MUA"}
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-700">
                      {booking.service?.name || "—"}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm text-gray-700">
                        {formatDate(booking.booking_date)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {booking.booking_time || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          booking.status === "completed"
                            ? "bg-green-50 text-green-700"
                            : booking.status === "confirmed"
                            ? "bg-purple-50 text-purple-700"
                            : booking.status?.includes("cancelled")
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-gray-900">
                      {formatMoney(booking.total_price)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            updateBookingStatus(booking.id, "confirmed")
                          }
                          className="rounded-full border border-purple-200 px-3 py-1 text-xs text-purple-700 hover:bg-purple-50"
                        >
                          Confirm
                        </button>

                        <button
                          onClick={() =>
                            updateBookingStatus(booking.id, "completed")
                          }
                          className="rounded-full border border-green-200 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                        >
                          Complete
                        </button>

                        <button
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "cancelled_by_admin"
                            )
                          }
                          className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Cancel
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
            {/* DRAWER */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedBooking(null)}
          />

          {/* PANEL */}
          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Booking Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  #{selectedBooking.id.slice(0, 8)}
                </p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 p-6">
              {/* STATUS */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Status
                </h3>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      selectedBooking.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : selectedBooking.status === "confirmed"
                        ? "bg-purple-50 text-purple-700"
                        : selectedBooking.status?.includes("cancelled")
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
              </section>

              {/* PEOPLE */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  People
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Bride</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedBooking.bride
                        ? `${selectedBooking.bride.first_name || ""} ${
                            selectedBooking.bride.last_name || ""
                          }`
                        : "Unknown bride"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Makeup Artist</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedBooking.mua
                        ? `${selectedBooking.mua.first_name || ""} ${
                            selectedBooking.mua.last_name || ""
                          }`
                        : "Unknown MUA"}
                    </p>
                  </div>
                </div>
              </section>

              {/* BOOKING INFO */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Booking Information
                </h3>

                <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-xs text-gray-400">Service</p>
                    <p className="mt-1 text-gray-700">
                      {selectedBooking.service?.name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(selectedBooking.booking_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Time</p>
                    <p className="mt-1 text-gray-700">
                      {selectedBooking.booking_time || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="mt-1 text-gray-700">
                      {selectedBooking.location || "No location provided."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Notes</p>
                    <p className="mt-1 leading-relaxed text-gray-700">
                      {selectedBooking.notes || "No notes provided."}
                    </p>
                  </div>
                </div>
              </section>

              {/* PRICE BREAKDOWN */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Price Breakdown
                </h3>

                <div className="space-y-3 rounded-3xl border border-gray-100 bg-gray-50 p-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service price</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(selectedBooking.service_price)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform fee</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(selectedBooking.platform_fee)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(selectedBooking.tax_fee)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">
                      {formatMoney(selectedBooking.total_price)}
                    </span>
                  </div>
                </div>
              </section>

              {/* PAYMENT STATE */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Payment State
                </h3>

                <div className="space-y-3 rounded-3xl border border-gray-100 bg-gray-50 p-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deposit amount</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(selectedBooking.deposit_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Deposit held</span>
                    <span>{selectedBooking.deposit_held ? "Yes" : "No"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Deposit released</span>
                    <span>
                      {selectedBooking.deposit_released ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Remaining amount</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(selectedBooking.remaining_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Remaining paid</span>
                    <span>{selectedBooking.remaining_paid ? "Yes" : "No"}</span>
                  </div>
                </div>
              </section>

              {/* COMPLETION PHOTO */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Completion Photo
                </h3>

                {selectedBooking.mua_photo_url ? (
                  <img
                    src={selectedBooking.mua_photo_url}
                    alt="Completed makeup"
                    className="w-full rounded-3xl border border-gray-100 object-cover"
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                    No completion photo uploaded yet.
                  </div>
                )}
              </section>

              {/* ADMIN ACTIONS */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Admin Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      updateBookingStatus(selectedBooking.id, "confirmed")
                    }
                    className="rounded-full border border-purple-200 px-4 py-2 text-sm text-purple-700 transition hover:bg-purple-50"
                  >
                    Mark Confirmed
                  </button>

                  <button
                    onClick={() =>
                      updateBookingStatus(selectedBooking.id, "completed")
                    }
                    className="rounded-full border border-green-200 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                  >
                    Mark Completed
                  </button>

                  <button
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking.id,
                        "cancelled_by_admin"
                      )
                    }
                    className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Cancel Booking
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