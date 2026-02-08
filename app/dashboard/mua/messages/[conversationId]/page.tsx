"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  if (!conversationId) return;
  init();
}, [conversationId]);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);
    await loadMessages(user.id);

    const channel = subscribeRealtime();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function loadMessages(uid: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", uid);
  }

  function subscribeRealtime() {
    return supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
  if (!text && !image) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    console.error("❌ NO USER FOUND", userError);
    return;
  }
  let imageUrl: string | null = null;

  if (image) {
    const path = `chat/${conversationId}/${crypto.randomUUID()}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(path, image);

    if (uploadError) {
      console.error("❌ IMAGE UPLOAD ERROR:", uploadError);
      return;
    }

    const { data } = supabase.storage
      .from("chat-images")
      .getPublicUrl(path);

    imageUrl = data.publicUrl;
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id, // 🔥 THIS IS THE FIX
    content: text || null,
    image_url: imageUrl,
    is_read: false,
  });

  if (error) {
    console.error("❌ MESSAGE INSERT ERROR:", error);
    return;
  }

  setText("");
  setImage(null);
}

  return (
    <main className="h-[calc(100vh-120px)] flex flex-col bg-gradient-to-b from-purple-50 to-white rounded-3xl shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b bg-white/70 backdrop-blur">
        <h2 className="text-lg font-medium text-gray-900">
          Conversation 💌
        </h2>
        <p className="text-xs text-gray-500">
          Chat with your bride
        </p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((m) => {
          const isMine = m.sender_id === userId;

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[75%] space-y-1">
                {m.image_url && (
                  <img
                    src={m.image_url}
                    alt=""
                    className={`rounded-2xl shadow border ${
                      isMine ? "ml-auto" : ""
                    } max-w-[240px]`}
                  />
                )}

                {m.content && (
                  <div
                    className={`px-4 py-2 text-sm leading-relaxed rounded-2xl ${
                      isMine
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white border text-gray-700 rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-purple-600 text-sm">
            📷
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write something sweet…"
            className="flex-1 h-11 rounded-full border border-gray-300 px-5 text-sm focus:outline-none focus:border-purple-500"
          />

          <button
            onClick={sendMessage}
            className="h-11 px-6 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}