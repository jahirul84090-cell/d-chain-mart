// Single source of truth for site identity used by SEO files.
export const SITE_NAME = process.env.SITE_NAME || "D Chin Mart";

export const SITE_URL = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");
