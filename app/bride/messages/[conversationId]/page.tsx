"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, SendHorizontal } from "lucide-react";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();

  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [artistName, setArtistName] = useState("Artist");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

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

      await Promise.all([
        fetchMessages(),
        loadArtistName(),
        markMessagesAsRead(user.id),
      ]);

      channel = supabase
        .channel(`bride-chat-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      setLoading(false);
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadArtistName() {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("mua_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conversation?.mua_id) return;

    const { data: mua } = await supabase
      .from("mua_profiles")
      .select("first_name, last_name")
      .eq("id", conversation.mua_id)
      .maybeSingle();

    const full = `${mua?.first_name || ""} ${mua?.last_name || ""}`.trim();

    if (full) setArtistName(full);
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !userId || !conversationId) return;

    const text = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: text,
      is_read: false,
    });

    if (error) {
      setNewMessage(text);
    }
  }

  async function markMessagesAsRead(currentUserId: string) {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId);
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#fffafc] pt-16 text-[#171018] sm:pt-20">
      <section className="mx-auto flex w-full max-w-5xl flex-col border-x border-[#eadff5] bg-white">
        <header className="border-b border-[#eadff5] bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/bride/messages")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5] bg-[#fffafc]"
            >
              <ArrowLeft size={17} />
            </button>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                conversation
              </p>

              <h1 className="truncate text-2xl font-light tracking-[-0.05em]">
                {artistName}
              </h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#fffafc] px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {loading ? (
              <p className="text-center text-sm text-[#6f6077]">
                Loading messages…
              </p>
            ) : messages.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center">
                <h2 className="text-2xl font-light tracking-[-0.05em]">
                  Start the conversation.
                </h2>

                <p className="mt-3 text-sm leading-7 text-[#6f6077]">
                  Ask about timing, prep, location, or anything you need before booking.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === userId;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[84%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[70%] ${
                        isMine
                          ? "rounded-br-md bg-[#171018] text-white"
                          : "rounded-bl-md border border-[#eadff5] bg-white text-[#171018]"
                      }`}
                    >
                      {msg.content}

                      <p
                        className={`mt-1 text-[10px] ${
                          isMine ? "text-white/45" : "text-[#8a7d91]"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="border-t border-[#eadff5] bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-3xl gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder={`Message ${artistName.split(" ")[0] || "artist"}...`}
              className="h-12 min-w-0 flex-1 rounded-full border border-[#eadff5] bg-[#fffafc] px-5 text-sm outline-none focus:border-purple-500"
            />

            <button
              onClick={sendMessage}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#171018] text-white sm:w-auto sm:px-6"
            >
              <SendHorizontal size={17} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}