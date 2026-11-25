-- Beaura: restrict direct browser access to bookings.
-- Keep authenticated SELECT for existing bride/MUA/admin RLS policies.
-- Allow direct UPDATE of status only; the admin RLS policy remains the row-level gate.
-- Bride and MUA booking actions must continue through the existing RPC functions.

BEGIN;

-- Remove any column-level UPDATE grants first; table-level REVOKE does not
-- necessarily remove separately granted column privileges.
DO $$
DECLARE
  v_column record;
  v_grantee text;
BEGIN
  FOR v_column IN
    SELECT attname
    FROM pg_attribute
    WHERE attrelid = 'public.bookings'::regclass
      AND attnum > 0
      AND NOT attisdropped
  LOOP
    FOREACH v_grantee IN ARRAY ARRAY['anon', 'authenticated', 'PUBLIC']
    LOOP
      IF v_grantee = 'PUBLIC' THEN
        EXECUTE format(
          'REVOKE UPDATE (%I) ON TABLE public.bookings FROM PUBLIC',
          v_column.attname
        );
      ELSE
        EXECUTE format(
          'REVOKE UPDATE (%I) ON TABLE public.bookings FROM %I',
          v_column.attname,
          v_grantee
        );
      END IF;
    END LOOP;
  END LOOP;
END
$$;

-- Remove broad table-level browser privileges, including DELETE/TRUNCATE.
REVOKE ALL PRIVILEGES
ON TABLE public.bookings
FROM anon, authenticated, PUBLIC;

-- Preserve authenticated reads; RLS determines which rows each user can see.
GRANT SELECT
ON TABLE public.bookings
TO authenticated;

-- The only direct browser update allowed is status. The existing
-- "Admins can update bookings" policy restricts this to admin members.
GRANT UPDATE (status)
ON TABLE public.bookings
TO authenticated;

-- Artists must use the booking RPC functions instead of direct row updates.
DROP POLICY IF EXISTS "MUA can update booking status"
ON public.bookings;

COMMIT;
