import { SITE_URL } from "./site";

// Serialize structured data for a <script type="application/ld+json"> tag.
// Escaping "<" stops product names or descriptions from closing the script tag.
export function toJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Structured data needs absolute URLs; product images may be stored relative.
export function absoluteUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const productUrl = (slug) => `${SITE_URL}/${slug}`;

// Google's "summary page" ItemList format for category/listing pages: each
// entry points at the product's own page, which carries the full Product data.
export function productListJsonLd({ products, pageUrl, name, offset = 0 }) {
  if (!products?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#itemlist`,
    name,
    url: pageUrl,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: offset + index + 1,
      url: productUrl(product.slug),
      name: product.name,
    })),
  };
}
