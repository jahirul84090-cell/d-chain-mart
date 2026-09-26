// app/(main)/[slug]/page.js — product detail page, served at /{slug}

import { notFound } from "next/navigation";
import SingleProductDetail from "@/components/website/single product/SingleProduct";
import RelatedProducts from "@/components/others/RelatedProducts";
import { toJsonLd } from "@/lib/jsonld";

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

async function getProductDetails(slug) {
  const baseUrl = getSiteUrl();
  try {
    const res = await fetch(
      `${baseUrl}/api/admin/product/slug/${encodeURIComponent(slug)}`,
      {
        // ISR: revalidate every hour. Remove if product data changes very frequently.
        // Use cache: "no-store" only for cart/order pages, not product pages.
        next: { revalidate: 3600, tags: ["products"] },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.product ?? null;
  } catch (err) {
    console.error("[product/slug] fetch error:", err);
    return null;
  }
}

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
  if (!product) notFound();

  // ── Core fields ──────────────────────────────────────────────────────────
  const title = product.name || "Product";

  const rawDesc =
    cleanText(product.shortdescription) ||
    `Buy ${title} online at the best price in Bangladesh.`;
  const description = truncate(rawDesc, 155);

  const images = (
    product.images?.length ? product.images : [{ url: product.mainImage }]
  )
    .map((img) => img?.url)
    .filter(Boolean);

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

  const isIndexable = product.isActive !== false;

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
    openGraph: {
      type: "website",
      url: canonical.toString(),
      siteName: SITE_NAME,
      locale: "en_BD",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: images.slice(0, 4).map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: title,
      })),
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
  if (!product) notFound();

  const baseUrl = getSiteUrl();
  const productUrl = `${baseUrl}/${encodeURIComponent(product.slug)}`;

  const images = (
    product.images?.length ? product.images : [{ url: product.mainImage }]
  )
    .map((i) => i?.url)
    .filter(Boolean);

  const inStock = (product.stockAmount ?? 0) > 0;

  // Price valid for 30 days from build/render time
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // ── Product JSON-LD ───────────────────────────────────────────────────────
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    name: product.name,
    description: truncate(cleanText(product.shortdescription), 300) || product.name,
    category: product.category?.name || undefined,
    image: images,
    sku: String(product.id || product._id || ""),
    url: productUrl,

    // Brand — use actual brand field if present, else site name
    ...(product.brand || SITE_NAME
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand || SITE_NAME,
          },
        }
      : {}),

    offers: {
      "@type": "Offer",
      "@id": `${productUrl}#offer`,
      url: productUrl,
      priceCurrency: "BDT",
      price: String(product.price),
      priceValidUntil,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: baseUrl,
      },
    },

    // Aggregate rating — only include if data is valid
    ...(product.averageRating && product.reviews?.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(
              Math.min(5, Math.max(1, Number(product.averageRating)))
            ),
            reviewCount: String(product.reviews.length),
            bestRating: "5",
            worstRating: "1",
          },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <SingleProductDetail productData={product} />
      <RelatedProducts productId={product?.id} />
    </>
  );
}