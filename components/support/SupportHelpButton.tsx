"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SupportHelpButtonProps = {
  userType: "bride" | "mua";
};

export default function SupportHelpButton({ userType }: SupportHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  async function submitTicket() {
    if (!subject.trim() || !message.trim()) {
      alert("Please add a subject and message.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      alert("You must be logged in to contact support.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      user_type: userType,
      subject,
      message,
      priority,
      status: "open",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSubject("");
    setMessage("");
    setPriority("medium");
    setOpen(false);
    alert("Support ticket sent 💜");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-purple-600 px-5 py-3 text-sm text-white shadow-sm transition hover:bg-purple-700"
      >
        Need help?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Contact Support
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tell us what happened and we’ll review it.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Example: Booking issue"
                  className="mt-1 h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 h-12 w-full rounded-2xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Write your issue here..."
                  className="mt-1 w-full rounded-2xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={submitTicket}
                disabled={loading}
                className="h-12 w-full rounded-full bg-purple-600 text-sm text-white transition hover:bg-purple-700 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send to Support"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}