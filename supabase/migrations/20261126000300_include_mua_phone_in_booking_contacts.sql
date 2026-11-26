-- Include the MUA phone number in booking notification contacts.
-- This migration was applied manually in Supabase and is being recorded here
-- so the database change is tracked and reproducible.

DROP FUNCTION IF EXISTS public.get_booking_notification_contacts(uuid);

CREATE FUNCTION public.get_booking_notification_contacts(p_booking_id uuid)
RETURNS TABLE (
  bride_first_name text,
  bride_last_name text,
  bride_email text,
  bride_phone text,
  mua_first_name text,
  mua_last_name text,
  mua_email text,
  mua_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = p_booking_id
        AND (
          b.bride_id = auth.uid()
          OR b.mua_id = auth.uid()
        )
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    bride.first_name::text,
    bride.last_name::text,
    bride.email::text,
    bride.phone::text,
    mua.first_name::text,
    mua.last_name::text,
    mua.email::text,
    mp.phone::text
  FROM public.bookings b
  LEFT JOIN public.profiles bride ON bride.id = b.bride_id
  LEFT JOIN public.profiles mua ON mua.id = b.mua_id
  LEFT JOIN public.mua_private mp ON mp.user_id = b.mua_id
  WHERE b.id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_booking_notification_contacts(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_booking_notification_contacts(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_booking_notification_contacts(uuid) TO authenticated;
