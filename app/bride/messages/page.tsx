"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, MessageCircle } from "lucide-react";

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
        mua_id,
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
      const normalized = data.map((conv: any) => ({
        ...conv,
        messages: (conv.messages || []).sort(
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
    <main className="min-h-screen overflow-x-hidden bg-[#fffafc] px-4 pb-28 pt-24 text-[#171018] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">
            inbox
          </p>

          <h1 className="mt-3 text-5xl font-light leading-[0.9] tracking-[-0.08em] sm:text-7xl">
            Messages
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#6f6077]">
            Chat with your makeup artists, ask questions, and keep all booking details in one cute place.
          </p>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-[#eadff5] bg-white p-8 text-center text-sm text-[#6f6077] shadow-sm">
            Loading conversations…
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f7efff] text-purple-700">
              <MessageCircle size={22} />
            </div>

            <h2 className="mt-6 text-2xl font-light tracking-[-0.05em]">
              No messages yet.
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6f6077]">
              When you message an artist, your conversation will appear here.
            </p>

            <Link
              href="/bride/home"
              className="mt-7 inline-flex rounded-full bg-[#171018] px-6 py-3 text-sm font-medium text-white"
            >
              Discover artists
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const lastMessage = conv.messages?.[0];
              const artistName =
                `${conv.mua_profiles?.first_name || ""} ${conv.mua_profiles?.last_name || ""}`.trim() ||
                "Makeup artist";

              const unread =
                lastMessage &&
                !lastMessage.is_read &&
                lastMessage.sender_id !== conv.bride_id;

              return (
                <Link
                  key={conv.id}
                  href={`/bride/messages/${conv.id}`}
                  className="group block rounded-[2rem] border border-[#eadff5] bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md sm:p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-13 w-13 shrink-0 place-items-center rounded-[1.3rem] bg-[#171018] text-sm font-medium text-white">
                        {artistName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-lg font-medium text-[#171018]">
                            {artistName}
                          </h2>

                          {unread && (
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-600" />
                          )}
                        </div>

                        <p className="mt-1 max-w-[220px] truncate text-sm text-[#6f6077] sm:max-w-md">
                          {lastMessage?.content || "No messages yet"}
                        </p>

                        <p className="mt-2 text-xs text-[#8a7d91]">
                          Started {new Date(conv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadff5] text-[#171018] transition group-hover:border-purple-300 group-hover:text-purple-700">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}