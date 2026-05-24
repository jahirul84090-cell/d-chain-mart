// app/(main)/allproducts/page.js

import AllProducts from "@/components/website/All Products/AllProducts";
import React from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const SITE_NAME = process.env.SITE_NAME || "D Chin Mart";

const getSiteUrl = () => {
  const raw =
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  return raw && /^https?:\/\//i.test(raw)
    ? raw.replace(/\/+$/, "")
    : "https://dchinmart.com";
};

const SITE_URL = getSiteUrl();
const CANONICAL_PATH = "/allproducts";
const PAGE_URL = `${SITE_URL}${CANONICAL_PATH}`;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: "Shop All Products",
  description:
    "Browse all products at D Chin Mart. Discover new arrivals, best deals, and trending items with fast delivery across Bangladesh.",

  keywords: [
    "all products",
    "shop online Bangladesh",
    "D Chin Mart",
    "ecommerce Bangladesh",
    "best deals Bangladesh",
    "new arrivals",
    "online shopping BD",
    "buy online Bangladesh",
  ],

  alternates: {
    canonical: CANONICAL_PATH,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: "bn_BD",
    title: `Shop All Products | ${SITE_NAME}`,
    description:
      "Explore all products at D Chin Mart — new arrivals, best deals, and top categories with fast delivery across Bangladesh.",
    images: [
      {
        url: `${SITE_URL}/og-allproducts.png`,
        width: 1200,
        height: 630,
        alt: `Shop All Products — ${SITE_NAME}`,
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `Shop All Products | ${SITE_NAME}`,
    description:
      "Explore all products at D Chin Mart — new arrivals, best deals, and fast delivery in Bangladesh.",
    images: [`${SITE_URL}/og-allproducts.png`],
  },
};

// ─── Data fetcher ─────────────────────────────────────────────────────────────
// Fetches a lightweight product list (name + slug + image + price) for JSON-LD.
// Used ONLY for structured data — AllProducts client component fetches its own data.

async function getProductsForJsonLd() {
  try {
    const res = await fetch(`${SITE_URL}/api/admin/product?limit=50&fields=name,slug,price,mainImage,images,category`,{
    cache: "no-store",
  });
    if (!res.ok) return [];
    const data = await res.json();
    // Support both { products: [] } and flat []
    return Array.isArray(data) ? data : (data?.products ?? []);
  } catch (err) {
    console.error("[allproducts/page] JSON-LD fetch failed:", err.message);
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AllProductsPage() {
  const products = await getProductsForJsonLd();


  // ── Breadcrumb JSON-LD ──────────────────────────────────────────────────────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "All Products", item: PAGE_URL },
    ],
  };

  // ── CollectionPage JSON-LD ──────────────────────────────────────────────────
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": PAGE_URL,
    name: `Shop All Products — ${SITE_NAME}`,
    description:
      "Browse all products at D Chin Mart. Discover new arrivals, best deals, and trending items with fast delivery across Bangladesh.",
    url: PAGE_URL,
    inLanguage: ["bn", "en"],
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
    // offerCatalog tells Google this page contains shoppable products
    ...(products.length > 0 && {
      mainEntity: {
        "@type": "OfferCatalog",
        name: "All Products",
        numberOfItems: products.length,
      },
    }),
  };

  // ── ItemList JSON-LD ────────────────────────────────────────────────────────
  // This is what powers Google's product carousel in search results.
  // Only emit if we have real product data.
  const itemListJsonLd =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `All Products — ${SITE_NAME}`,
          url: PAGE_URL,
          numberOfItems: products.length,
          itemListElement: products.slice(0, 50).map((product, index) => {
            const productUrl = `${SITE_URL}/product/${product.slug}`;
            const imageUrl =
              product.images?.[0]?.url || product.mainImage || null;

            return {
              "@type": "ListItem",
              position: index + 1,
              url: productUrl,
              name: product.name,
              item: {
                "@type": "Product",
                name: product.name,
                url: productUrl,
                ...(imageUrl && { image: imageUrl }),
                ...(product.category?.name && {
                  category: product.category.name,
                }),
                offers: {
                  "@type": "Offer",
                  priceCurrency: "BDT",
                  price: String(product.price ?? ""),
                  availability:
                    (product.stockAmount ?? 1) > 0
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                  seller: {
                    "@type": "Organization",
                    name: SITE_NAME,
                  },
                },
              },
            };
          }),
        }
      : null;

  return (
    <>
      {/* Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* ItemList — only when products loaded */}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <AllProducts />
    </>
  );
}