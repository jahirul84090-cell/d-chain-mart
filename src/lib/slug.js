// URL slugs for products. Products live at /{slug}, so a slug must never
// clash with a site page such as /cart or /about.

export const RESERVED_SLUGS = new Set([
  "about", "allproducts", "api", "auth", "cart", "category", "checkout",
  "contact", "dashboard", "details", "loans", "orders", "payment", "profile",
  "wishlist", "search", "login", "signup", "admin", "sitemap.xml",
  "robots.txt", "manifest.webmanifest", "_next", "favicon.ico",
]);

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9ঀ-৿]+/g, "-") // keep Latin, digits and Bangla
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);
}

// Returns an error message, or null when the slug is usable.
export function slugError(slug) {
  if (!slug) return "Slug is required.";
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is reserved for a site page. Choose another slug.`;
  if (slug !== slugify(slug)) return "Slug may only contain lowercase letters, numbers and hyphens.";
  return null;
}
