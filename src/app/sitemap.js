import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { absoluteUrl } from "@/lib/jsonld";
import { POLICY_UPDATED } from "@/lib/policies";

// Rebuild the sitemap at most once an hour.
export const revalidate = 3600;

// lastmod must reflect real content changes, otherwise Google ignores it.
const policyDate = new Date(`${POLICY_UPDATED} UTC`);

const POLICY_PAGES = [
  "/faq",
  "/shipping-policy",
  "/return-policy",
  "/emi-policy",
  "/privacy-policy",
  "/terms-and-conditions",
];

export default async function sitemap() {
  let products = [];
  let categories = [];
  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true, mainImage: true, categoryId: true },
        orderBy: { updatedAt: "desc" },
        take: 45000, // sitemap files are limited to 50,000 URLs
      }),
      prisma.category.findMany({ select: { id: true, slug: true } }),
    ]);
  } catch (error) {
    console.error("sitemap: Error", error);
  }

  // Listing pages change whenever one of their products does.
  const newestProduct = products[0]?.updatedAt;
  const newestByCategory = new Map();
  for (const p of products) {
    if (!newestByCategory.has(p.categoryId)) newestByCategory.set(p.categoryId, p.updatedAt);
  }
  const withDate = (date) => (date ? { lastModified: date } : {});

  const pages = [
    { url: SITE_URL, ...withDate(newestProduct) },
    { url: `${SITE_URL}/allproducts`, ...withDate(newestProduct) },
    { url: `${SITE_URL}/category`, ...withDate(newestProduct) },
    { url: `${SITE_URL}/about` },
    { url: `${SITE_URL}/contact` },
    ...POLICY_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      ...(Number.isNaN(policyDate.getTime()) ? {} : { lastModified: policyDate }),
    })),
    ...categories
      // Empty categories are thin pages; leave them out until they have products.
      .filter((c) => newestByCategory.has(c.id))
      .map((c) => ({
        url: `${SITE_URL}/category/${encodeURIComponent(c.slug)}`,
        lastModified: newestByCategory.get(c.id),
      })),
    ...products.map((p) => ({
      url: `${SITE_URL}/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      ...(p.mainImage ? { images: [absoluteUrl(p.mainImage)] } : {}),
    })),
  ];

  return pages;
}
