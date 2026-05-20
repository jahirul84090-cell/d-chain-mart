/**
 * File: lib/loan-utils.js
 *
 * Shared business logic for the entire loan system.
 * Imported by all loan API routes — single source of truth.
 */

// ─── EMI Calculator (Reducing Balance) ───────────────────────────────────────

export function calcEmi(loanAmount, annualRatePct, tenureMonths) {
  const principal = Number(loanAmount);
  const rate = Number(annualRatePct);
  const months = Number(tenureMonths);

  if (!principal || principal <= 0) throw new Error("loanAmount must be > 0");
  if (!months || months <= 0) throw new Error("tenureMonths must be > 0");

  const mr = rate / 100 / 12;

  if (mr === 0) return principal / months;

  return (
    (principal * mr * Math.pow(1 + mr, months)) /
    (Math.pow(1 + mr, months) - 1)
  );
}

// ─── Admin Guard ──────────────────────────────────────────────────────────────

export function isAdminUser(currentUser) {
  return (
    currentUser !== null &&
    ["ADMIN", "SUPER_ADMIN"].includes(currentUser?.role)
  );
}

// ─── Down Payment Validation ──────────────────────────────────────────────────

/**
 * Rules:
 *  1. Must be positive
 *  2. Cannot be >= product price
 *  3. No minimum percentage required
 */
export function validateDownPayment(downPayment, productPrice) {
  const dp = Number(downPayment);
  const pp = Number(productPrice);

  if (!pp || pp <= 0) {
    return "Invalid product price.";
  }

  if (!dp || dp <= 0) {
    return "Down payment must be a positive number.";
  }

  if (dp >= pp) {
    return `Down payment (৳${dp}) cannot equal or exceed the product price (৳${pp}).`;
  }

  return null;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Number(months));
  return d;
}

// ─── Float Helpers ────────────────────────────────────────────────────────────

export const f2 = (n) => Number(Number(n || 0).toFixed(2));

export const isZero = (n) => Math.abs(Number(n || 0)) < 0.005;