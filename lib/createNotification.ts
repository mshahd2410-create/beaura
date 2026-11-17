import { supabase } from "@/lib/supabaseClient";

export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed"
  | "completion_pending"
  | "dispute_opened"
  | "payment_received"
  | "refund_issued"
  | "payout_eligible"
  | "new_message"
  | "admin_update";

type CreateNotificationInput = {
  userId: string;
  actorId?: string | null;
  bookingId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
};

export async function createNotification({
  userId,
  actorId = null,
  bookingId = null,
  type,
  title,
  message,
  href = null,
}: CreateNotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: actorId,
    booking_id: bookingId,
    type,
    title,
    message,
    href,
  });

  if (error) {
    console.error("Notification error:", error.message);
    return { success: false, error };
  }

  return { success: true };
}