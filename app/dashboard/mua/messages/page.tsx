"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { MessageCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type Conversation = {
  id: string;
  bride_id: string;
  created_at: string;
  unread_count: number;
};

type BrideProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type ConversationWithBride = Conversation & {
  bride?: BrideProfile | null;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithBride[]>([]);
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

    const { data, error } = await supabase.rpc("get_mua_conversations", {
      mua_user_id: user.id,
    });

    if (error || !data) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationRows = data as Conversation[];

    const brideIds = [
      ...new Set(conversationRows.map((c) => c.bride_id).filter(Boolean)),
    ];

    let brides: BrideProfile[] = [];

    if (brideIds.length > 0) {
      const { data: brideData } = await supabase
        .from("bride_profiles")
        .select("id, first_name, last_name")
        .in("id", brideIds);

      brides = brideData || [];
    }

    const merged: ConversationWithBride[] = conversationRows.map((conversation) => ({
      ...conversation,
      bride: brides.find((b) => b.id === conversation.bride_id) || null,
    }));

    setConversations(merged);
    setLoading(false);
  }

  function getInitials(bride?: BrideProfile | null) {
    const first = bride?.first_name?.[0] || "";
    const last = bride?.last_name?.[0] || "";
    const initials = `${first}${last}`.trim();
    return initials || "B";
  }

  function getBrideName(bride?: BrideProfile | null) {
    const full = `${bride?.first_name || ""} ${bride?.last_name || ""}`.trim();
    return full || "Conversation";
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}
      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(17,16,24,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-500">
              inbox
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#171018]">
              Messages
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6476]">
              Keep all your client chats in one place, reply faster, and stay on
              top of new booking questions.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#FAF8FF] px-4 py-3 text-sm text-[#171018]">
            <span className="font-semibold">{conversations.length}</span>{" "}
            conversation{conversations.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="rounded-[28px] border border-gray-100 bg-white p-4 shadow-[0_14px_40px_rgba(17,16,24,0.05)] sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[92px] animate-pulse rounded-[24px] bg-[#FAF8FF]"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#FCFBFF] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEFF] text-violet-600">
              <MessageCircle size={22} />
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#171018]">
              No messages yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B6476]">
              Once someone messages you from Beaura, the conversation will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation, index) => {
              const brideName = getBrideName(conversation.bride);

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    href={`/dashboard/mua/messages/${conversation.id}`}
                    className="group flex items-center justify-between gap-4 rounded-[24px] border border-gray-100 bg-white px-4 py-4 transition hover:border-violet-200 hover:bg-[#FCFAFF] sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F4EFFF] text-sm font-semibold text-violet-700">
                        {getInitials(conversation.bride)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[#171018]">
                          {brideName}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7B7388]">
                          <span>
                            Started{" "}
                            {new Date(conversation.created_at).toLocaleDateString()}
                          </span>

                          {conversation.unread_count > 0 && (
                            <span className="inline-flex items-center rounded-full bg-[#F3EEFF] px-2.5 py-1 font-medium text-violet-700">
                              {conversation.unread_count} unread
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {conversation.unread_count > 0 && (
                        <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#171018] px-2 text-xs font-medium text-white">
                          {conversation.unread_count}
                        </span>
                      )}

                      <div className="grid h-10 w-10 place-items-center rounded-full border border-gray-100 text-[#6B6476] transition group-hover:border-violet-200 group-hover:text-violet-600">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}