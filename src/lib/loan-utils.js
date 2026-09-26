/**
 * File: lib/loan-utils.js
 *
 * Shared business logic for the entire loan system.
 * Imported by all loan API routes — single source of truth.
 */

// ─── EMI Calculator: Flat Interest On Full Product Price ──────────────────────

/**
 * Your business rule:
 * Interest is calculated on the FULL product price.
 * Down payment only reduces remaining payable, not interest.
 *
 * Example:
 * Product price = 4000
 * Interest = 10% = 400
 * Total payable = 4400
 * Down payment = 2000
 * Remaining = 2400
 * 3-month EMI = 800
 */
export function calcFlatProductPriceEmi(
  productPrice,
  downPayment,
  interestRatePct,
  tenureMonths
) {
  const price = Number(productPrice);
  const dp = Number(downPayment);
  const rate = Number(interestRatePct);
  const months = Number(tenureMonths);

  if (!price || price <= 0) throw new Error("productPrice must be > 0");
  if (dp < 0) throw new Error("downPayment cannot be negative");
  if (dp >= price) throw new Error("downPayment must be less than productPrice");
  if (!months || months <= 0) throw new Error("tenureMonths must be > 0");

  const interestAmount = price * (rate / 100);
  const totalPayable = price + interestAmount;
  const remainingPayable = totalPayable - dp;
  const monthlyEmi = remainingPayable / months;

  return {
    interestAmount: f2(interestAmount),
    totalPayable: f2(totalPayable),
    remainingPayable: f2(remainingPayable),
    monthlyEmi: f2(monthlyEmi),
  };
}

// ─── Old EMI Calculator: Reducing Balance ─────────────────────────────────────
// Keep this if any old admin/report route still imports calcEmi.

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
export function validateDownPayment(downPayment, productPrice, minPct = 0) {
  const dp = Number(downPayment);
  const pp = Number(productPrice);

  if (!pp || pp <= 0) {
    return "Invalid product price.";
  }

  if (!dp || dp <= 0) {
    return "Down payment must be a positive number.";
  }

  const minimum = Math.max(1, Math.ceil((pp * Number(minPct || 0)) / 100));
  if (dp < minimum) {
    return `Minimum down payment is ${minPct}% of the price (৳${minimum.toLocaleString("en-BD")}).`;
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