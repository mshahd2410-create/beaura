"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  async function loadNotifications(currentUserId: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error.message);
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  }

  async function markAllAsRead() {
    if (!userId) return;

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("user_id", userId);

    if (error) {
      console.error(error.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
      }))
    );
  }

  async function markOneAsRead(id: string) {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error(error.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await loadNotifications(user.id);

      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [
              payload.new as Notification,
              ...prev,
            ]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as Notification;

            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    init();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full border border-[#eadfd7] bg-white p-2 text-[#4b342c] shadow-sm transition hover:bg-[#f8f1ed]"
        aria-label="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8b5e4c] px-1 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-[#eadfd7] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#f0e5df] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-[#3f2f2a]">
                Notifications
              </h3>
              <p className="text-xs text-[#8a756b]">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
            </div>

            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#8b5e4c] transition hover:bg-[#f8f1ed]"
            >
              <CheckCheck size={14} />
              Mark read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-[#8a756b]">
                <Loader2 className="mr-2 animate-spin" size={18} />
                Loading
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-[#3f2f2a]">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-[#8a756b]">
                  Booking updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={async () => {
                    await markOneAsRead(notification.id);

                    if (notification.href) {
                      window.location.href = notification.href;
                    }
                  }}
                  className={`block w-full border-b border-[#f4ebe6] px-5 py-4 text-left transition hover:bg-[#fdf8f5] ${
                    notification.is_read ? "bg-white" : "bg-[#fff8f4]"
                  }`}
                >
                  <div className="flex gap-3">
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-[#8b5e4c]" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#3f2f2a]">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#7d6a61]">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[11px] text-[#aa958a]">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}