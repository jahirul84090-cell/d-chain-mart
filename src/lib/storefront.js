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

// Newest active products (used for the all-products structured data).
export const getLatestProducts = unstable_cache(
  async (limit = 50) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
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
  ["storefront-latest-products"],
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

// Full product for the product page (same shape as the slug API).
export const getProductBySlug = unstable_cache(
  async (slug) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true, slug: true } },
        images: { select: { url: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          select: {
            rating: true,
            content: true,
            createdAt: true,
            user: { select: { name: true, image: true } },
            images: { select: { url: true } },
          },
        },
      },
    });
    if (!product) return null;
    const ratings = product.reviews.map((r) => r.rating);
    return {
      ...product,
      averageRating: ratings.length
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : null,
    };
  },
  ["storefront-product-by-slug"],
  { revalidate: 3600, tags: ["products"] }
);

// Related products: same category first, then name matches as a fallback.
// Returns the same shape as the listing API so product cards work unchanged.
export const getRelatedProducts = unstable_cache(
  async (productId, limit = 8) => {
    const main = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, categoryId: true },
    });
    if (!main) return [];

    const include = {
      category: { select: { name: true, slug: true } },
      images: { select: { url: true } },
      reviews: { where: { isApproved: true }, select: { rating: true } },
    };

    let products = await prisma.product.findMany({
      where: { id: { not: main.id }, categoryId: main.categoryId, isActive: true },
      include,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (products.length === 0) {
      // MySQL's default collation already compares case-insensitively.
      const firstWord = main.name.split(/\s+/)[0];
      products = await prisma.product.findMany({
        where: { id: { not: main.id }, isActive: true, name: { contains: firstWord } },
        include,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }
    return products.map(withRating);
  },
  ["storefront-related-products"],
  { revalidate: STOREFRONT_REVALIDATE, tags: ["products"] }
);

// Delivery fees, used for shipping details in product structured data.
export const getDeliveryFees = unstable_cache(
  async () => prisma.deliveryFee.findMany({ select: { city: true, country: true, amount: true } }),
  ["storefront-delivery-fees"],
  { revalidate: STOREFRONT_REVALIDATE, tags: ["delivery-fees"] }
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
