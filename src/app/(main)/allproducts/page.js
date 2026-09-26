// app/(main)/allproducts/page.js

import AllProducts from "@/components/website/All Products/AllProducts";
import React, { Suspense } from "react";
import { productListJsonLd, toJsonLd } from "@/lib/jsonld";
import ShopHeading from "@/components/website/All Products/ShopHeading";
import MergedProductCard from "@/components/productCard/MargedProductCard";
import { getLatestProducts, safely } from "@/lib/storefront";

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
    locale: "en_BD",
    title: `Shop All Products | ${SITE_NAME}`,
    description:
      "Explore all products at D Chin Mart — new arrivals, best deals, and top categories with fast delivery across Bangladesh.",
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
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
    images: [`${SITE_URL}/og-default.png`],
  },
};

// ─── Data fetcher ─────────────────────────────────────────────────────────────
// Fetches a lightweight product list (name + slug + image + price) for JSON-LD.
// Used ONLY for structured data — AllProducts client component fetches its own data.

function getProductsForJsonLd() {
  return safely(getLatestProducts(50), []);
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
    inLanguage: "en-BD",
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

  // ── ItemList JSON-LD (summary format: each entry links to the product page)
  const itemListJsonLd = productListJsonLd({
    products,
    pageUrl: PAGE_URL,
    name: `All Products — ${SITE_NAME}`,
  });

  return (
    <>
      {/* Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />

      {/* CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(collectionJsonLd) }}
      />

      {/* ItemList — only when products loaded */}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
        />
      )}

      {/* AllProducts reads filters from the URL, so it needs a Suspense boundary. */}
      <Suspense fallback={<ShopFallback products={products} />}>
        <AllProducts />
      </Suspense>
    </>
  );
}
// Server-rendered first paint of the shop: the same heading plus the latest
// products as real links, so search engines see the catalogue without running
// JavaScript. The interactive AllProducts view replaces it once loaded.
function ShopFallback({ products }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <ShopHeading />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          {products.slice(0, 24).map((product) => (
            <li key={product.id}>
              <MergedProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
