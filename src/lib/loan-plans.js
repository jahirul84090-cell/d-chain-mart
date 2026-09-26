// Single source of truth for EMI plans and loan settings defaults,
// shared by the application page, the loan APIs and the loan lists.

// Flat interest (% of the product price) charged for each plan length.
export const LOAN_PLAN_RATES = { 3: 10, 6: 20 };
export const LOAN_TENURES = Object.keys(LOAN_PLAN_RATES).map(Number);

// Used when no active LoanSetting row exists.
export const DEFAULT_LOAN_SETTINGS = {
  minDownPaymentPct: 0,
  defaultInterest: LOAN_PLAN_RATES[3],
  defaultTenure: 3,
  firstEmiDelayDays: 30,
  gracePeriodDays: 3,
  lateFee: 100,
  isActive: true,
};

export async function getActiveLoanSettings(prisma) {
  const setting = await prisma.loanSetting.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return { ...DEFAULT_LOAN_SETTINGS, ...(setting || {}) };
}

// Smallest down payment allowed for a price (at least ৳1).
export function minimumDownPayment(price, minPct) {
  return Math.max(1, Math.ceil((Number(price) * Number(minPct || 0)) / 100));
}

export const planLabel = (months, rate) =>
  `${months}-month plan · ${rate}% flat`;

// Loan statuses where money has actually been lent.
export const DISBURSED_STATUSES = ["APPROVED", "DOWN_PAYMENT_PENDING", "ACTIVE", "COMPLETED"];
