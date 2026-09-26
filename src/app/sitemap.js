import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

// Rebuild the sitemap at most once an hour.
export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();

  const staticPages = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/allproducts", changeFrequency: "daily", priority: 0.9 },
    { path: "/category", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.4 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  ].map(({ path, ...rest }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    ...rest,
  }));

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true, mainImage: true },
        orderBy: { updatedAt: "desc" },
        take: 45000, // sitemap files are limited to 50,000 URLs
      }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);

    const categoryPages = categories.map((c) => ({
      url: `${SITE_URL}/category/${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const productPages = products.map((p) => ({
      url: `${SITE_URL}/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
      ...(p.mainImage ? { images: [p.mainImage] } : {}),
    }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (error) {
    console.error("sitemap: Error", error);
    return staticPages;
  }
}
