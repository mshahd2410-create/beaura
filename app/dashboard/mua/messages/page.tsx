"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

type Conversation = {
  id: string;
  bride_id: string;
  created_at: string;
  unread_count: number;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.rpc("get_mua_conversations", {
      mua_user_id: user.id,
    });

    setConversations(data || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            Messages
          </h1>
          <p className="text-sm text-gray-500">
            Your conversations with brides 💕
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-sm text-gray-400">
            Loading conversations…
          </p>
        )}

        {/* EMPTY STATE */}
        {!loading && conversations.length === 0 && (
          <div className="text-center bg-white rounded-3xl p-10 border border-purple-100 shadow-sm">
            <p className="text-lg font-medium text-gray-700">
              No messages yet ✨
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Brides will appear here once they message you.
            </p>
          </div>
        )}

        {/* CONVERSATIONS */}
        <div className="space-y-4">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/mua/messages/${c.id}`}
              className="block"
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-purple-300 transition"
              >
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center text-white font-medium">
                    B
                  </div>

                  {/* Text */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      Bride conversation
                    </p>
                    <p className="text-xs text-gray-500">
                      Started{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* UNREAD BADGE */}
                {c.unread_count > 0 && (
                  <span className="min-w-[24px] h-6 px-2 flex items-center justify-center rounded-full bg-purple-600 text-white text-xs font-medium">
                    {c.unread_count}
                  </span>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </main>
  );
}