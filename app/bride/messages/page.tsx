"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function BrideMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        created_at,
        bride_id,
        mua_profiles (
          id,
          first_name,
          last_name
        ),
        messages (
          content,
          created_at,
          sender_id,
          is_read
        )
      `)
      .eq("bride_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Ensure last message is actually the latest one
      const normalized = data.map((conv: any) => ({
        ...conv,
        messages: conv.messages?.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        ),
      }));

      setConversations(normalized);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-6 pt-28 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto space-y-10"
      >
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            Messages
          </h1>
          <p className="text-sm text-gray-500">
            Your conversations with makeup artists ✨
          </p>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {loading && (
            <p className="text-center text-sm text-gray-400">
              Loading conversations…
            </p>
          )}

          {!loading && conversations.length === 0 && (
            <p className="text-center text-sm text-gray-400">
              No conversations yet
            </p>
          )}

          {conversations.map((conv) => {
            const lastMessage = conv.messages?.[0];

            return (
              <Link
                key={conv.id}
                href={`/bride/messages/${conv.id}`} // ✅ FIXED ROUTE
                className="block"
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 hover:border-purple-300 transition"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      {conv.mua_profiles.first_name}{" "}
                      {conv.mua_profiles.last_name}
                    </p>

                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {lastMessage?.content || "No messages yet"}
                    </p>
                  </div>

                  {!lastMessage?.is_read &&
                    lastMessage?.sender_id !== conv.bride_id && (
                      <span className="h-3 w-3 rounded-full bg-purple-500" />
                    )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </main>
  );
}