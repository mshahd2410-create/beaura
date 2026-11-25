/**
 * Returns the persistent, human-readable booking reference stored on the booking.
 */
export function getBookingNumber(reference: string | null | undefined): string {
  return reference || "Unavailable";
}
