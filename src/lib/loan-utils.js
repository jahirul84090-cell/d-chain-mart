/**
 * File: lib/loan-utils.js
 *
 * Shared utilities for the loan system.
 * Import from any loan API route — keeps business logic DRY and testable.
 */

// ─── EMI (Reducing Balance) ───────────────────────────────────────────────────

/**
 * Calculate monthly EMI using the standard reducing-balance formula.
 * @param {number} loanAmount    — principal (product price minus down payment)
 * @param {number} annualRatePct — annual interest rate as a percentage (e.g. 10 for 10%)
 * @param {number} tenureMonths  — number of monthly installments
 * @returns {number} monthly EMI amount (unrounded)
 */
export function calcEmi(loanAmount, annualRatePct, tenureMonths) {
  if (tenureMonths <= 0) throw new Error("tenureMonths must be > 0");
  const mr = annualRatePct / 100 / 12;
  if (mr === 0) return loanAmount / tenureMonths;
  return (
    (loanAmount * mr * Math.pow(1 + mr, tenureMonths)) /
    (Math.pow(1 + mr, tenureMonths) - 1)
  );
}

// ─── Admin Guard ──────────────────────────────────────────────────────────────

/**
 * Returns true if the resolved getCurrentUser() result has admin privileges.
 * @param {object|null} currentUser — result of await getCurrentUser()
 */
export function isAdminUser(currentUser) {
  return (
    currentUser !== null &&
    ["ADMIN", "SUPER_ADMIN"].includes(currentUser?.role)
  );
}

// ─── Down Payment Validator ───────────────────────────────────────────────────

/**
 * Validates down payment against product price and loan settings.
 * Returns null if valid, or an error string if invalid.
 *
 * Rules (production-grade):
 *  1. Must be a positive number
 *  2. Cannot exceed the product price (would leave negative loan amount)
 *  3. Cannot equal the product price (loan amount must be > 0)
 *  4. Must be >= minDownPaymentPct % of product price
 *  5. Must be <= maxDownPaymentPct % of product price (optional cap, default 95%)
 *
 * @param {number} downPayment      — submitted down payment
 * @param {number} productPrice     — product's actual price
 * @param {number} minDownPaymentPct — minimum % required (e.g. 30)
 * @param {number} [maxDownPaymentPct=95] — maximum % allowed
 * @returns {string|null} error message or null if valid
 */
export function validateDownPayment(
  downPayment,
  productPrice,
  minDownPaymentPct,
  maxDownPaymentPct = 95
) {
  const dp  = parseFloat(downPayment);
  const pp  = parseFloat(productPrice);
  const min = parseFloat(((pp * minDownPaymentPct) / 100).toFixed(2));
  const max = parseFloat(((pp * maxDownPaymentPct) / 100).toFixed(2));

  if (!dp || dp <= 0)
    return "Down payment must be a positive number.";

  if (dp >= pp)
    return `Down payment (৳${dp}) cannot be equal to or greater than the product price (৳${pp}). The loan amount must be positive.`;

  if (dp > max)
    return `Down payment (৳${dp}) exceeds the maximum allowed (${maxDownPaymentPct}% = ৳${max}). If you can pay more, please purchase directly without a loan.`;

  if (dp < min)
    return `Down payment (৳${dp}) is below the minimum required (${minDownPaymentPct}% = ৳${min}).`;

  return null; // valid
}

// ─── Add Calendar Months ──────────────────────────────────────────────────────

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Float helpers ────────────────────────────────────────────────────────────

export const f2 = (n) => parseFloat(parseFloat(n).toFixed(2));
export const isZero = (n) => Math.abs(parseFloat(n)) < 0.005;