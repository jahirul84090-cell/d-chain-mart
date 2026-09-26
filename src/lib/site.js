// Single source of truth for site identity used by SEO files.
export const SITE_NAME = process.env.SITE_NAME || "D Chin Mart";

export const SITE_URL = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");

// Customer support contact (shown on product pages and the contact page).
export const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+8801923363194";
export const SUPPORT_WHATSAPP = SUPPORT_PHONE.replace(/[^\d]/g, "");
