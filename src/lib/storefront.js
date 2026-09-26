import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// Cached storefront queries for server components. Pages read the database
// directly (no HTTP round trip to our own API) and results are reused for
// STOREFRONT_REVALIDATE seconds, so busy pages don't hit MySQL on every visit.

export const STOREFRONT_REVALIDATE = 300; // 5 minutes

const withRating = (product) => {
  const { reviews = [], ...rest } = product;
  return {
    ...rest,
    rating:
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "N/A",
  };
};

// Same shape as GET /api/admin/product, limited to active products.
export const getProductsByFlag = unstable_cache(
  async (flag, limit = 20) => {
    const allowed = ["isSlider", "isPopular", "isFeatured", "isNewArrival"];
    if (!allowed.includes(flag)) throw new Error(`Unknown product flag: ${flag}`);

    const products = await prisma.product.findMany({
      where: { isActive: true, [flag]: true },
      include: {
        category: { select: { name: true } },
        images: { select: { url: true } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return products.map(withRating);
  },
  ["storefront-products-by-flag"],
  { revalidate: STOREFRONT_REVALIDATE, tags: ["products"] }
);

export const getCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, imageUrl: true },
      orderBy: { name: "asc" },
    }),
  ["storefront-categories"],
  { revalidate: STOREFRONT_REVALIDATE, tags: ["categories"] }
);

export const getFeaturedCategoryWithProducts = unstable_cache(
  async () =>
    prisma.category.findFirst({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        products: { where: { isActive: true }, take: 20 },
      },
    }),
  ["storefront-featured-category"],
  { revalidate: STOREFRONT_REVALIDATE, tags: ["categories", "products"] }
);

// Safe wrapper: a storefront section should render empty, not crash the page.
export async function safely(promise, fallback) {
  try {
    return await promise;
  } catch (error) {
    console.error("storefront: query failed", error);
    return fallback;
  }
}
