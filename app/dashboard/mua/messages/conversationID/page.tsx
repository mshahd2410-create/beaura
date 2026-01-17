"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

export default function ChatPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const conversationId = params.conversationId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    await loadMessages(user.id);
    subscribeRealtime();
  }

  async function loadMessages(uid: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");

    setMessages(data || []);

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", uid);
  }

  function subscribeRealtime() {
    supabase
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

    let imageUrl: string | null = null;

    if (image) {
      const path = `chat/${conversationId}/${crypto.randomUUID()}`;

      const { error } = await supabase.storage
        .from("chat-images")
        .upload(path, image);

      if (!error) {
        const { data } = supabase.storage
          .from("chat-images")
          .getPublicUrl(path);

        imageUrl = data.publicUrl;
      }
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: text || null,
      image_url: imageUrl,
      is_read: false,
    });

    setText("");
    setImage(null);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => {
          const isMine = m.sender_id === userId;

          return (
            <div
              key={m.id}
              className={`max-w-xs ${
                isMine ? "ml-auto text-right" : ""
              }`}
            >
              {m.image_url && (
                <img
                  src={m.image_url}
                  className="rounded-2xl border shadow-sm mb-1 max-w-[220px]"
                />
              )}

              {m.content && (
                <p
                  className={`px-4 py-2 text-sm rounded-2xl ${
                    isMine
                      ? "bg-black text-white rounded-br-none"
                      : "bg-gray-100 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </p>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="text-xs"
        />

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border rounded-full px-4 py-2 text-sm"
        />

        <button
          onClick={sendMessage}
          className="bg-black text-white px-5 py-2 rounded-full text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
