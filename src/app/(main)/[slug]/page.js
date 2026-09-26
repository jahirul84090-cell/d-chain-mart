// app/(main)/[slug]/page.js — product detail page, served at /{slug}

import { notFound } from "next/navigation";
import SingleProductDetail from "@/components/website/single product/SingleProduct";
import RelatedProducts from "@/components/others/RelatedProducts";
import { absoluteUrl, toJsonLd } from "@/lib/jsonld";
import { cache } from "react";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getDeliveryFees,
  getProductBySlug,
  getRelatedProducts,
  safely,
} from "@/lib/storefront";
import { resolveDeliveryFee } from "@/lib/delivery-fee";

// ─── Constants ──────────────────────────────────────────────────────────────

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

// Strip HTML tags and collapse whitespace
const cleanText = (text = "") =>
  String(text)
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();

// Truncate to maxLen chars at word boundary
const truncate = (text, maxLen = 155) => {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s\S*$/, "") + "…";
};

// ─── Data Fetcher ────────────────────────────────────────────────────────────

// Reads the database directly through a cached query (no HTTP round trip
// to our own API). React's cache() shares one result between
// generateMetadata and the page within a request.
const getProductDetails = cache(async (slug) => {
  try {
    return await getProductBySlug(slug);
  } catch (err) {
    console.error("[product/slug] load error:", err);
    return null;
  }
});

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  // Next.js 15: params is a Promise
  const { slug } = await params;
  const baseUrl = getSiteUrl();
  const metadataBase = new URL(baseUrl);
  const canonical = new URL(`/${encodeURIComponent(slug)}`, baseUrl);

  const product = await getProductDetails(slug);

  // ── Not found ────────────────────────────────────────────────────────────
  // Calling notFound() here (not only in the page) makes the response a real
  // HTTP 404 instead of a "soft 404" page with status 200.
  // Hidden (inactive) products are not for sale: return a real 404.
  if (!product || product.isActive === false) notFound();

  // ── Core fields ──────────────────────────────────────────────────────────
  // "<Name> Price in Bangladesh" matches how shoppers in BD search.
  const title = `${product.name} Price in Bangladesh`;

  const rawDesc =
    cleanText(product.shortdescription) ||
    `Buy ${title} online at the best price in Bangladesh.`;
  const description = truncate(rawDesc, 155);

  const images = [
    ...new Set([product.mainImage, ...(product.images || []).map((i) => i?.url)].filter(Boolean)),
  ];

  const primaryImage = images[0] || `${baseUrl}/og-default.png`;

  // Dynamic keywords: product name + category + brand (no hardcoded values)
  const keywords = [
    ...new Set(
      [
        product.name,
        product.category?.name,
        product.brand,
        "online shopping Bangladesh",
        "buy online BD",
      ].filter(Boolean)
    ),
  ];

  const isIndexable = true;
  const inStock = (product.stockAmount ?? 0) > 0;

  return {
    metadataBase,

    // ── Title ──────────────────────────────────────────────────────────────
    // Correct form: plain string. The layout's title.template handles " | D Chin Mart"
    title,
    description,
    keywords,

    alternates: {
      canonical: canonical.toString(),
    },

    robots: {
      index: isIndexable,
      follow: true,
      googleBot: {
        index: isIndexable,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    // ── Open Graph ─────────────────────────────────────────────────────────
    // og:type "product" is rendered by the page together with the price tags.
    openGraph: {
      url: canonical.toString(),
      siteName: SITE_NAME,
      locale: "en_BD",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: images.slice(0, 4).map((url) => ({ url, alt: product.name })),
    },


    // ── Twitter ────────────────────────────────────────────────────────────
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [primaryImage],
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProductPage({ params }) {
  // Next.js 15: params is a Promise
  const { slug } = await params;

  const product = await getProductDetails(slug);
  if (!product || product.isActive === false) notFound();

  // Count the view after the response is sent (never slows the page down).
  after(() =>
    prisma.product
      .update({ where: { id: product.id }, data: { views: { increment: 1 } } })
      .catch(() => {})
  );

  const baseUrl = getSiteUrl();
  const productUrl = `${baseUrl}/${encodeURIComponent(product.slug)}`;

  const images = [
    ...new Set([product.mainImage, ...(product.images || []).map((i) => i?.url)].filter(Boolean)),
  ];

  const inStock = (product.stockAmount ?? 0) > 0;

  // Price valid for 30 days from render time
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [relatedProducts, deliveryFees] = await Promise.all([
    safely(getRelatedProducts(product.id), []),
    safely(getDeliveryFees(), []),
  ]);

  // Country-wide Bangladesh fee (or the site default) for shipping details.
  const shippingFee = resolveDeliveryFee(deliveryFees, {
    country: "Bangladesh",
    city: "",
  });

  const approvedReviews = (product.reviews || []).filter(
    (r) => r && Number(r.rating) >= 1
  );

  // ── Product JSON-LD ───────────────────────────────────────────────────────
  // Follows Google's Product / merchant listing guidelines.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description:
      truncate(cleanText(product.shortdescription || product.description), 5000) ||
      product.name,
    category: product.category?.name || undefined,
    image: images.map(absoluteUrl),
    sku: String(product.id),
    productID: String(product.id),
    url: productUrl,
    // No brand: products don't record their manufacturer, and naming the
    // store as the brand would be misleading.
    ...(product.availableColors ? { color: product.availableColors } : {}),
    ...(product.availableSizes ? { size: product.availableSizes } : {}),

    offers: {
      "@type": "Offer",
      "@id": `${productUrl}#offer`,
      url: productUrl,
      priceCurrency: "BDT",
      price: Number(product.price),
      priceValidUntil,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME, url: baseUrl },
      // Show the original price when the product is on sale.
      ...(product.oldPrice > product.price
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceType: "https://schema.org/StrikethroughPrice",
              price: Number(product.oldPrice),
              priceCurrency: "BDT",
            },
          }
        : {}),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: shippingFee,
          currency: "BDT",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BD",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BD",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },

    // Rating and reviews only when real, approved reviews exist.
    ...(approvedReviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(
              Math.min(5, Math.max(1, Number(product.averageRating) || 0)).toFixed(1)
            ),
            reviewCount: approvedReviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: approvedReviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: Number(r.rating),
              bestRating: 5,
              worstRating: 1,
            },
            author: { "@type": "Person", name: r.user?.name || "Verified buyer" },
            ...(r.createdAt ? { datePublished: String(r.createdAt).slice(0, 10) } : {}),
            ...(r.content ? { reviewBody: truncate(cleanText(r.content), 500) } : {}),
          })),
        }
      : {}),
  };

  // ── Breadcrumb JSON-LD ────────────────────────────────────────────────────
  // Use category slug (not name) to build the URL — avoids encoding issues
  const categorySlug = product.category?.slug;
  const categoryName = product.category?.name;
  const categoryUrl =
    categorySlug
      ? `${baseUrl}/category/${categorySlug}`
      : categoryName
      ? `${baseUrl}/category/${categoryName.toLowerCase().replace(/\s+/g, "-")}`
      : null;

  const breadcrumbItems = [
    { position: 1, name: "Home", item: baseUrl },
    categoryUrl
      ? { position: 2, name: categoryName, item: categoryUrl }
      : null,
    {
      position: categoryUrl ? 3 : 2,
      name: product.name,
      item: productUrl,
    },
  ].filter(Boolean);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((crumb) => ({
      "@type": "ListItem",
      position: crumb.position,
      name: crumb.name,
      item: crumb.item,
    })),
  };

  return (
    <>
      {/* Open Graph product tags (Facebook, WhatsApp, Pinterest). They need
          the `property` attribute, so they are rendered here; React places
          them in <head>. */}
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={String(product.price)} />
      <meta property="product:price:currency" content="BDT" />
      <meta property="product:availability" content={inStock ? "in stock" : "out of stock"} />
      <meta property="product:condition" content="new" />
      <meta property="product:retailer_item_id" content={String(product.id)} />
      {product.category?.name && (
        <meta property="product:category" content={product.category.name} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <SingleProductDetail productData={product} />
      <RelatedProducts productId={product.id} initialProducts={relatedProducts} />
    </>
  );
}