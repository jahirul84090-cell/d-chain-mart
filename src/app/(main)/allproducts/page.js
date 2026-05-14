// app/(main)/allproducts/page.js

import AllProducts from "@/components/website/All Products/AllProducts";
import React from "react";

const siteName = process.env.SITE_NAME || "BD Store";
const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://example.com"
).replace(/\/+$/, "");

// ✅ Your real path
const canonicalPath = "/allproducts";

// ✅ Put this image in: /public/og-allproducts.png (1200x630)
const ogImage = `${siteUrl}/og-allproducts.png`;

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: "Shop All Products",
  description:
    "Browse all products at BD Store. Discover new arrivals, best deals, and trending items with fast delivery across Bangladesh.",

  keywords: [
    "all products",
    "shop online",
    "BD Store",
    "ecommerce Bangladesh",
    "best deals",
    "new arrivals",
    "online shopping Bangladesh",
  ],

  alternates: {
    canonical: canonicalPath,
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
    url: `${siteUrl}${canonicalPath}`,
    siteName,
    title: "Shop All Products | BD Store",
    description:
      "Explore all products at BD Store—new arrivals, best deals, and top categories with fast delivery in Bangladesh.",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Shop All Products - BD Store",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Shop All Products | BD Store",
    description:
      "Explore all products at BD Store—new arrivals, best deals, and top categories with fast delivery in Bangladesh.",
    images: [ogImage],
  },
};

const Page = () => {
  // ✅ CollectionPage JSON-LD for list page
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shop All Products",
    description:
      "Browse all products at BD Store. Discover new arrivals, best deals, and trending items.",
    url: `${siteUrl}${canonicalPath}`,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
  };

  // ✅ Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "All Products",
        item: `${siteUrl}${canonicalPath}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <AllProducts />
    </>
  );
};

export default Page;
