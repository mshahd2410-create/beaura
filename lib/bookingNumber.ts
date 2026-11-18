/**
 * Stable numeric booking reference derived one-to-one from the booking UUID.
 * It exists from booking creation and does not change with booking status.
 */
export function getBookingNumber(id: string | null | undefined): string {
  if (!id) return "Unavailable";
  const hex = id.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return id.toUpperCase();

  const digits = [0];
  for (const char of hex) {
    let carry = Number.parseInt(char, 16);
    for (let i = 0; i < digits.length; i++) {
      const value = digits[i] * 16 + carry;
      digits[i] = value % 10;
      carry = Math.floor(value / 10);
    }
    while (carry > 0) {
      digits.push(carry % 10);
      carry = Math.floor(carry / 10);
    }
  }
  return digits.reverse().join("").padStart(39, "0");
}
