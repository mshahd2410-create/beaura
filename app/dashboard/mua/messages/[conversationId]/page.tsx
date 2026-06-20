"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { ArrowLeft, ImagePlus, SendHorizontal } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

type ConversationRow = {
  id: string;
  bride_id: string;
  mua_id: string;
};

type BrideProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [brideName, setBrideName] = useState("Conversation");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    init();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function init() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    await Promise.all([loadConversationMeta(), loadMessages(user.id)]);
    setLoading(false);

    const channel = subscribeRealtime();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function loadConversationMeta() {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, bride_id, mua_id")
      .eq("id", conversationId)
      .maybeSingle<ConversationRow>();

    if (!conversation?.bride_id) return;

    const { data: bride } = await supabase
      .from("bride_profiles")
      .select("id, first_name, last_name")
      .eq("id", conversation.bride_id)
      .maybeSingle<BrideProfile>();

    const fullName = `${bride?.first_name || ""} ${bride?.last_name || ""}`.trim();
    if (fullName) setBrideName(fullName);
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

  async function sendMessage() {
    if ((!text.trim() && !image) || sending) return;

    setSending(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      setSending(false);
      return;
    }

    let imageUrl: string | null = null;

    if (image) {
      const path = `chat/${conversationId}/${crypto.randomUUID()}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(path, image);

      if (uploadError) {
        setSending(false);
        return;
      }

      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text.trim() || null,
      image_url: imageUrl,
      is_read: false,
    });

    if (!error) {
      setText("");
      setImage(null);
    }

    setSending(false);
  }

  const groupedDateLabel = useMemo(() => {
    if (messages.length === 0) return "";
    const first = new Date(messages[0].created_at);
    return first.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [messages]);

  return (
    <main className="space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_14px_40px_rgba(17,16,24,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="grid h-11 w-11 place-items-center rounded-full border border-gray-100 text-[#171018] transition hover:border-violet-200 hover:text-violet-600"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-500">
                conversation
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#171018]">
                {brideName}
              </h1>
              <p className="mt-1 text-sm text-[#6B6476]">
                Reply quickly, share details, and keep everything inside Beaura.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/mua/messages"
            className="inline-flex h-11 items-center justify-center rounded-full border border-gray-100 px-5 text-sm font-medium text-[#171018] transition hover:border-violet-200 hover:text-violet-600"
          >
            Back to inbox
          </Link>
        </div>
      </div>

      {/* CHAT */}
      <div className="overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-[0_18px_45px_rgba(17,16,24,0.06)]">
        {/* TOP BAR */}
        <div className="border-b border-gray-100 bg-[#FCFBFF] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#171018]">{brideName}</h2>
              <p className="text-xs text-[#7B7388]">
                Keep communication on-platform for bookings and support.
              </p>
            </div>

            {groupedDateLabel && (
              <span className="rounded-full bg-white px-3 py-1 text-xs text-[#7B7388] border border-gray-100">
                {groupedDateLabel}
              </span>
            )}
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div className="h-[58vh] overflow-y-auto bg-[#FFFEFF] px-4 py-5 sm:px-6 sm:py-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-14 w-[75%] animate-pulse rounded-3xl ${
                    i % 2 === 0 ? "bg-[#F6F1FF]" : "ml-auto bg-[#F2F2F5]"
                  }`}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-sm rounded-[28px] border border-dashed border-gray-200 bg-[#FCFBFF] px-6 py-10 text-center">
                <h3 className="text-lg font-semibold text-[#171018]">
                  Start the conversation
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6B6476]">
                  Send a message to introduce yourself, confirm details, or ask
                  about the booking.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMine = message.sender_id === userId;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[72%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-2`}>
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Chat image"
                          className={`max-h-[300px] rounded-[24px] border border-gray-100 object-cover shadow-sm ${
                            isMine ? "ml-auto" : ""
                          }`}
                        />
                      )}

                      {message.content && (
                        <div
                          className={`rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm ${
                            isMine
                              ? "rounded-br-[8px] bg-[#171018] text-white"
                              : "rounded-bl-[8px] border border-gray-100 bg-[#F8F4FF] text-[#171018]"
                          }`}
                        >
                          {message.content}
                        </div>
                      )}

                      <span className="px-1 text-[11px] text-[#8A8295]">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="border-t border-gray-100 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-100 text-[#171018] transition hover:border-violet-200 hover:text-violet-600">
              <ImagePlus size={18} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            <div className="flex-1 rounded-[28px] border border-gray-200 bg-[#FFFEFF] px-4 py-3 focus-within:border-violet-300">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message ${brideName.split(" ")[0] || "your client"}...`}
                rows={1}
                className="max-h-32 min-h-[24px] w-full resize-none bg-transparent text-sm leading-6 text-[#171018] outline-none placeholder:text-[#9A93A6]"
              />
              {image && (
                <p className="mt-2 text-xs text-violet-600">
                  Attached: {image.name}
                </p>
              )}
            </div>

            <button
              onClick={sendMessage}
              disabled={sending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#171018] px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <SendHorizontal size={16} />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}