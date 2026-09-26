// Serialize structured data for a <script type="application/ld+json"> tag.
// Escaping "<" stops product names or descriptions from closing the script tag.
export function toJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
