"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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

    if (!user) return;

    const { data } = await supabase.rpc("get_mua_conversations", {
      mua_user_id: user.id,
    });

    setConversations(data || []);
    setLoading(false);
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading messages...</p>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <h1 className="text-2xl font-light">Messages 💬</h1>

      {conversations.length === 0 && (
        <p className="text-sm text-gray-500">No conversations yet</p>
      )}

      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/dashboard/mua/messages/${c.id}`}
          className="flex items-center justify-between border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <div>
            <p className="text-sm font-medium">Conversation</p>
            <p className="text-xs text-gray-500">
              Started {new Date(c.created_at).toLocaleDateString()}
            </p>
          </div>

          {c.unread_count > 0 && (
            <span className="bg-black text-white text-xs px-2 py-1 rounded-full">
              {c.unread_count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
