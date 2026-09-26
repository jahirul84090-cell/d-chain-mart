// Shared by checkout (to show the fee) and the order API (to charge it),
// so the customer is always charged exactly what they were shown.

export const DEFAULT_DELIVERY_FEE = 150;

const norm = (v) => String(v ?? "").trim().toLowerCase();

/**
 * Picks the delivery fee for an address. A fee for the exact city wins over
 * a country-wide fee (city empty); otherwise DEFAULT_DELIVERY_FEE applies.
 */
export function resolveDeliveryFee(fees = [], address) {
  if (!address) return DEFAULT_DELIVERY_FEE;
  const sameCountry = fees.filter((f) => norm(f.country) === norm(address.country));
  const cityFee = sameCountry.find((f) => f.city && norm(f.city) === norm(address.city));
  const countryFee = sameCountry.find((f) => !f.city);
  const match = cityFee || countryFee;
  return match ? Number(match.amount) : DEFAULT_DELIVERY_FEE;
}
