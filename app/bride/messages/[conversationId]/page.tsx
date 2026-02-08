"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, [conversationId]);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !conversationId) return;

    setUserId(user.id);
    await fetchMessages();
    await markMessagesAsRead(user.id);
  }

  async function fetchMessages() {
    if (!conversationId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !userId || !conversationId) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: newMessage.trim(),
      is_read: false,
    });

    if (!error) {
      setNewMessage("");
      await fetchMessages();
    }
  }

  async function markMessagesAsRead(currentUserId: string) {
    if (!conversationId) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId);
  }

  function scrollToBottom() {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <main className="min-h-screen bg-white flex flex-col pt-24">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isMine = msg.sender_id === userId;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
                    isMine
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-700 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="border-t border-gray-200 px-6 py-4 bg-white">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write something sweet…"
            className="flex-1 h-12 rounded-full border border-gray-300 px-5 text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={sendMessage}
            className="h-12 px-6 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}