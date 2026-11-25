-- Beaura notification security hardening
-- Browser clients may only create notifications for a booking they participate in.
-- The actor is always derived from auth.uid(); callers cannot spoof it.

DROP POLICY IF EXISTS "Authenticated users can create notifications"
  ON public.notifications;

-- Remove any column-level grants as well as broad table-level grants.
DO $
DECLARE
  v_column record;
BEGIN
  FOR v_column IN
    SELECT attname
    FROM pg_attribute
    WHERE attrelid = 'public.notifications'::regclass
      AND attnum > 0
      AND NOT attisdropped
  LOOP
    EXECUTE format(
      'REVOKE ALL (%I) ON TABLE public.notifications FROM anon, authenticated',
      v_column.attname
    );
    EXECUTE format(
      'REVOKE ALL (%I) ON TABLE public.notifications FROM PUBLIC',
      v_column.attname
    );
  END LOOP;
END
$;

REVOKE ALL PRIVILEGES
ON TABLE public.notifications
FROM PUBLIC, anon, authenticated;

-- Users can read and delete their own notifications, and may update only
-- the is_read flag. RLS policies continue to enforce row ownership.
GRANT SELECT, DELETE
ON TABLE public.notifications
TO authenticated;

GRANT UPDATE (is_read)
ON TABLE public.notifications
TO authenticated;

CREATE OR REPLACE FUNCTION public.create_booking_notification(
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

  IF p_user_id IS NULL OR p_booking_id IS NULL THEN
    RAISE EXCEPTION 'A recipient and booking are required';
  END IF;

  IF p_type IS NULL OR p_type NOT IN (
    'booking_created',
    'travel_fee_quote',
    'travel_fee_accepted',
    'travel_fee_declined',
    'completion_pending',
    'dispute_opened',
    'booking_cancelled',
    'admin_update'
  ) THEN
    RAISE EXCEPTION 'Notification type is not allowed';
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

  IF v_actor_id NOT IN (v_bride_id, v_mua_id) THEN
    RAISE EXCEPTION 'You are not a participant in this booking';
  END IF;

  IF p_user_id NOT IN (v_bride_id, v_mua_id) THEN
    RAISE EXCEPTION 'Notification recipient is not a participant in this booking';
  END IF;

  IF p_type = 'booking_created'
     AND NOT (v_actor_id = v_bride_id AND p_user_id = v_mua_id) THEN
    RAISE EXCEPTION 'Only the bride can notify the artist about a new booking';
  ELSIF p_type = 'travel_fee_quote'
     AND NOT (v_actor_id = v_mua_id AND p_user_id = v_bride_id) THEN
    RAISE EXCEPTION 'Only the artist can send a travel quote notification to the bride';
  ELSIF p_type IN ('travel_fee_accepted', 'travel_fee_declined', 'completion_pending', 'dispute_opened')
     AND NOT (v_actor_id = v_bride_id AND p_user_id = v_mua_id) THEN
    RAISE EXCEPTION 'This notification must be sent by the bride to the artist';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    actor_id,
    booking_id,
    type,
    title,
    message,
    href
  )
  VALUES (
    p_user_id,
    v_actor_id,
    p_booking_id,
    p_type,
    btrim(p_title),
    btrim(p_message),
    p_href
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_notification(uuid, uuid, text, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking_notification(uuid, uuid, text, text, text, text)
  TO authenticated;
