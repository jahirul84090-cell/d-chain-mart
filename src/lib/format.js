// Shared display formatting so money, dates and order numbers look the
// same on every page.

// ৳1,65,000 (Bangladeshi digit grouping). Returns "—" for missing values.
export function formatBDT(amount, { decimals = 0 } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// Short, readable order reference shown to customers and admins.
export function orderNumber(id) {
  return id ? `DCM-${String(id).replace(/-/g, "").slice(0, 8).toUpperCase()}` : "—";
}

export function formatDate(value, { withTime = false } = {}) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export const ORDER_STATUS_LABEL = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// One-line address for summaries.
export function formatAddress(a) {
  if (!a) return "—";
  return [a.street, a.city, a.state, a.zipCode, a.country]
    .map((v) => (v == null ? "" : String(v).trim()))
    .filter((v) => v && v !== "null" && v !== "undefined")
    .join(", ");
}
