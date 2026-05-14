import { notFound } from "next/navigation";
import SingleProductDetail from "@/components/website/single product/SingleProduct";
import RelatedProducts from "@/components/others/RelatedProducts";

export const dynamic = "force-dynamic";

// ✅ Safe base url resolver (prevents "Invalid URL" / undefined issues)
const getSiteUrl = () => {
  const raw =
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  // Must be absolute for new URL()
  if (raw && /^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");

  // Fallback (won’t crash builds)
  return "https://example.com";
};

const cleanText = (text = "") =>
  String(text)
    .replace(/<[^>]*>?/gm, "")
    .trim();

const getProductDetails = async (slug) => {
  const baseUrl = getSiteUrl();
  const apiUrl = `${baseUrl}/api/admin/product/slug/${encodeURIComponent(
    slug
  )}`;

  try {
    const res = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.product || null;
  } catch (error) {
    console.log("getProductDetails error:", error);
    return null;
  }
};

export async function generateMetadata({ params }) {
  const { slug } = params;

  const product = await getProductDetails(slug);

  const siteName = process.env.SITE_NAME || "My Shop";
  const baseUrl = getSiteUrl();

  const metadataBase = new URL(baseUrl);
  const canonical = new URL(`/product/${slug}`, baseUrl);

  if (!product) {
    return {
      metadataBase,
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
      robots: { index: false, follow: false },
      alternates: { canonical },

      // ✅ must be valid OG type
      openGraph: {
        type: "website",
        url: canonical.toString(),
        siteName,
        title: "Product Not Found",
        description: "The product you are looking for does not exist.",
      },
    };
  }

  const title = product?.name || "Product";
  const description =
    cleanText(product?.shortdescription) || `Buy ${title} online.`;

  const images = (
    product?.images?.length ? product.images : [{ url: product?.mainImage }]
  )
    .map((img) => img?.url)
    .filter(Boolean);

  const keywords = Array.from(
    new Set(
      [
        product?.name,
        product?.category?.name,
        "t-shirt",
        "men t-shirt",
        "online shopping",
        "ecommerce",
        "Bangladesh",
      ].filter(Boolean)
    )
  );

  const isIndexable = product?.isActive !== false;

  return {
    metadataBase,
    title: { default: title, template: `%s | ${siteName}` },
    description,
    keywords,
    alternates: { canonical },

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

    // ✅ FIX: Next.js metadata does NOT accept type: "product"
    openGraph: {
      type: "website", // ✅ allowed type
      url: canonical.toString(),
      siteName,
      title,
      description,
      images: (images.length ? images : [`${baseUrl}/og-default.png`])
        .slice(0, 5)
        .map((url) => ({
          url,
          width: 1200,
          height: 630,
          alt: product?.name || "Product image",
        })),
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [images?.[0] || `${baseUrl}/og-default.png`],
    },
  };
}

const Page = async ({ params }) => {
  const { slug } = params;

  const productData = await getProductDetails(slug);
  if (!productData) notFound();

  const baseUrl = getSiteUrl();
  const productUrl = `${baseUrl}/product/${productData.slug}`;

  const images = (
    productData?.images?.length
      ? productData.images
      : [{ url: productData?.mainImage }]
  )
    .map((i) => i?.url)
    .filter(Boolean);

  const inStock = (productData?.stockAmount ?? 0) > 0;

  // ✅ Product JSON-LD (Google uses this for product rich results)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    name: productData?.name,
    description: cleanText(productData?.shortdescription) || productData?.name,
    category: productData?.category?.name || "Product",
    image: images,
    sku: productData?.id,
    url: productUrl,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: String(productData?.price),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (productData?.averageRating && productData?.reviews?.length) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(productData.averageRating),
      reviewCount: String(productData.reviews.length),
    };
  }

  // ✅ Breadcrumb JSON-LD
  const categoryName = productData?.category?.name;
  const categoryUrl = categoryName
    ? `${baseUrl}/category/${encodeURIComponent(categoryName.toLowerCase())}`
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      categoryUrl
        ? {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: categoryUrl,
          }
        : null,
      {
        "@type": "ListItem",
        position: categoryUrl ? 3 : 2,
        name: productData?.name,
        item: productUrl,
      },
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <SingleProductDetail productData={productData} />
      <RelatedProducts productId={productData?.id} />
    </>
  );
};

export default Page;
