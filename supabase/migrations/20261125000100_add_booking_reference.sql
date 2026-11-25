-- Beaura human-readable booking references.
-- Run once in the Supabase SQL Editor before deploying the matching app code.

CREATE SEQUENCE IF NOT EXISTS public.booking_reference_seq
  START WITH 100001
  INCREMENT BY 1;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_reference text;

-- Assign references to all existing bookings. Each value is short and unique.
UPDATE public.bookings
SET booking_reference = 'BK-' || nextval('public.booking_reference_seq')::text
WHERE booking_reference IS NULL;

-- Automatically assign the next reference to every new booking.
ALTER TABLE public.bookings
  ALTER COLUMN booking_reference
  SET DEFAULT ('BK-' || nextval('public.booking_reference_seq')::text);

ALTER TABLE public.bookings
  ALTER COLUMN booking_reference SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_reference_uidx
  ON public.bookings (booking_reference);
