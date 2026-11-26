-- Public, date-level artist availability for bride discovery.
-- An artist is listed only when they have no active booking or calendar event
-- anywhere on the selected Egypt-local calendar day.

CREATE OR REPLACE FUNCTION public.get_available_muas_for_date(p_date date)
RETURNS TABLE (mua_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.mua_profiles p
  WHERE p.verified = true
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.mua_id = p.id
        AND b.booking_date = p_date
        AND b.status IN ('pending', 'confirmed', 'paid', 'accepted')
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.mua_calendar_events e
      WHERE e.mua_id = p.id
        AND e.start_time < ((p_date + 1)::timestamp AT TIME ZONE 'Africa/Cairo')
        AND e.end_time > (p_date::timestamp AT TIME ZONE 'Africa/Cairo')
    );
$$;

REVOKE ALL ON FUNCTION public.get_available_muas_for_date(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_muas_for_date(date) TO anon, authenticated;
