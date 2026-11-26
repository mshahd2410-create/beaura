import { supabase } from "@/lib/supabaseClient";

export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "completion_pending"
  | "dispute_opened"
  | "admin_update"
  | "travel_fee_quote"
  | "travel_fee_accepted"
  | "travel_fee_declined";

export type AdminNotificationType =
  | "booking_confirmed"
  | "booking_rejected"
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

type CreateAdminNotificationInput = {
  userId: string;
  bookingId: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  href?: string | null;
};

export async function createNotification({
  userId,
  bookingId = null,
  type,
  title,
  message,
  href = null,
}: CreateNotificationInput) {
  // The database derives actor_id from auth.uid() and validates that both
  // the caller and recipient are participants in the referenced booking.
  // actorId remains optional in the input for backwards compatibility, but
  // is intentionally never trusted or sent to the database.
  if (!bookingId) {
    return {
      success: false,
      error: new Error("A booking is required to create this notification."),
    };
  }

  const { error } = await supabase.rpc("create_booking_notification", {
    p_user_id: userId,
    p_booking_id: bookingId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_href: href,
  });

  if (error) {
    console.error("Notification error:", error.message);
    return { success: false, error };
  }

  return { success: true };
}

export async function createAdminNotification({
  userId,
  bookingId,
  type,
  title,
  message,
  href = null,
}: CreateAdminNotificationInput) {
  const { error } = await supabase.rpc("create_admin_booking_notification", {
    p_user_id: userId,
    p_booking_id: bookingId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_href: href,
  });

  if (error) {
    console.error("Admin notification error:", error.message);
    return { success: false, error };
  }

  return { success: true };
}
