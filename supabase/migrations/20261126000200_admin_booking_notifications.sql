-- Admin-only booking notifications.
-- Keep the participant-only create_booking_notification RPC unchanged.

CREATE OR REPLACE FUNCTION public.create_admin_booking_notification(
  p_user_id uuid,
  p_booking_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_href text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_bride_id uuid;
  v_mua_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.admins AS a WHERE a.user_id = v_actor_id
  ) THEN
    RAISE EXCEPTION 'Only administrators can create admin booking notifications';
  END IF;

  IF p_user_id IS NULL OR p_booking_id IS NULL THEN
    RAISE EXCEPTION 'A recipient and booking are required';
  END IF;

  IF p_type IS NULL OR p_type NOT IN (
    'booking_confirmed',
    'booking_rejected',
    'admin_update'
  ) THEN
    RAISE EXCEPTION 'Admin notification type is not allowed';
  END IF;

  IF p_title IS NULL OR length(btrim(p_title)) = 0 OR length(p_title) > 120
     OR p_message IS NULL OR length(btrim(p_message)) = 0 OR length(p_message) > 1000 THEN
    RAISE EXCEPTION 'Invalid notification title or message';
  END IF;

  IF p_href IS NOT NULL AND (
    length(p_href) > 300
    OR left(p_href, 1) <> '/'
    OR left(p_href, 2) = '//'
    OR position(chr(92) IN p_href) > 0
  ) THEN
    RAISE EXCEPTION 'Notification link must be a local application path';
  END IF;

  SELECT b.bride_id, b.mua_id
    INTO v_bride_id, v_mua_id
  FROM public.bookings AS b
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF p_user_id NOT IN (v_bride_id, v_mua_id) THEN
    RAISE EXCEPTION 'Notification recipient is not a participant in this booking';
  END IF;

  INSERT INTO public.notifications (
    user_id, actor_id, booking_id, type, title, message, href
  )
  VALUES (
    p_user_id, v_actor_id, p_booking_id, p_type,
    btrim(p_title), btrim(p_message), p_href
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_admin_booking_notification(uuid, uuid, text, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_booking_notification(uuid, uuid, text, text, text, text)
  TO authenticated;
