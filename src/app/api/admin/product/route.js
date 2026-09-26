import { revalidateTag } from "next/cache";
// app/api/admin/products/route.js
import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { normalizeProductInput } from "@/lib/product-input";

async function handlePOST(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const body = await request.json();
    const { data, error } = normalizeProductInput(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists. Choose another slug." },
        { status: 409 }
      );
    }

    const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    const product = await prisma.product.create({
      data: {
        ...data,
        images: { create: images.map((url) => ({ url })) },
      },
      include: { images: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

async function handlePATCH(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }
    const { data, error } = normalizeProductInput(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const clash = await prisma.product.findFirst({
      where: { slug: data.slug, NOT: { id: body.id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: "Another product already uses this slug. Choose another slug." },
        { status: 409 }
      );
    }

    const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    const product = await prisma.product.update({
      where: { id: body.id },
      data: {
        ...data,
        images: {
          deleteMany: {}, // replace the gallery with the submitted list
          create: images.map((url) => ({ url })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

async function handleDELETE(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);
    if (authCheck) return authCheck;

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    // Check orders
    const orderCount = await prisma.orderItem.count({
      where: { productId: id },
    });
    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete: this product has existing orders." },
        { status: 400 }
      );
    }

    // Check active loan applications
    const loanCount = await prisma.loanApplication.count({
      where: {
        productId: id,
        status: {
          notIn: ["REJECTED", "CANCELLED"],
        },
      },
    });
    if (loanCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete: this product has active loan applications." },
        { status: 400 }
      );
    }

    // Safe to delete — clear dependents in order
    await prisma.$transaction([
      prisma.stockLedger.deleteMany({ where: { productId: id } }),
      // Only delete REJECTED/CANCELLED loans (active ones are blocked above)
      prisma.loanApplication.deleteMany({
        where: {
          productId: id,
          status: { in: ["REJECTED", "CANCELLED"] },
        },
      }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: { wishlists: { set: [] } },
      }),
      prisma.reviewImage.deleteMany({
        where: { review: { productId: id } },
      }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Product deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const categoryIds = searchParams.getAll("categoryId") || [];

  const isFeatured =
    searchParams.get("isFeatured") === "true"
      ? true
      : searchParams.get("isFeatured") === "false"
      ? false
      : undefined;
  const isPopular =
    searchParams.get("isPopular") === "true"
      ? true
      : searchParams.get("isPopular") === "false"
      ? false
      : undefined;
  const isNewArrival =
    searchParams.get("isNewArrival") === "true"
      ? true
      : searchParams.get("isNewArrival") === "false"
      ? false
      : undefined;
  const isSlider =
    searchParams.get("isSlider") === "true"
      ? true
      : searchParams.get("isSlider") === "false"
      ? false
      : undefined;
  const isActive =
    searchParams.get("isActive") === "true"
      ? true
      : searchParams.get("isActive") === "false"
      ? false
      : undefined;
  const minPrice = searchParams.get("minPrice")
    ? parseFloat(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? parseFloat(searchParams.get("maxPrice"))
    : undefined;
  const minRating = searchParams.get("minRating")
    ? parseFloat(searchParams.get("minRating"))
    : undefined;

  const sortBy = searchParams.get("sortBy") || "newest";
  const orderBy = {};

  switch (sortBy) {
    case "price-asc":
      orderBy.price = "asc";
      break;
    case "price-desc":
      orderBy.price = "desc";
      break;
    case "stock-asc":
      orderBy.stockAmount = "asc";
      break;
    case "stock-desc":
      orderBy.stockAmount = "desc";
      break;
    case "oldest":
      orderBy.createdAt = "asc";
      break;
    case "deals":
      orderBy.discount = "desc";
      break;
    case "newest":
    default:
      orderBy.createdAt = "desc";
      break;
  }

  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 20));

  try {
    const where = {
      AND: [
        search ? { name: { contains: search } } : {},

        // FIX: Use 'in' operator when categoryIds is an array
        categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {},

        isFeatured !== undefined ? { isFeatured } : {},
        isPopular !== undefined ? { isPopular } : {},
        isNewArrival !== undefined ? { isNewArrival } : {},
        isSlider !== undefined ? { isSlider } : {},
        isActive !== undefined ? { isActive } : {},
        minPrice !== undefined && maxPrice !== undefined
          ? { price: { gte: minPrice, lte: maxPrice } }
          : minPrice !== undefined
          ? { price: { gte: minPrice } }
          : maxPrice !== undefined
          ? { price: { lte: maxPrice } }
          : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          images: { select: { url: true } },
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithRating = products.map((product) => ({
      ...product,
      rating:
        product.reviews.length > 0
          ? (
              product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            ).toFixed(1)
          : "N/A",
    }));

    const filteredProductsByRating = minRating
      ? productsWithRating.filter((product) => {
          if (product.rating === "N/A") {
            return false;
          }
          return parseFloat(product.rating) >= minRating;
        })
      : productsWithRating;

    return NextResponse.json(
      {
        products: filteredProductsByRating,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// Refresh cached storefront data after a successful change.
export async function POST(...args) {
  const response = await handlePOST(...args);
  if (response?.ok) {
    revalidateTag("products");
  }
  return response;
}

export async function PATCH(...args) {
  const response = await handlePATCH(...args);
  if (response?.ok) {
    revalidateTag("products");
  }
  return response;
}

export async function DELETE(...args) {
  const response = await handleDELETE(...args);
  if (response?.ok) {
    revalidateTag("products");
  }
  return response;
}
