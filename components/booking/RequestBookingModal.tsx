"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  muaId: string;
  open: boolean;
  onClose: () => void;
};

export default function RequestBookingModal({ muaId, open, onClose }: Props) {
  const [services, setServices] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    supabase
      .from("mua_services")
      .select("*")
      .eq("mua_id", muaId)
      .then(({ data }) => {
        setServices(data || []);
      });
  }, [open, muaId]);

  const submit = async () => {
    if (!selected) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("bookings").insert({
      bride_id: user.id,
      mua_id: muaId,
      service_id: selected,
      booking_date: new Date().toISOString().split("T")[0], // temp
      booking_time: "00:00", // temp
    });

    setLoading(false);
    onClose();
    alert("Booking request sent 💜");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl p-6"
          >
            <h2 className="text-lg font-medium mb-4">
              Choose a service
            </h2>

            <div className="space-y-3">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition
                  ${
                    selected === s.id
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {s.duration_minutes} min
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      EGP {s.price}
                    </span>
                    <input
                      type="radio"
                      checked={selected === s.id}
                      onChange={() => setSelected(s.id)}
                    />
                  </div>
                </label>
              ))}
            </div>

            <button
              disabled={!selected || loading}
              onClick={submit}
              className="mt-6 w-full h-12 rounded-full bg-black text-white disabled:opacity-40"
            >
              {loading ? "Sending..." : "Continue"}
            </button>

            <button
              onClick={onClose}
              className="mt-3 w-full text-xs text-gray-400"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}