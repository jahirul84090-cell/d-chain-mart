import { formatOptions } from "./product-options";
import { slugError, slugify } from "./slug";

/**
 * Validates and normalises product data from the admin form.
 * Returns { error } or { data } ready for Prisma (without images/id).
 */
export function normalizeProductInput(body) {
  const name = String(body.name ?? "").trim();
  const shortdescription = String(body.shortdescription ?? "").trim();
  const slug = slugify(body.slug || name);
  const price = Number.parseFloat(body.price);
  const oldPriceRaw = body.oldPrice === "" || body.oldPrice == null ? null : Number.parseFloat(body.oldPrice);
  const stockAmount = Number.parseInt(body.stockAmount ?? 0, 10);

  const missing = [];
  if (!name) missing.push("name");
  if (!shortdescription) missing.push("short description");
  if (!body.categoryId) missing.push("category");
  if (!body.mainImage) missing.push("main image");
  if (missing.length) return { error: `Missing required fields: ${missing.join(", ")}.` };

  const badSlug = slugError(slug);
  if (badSlug) return { error: badSlug };
  if (!Number.isFinite(price) || price <= 0) return { error: "Price must be a positive number." };
  if (oldPriceRaw != null && (!Number.isFinite(oldPriceRaw) || oldPriceRaw < 0)) {
    return { error: "Old price must be a positive number." };
  }
  if (!Number.isInteger(stockAmount) || stockAmount < 0) {
    return { error: "Stock must be a whole number of 0 or more." };
  }

  // Discount is always derived from the prices so it can't disagree with them.
  const oldPrice = oldPriceRaw && oldPriceRaw > price ? oldPriceRaw : 0;
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return {
    data: {
      name,
      slug,
      description: body.description || null,
      shortdescription,
      price,
      oldPrice,
      discount,
      stockAmount,
      availableSizes: formatOptions(body.availableSizes),
      availableColors: formatOptions(body.availableColors),
      isFeatured: !!body.isFeatured,
      isPopular: !!body.isPopular,
      isNewArrival: !!body.isNewArrival,
      isSlider: !!body.isSlider,
      isActive: !!body.isActive,
      categoryId: body.categoryId,
      mainImage: body.mainImage,
    },
  };
}
