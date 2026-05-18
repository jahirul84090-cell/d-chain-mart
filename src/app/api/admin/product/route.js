// app/api/admin/products/route.js
import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const data = await request.json();
    const {
      name,
      slug,
      description,
      shortdescription, // New field
      price,
      oldPrice, // New field
      discount, // New field
      stockAmount,
      availableSizes,
      availableColors,
      isFeatured,
      isActive,
      isPopular,
      isNewArrival,
      isSlider,
      categoryId,
      mainImage,
      images,
    } = data;

    if (
      !name ||
      !slug ||
      !price ||
      !shortdescription || // New validation
      !categoryId ||
      !mainImage
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const findSlug = await prisma.product.findFirst({ where: { slug: slug } });

    if (findSlug) {
      return NextResponse.json(
        { error: "Try Diferrent Slug Name" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        shortdescription, // New field
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null, // New field, handle optional
        discount: discount ? parseInt(discount) : 0, // New field, handle optional
        stockAmount: parseInt(stockAmount) || 0,
        availableSizes,
        availableColors,
        isFeatured: !!isFeatured,
        isPopular: !!isPopular,
        isNewArrival: !!isNewArrival,
        isSlider: !!isSlider,
        isActive: !!isActive,
        categoryId,
        mainImage,
        images: {
          create: images ? images.map((url) => ({ url })) : [],
        },
      },
      include: { images: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const data = await request.json();
    const {
      id,
      name,
      slug,
      isActive,
      description,
      shortdescription, // New field
      price,
      oldPrice, // New field
      discount, // New field
      stockAmount,
      availableSizes,
      availableColors,
      isFeatured,
      isPopular,
      isNewArrival,
      isSlider,
      categoryId,
      mainImage,
      images,
    } = data;

    if (
      !id ||
      !name ||
      !slug ||
      !price ||
      !shortdescription || // New validation
      !categoryId ||
      !mainImage
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        shortdescription, // New field
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null, // New field, handle optional
        discount: discount ? parseInt(discount) : 0, // New field, handle optional
        stockAmount: parseInt(stockAmount) || 0,
        availableSizes,
        availableColors,
        isFeatured: !!isFeatured,
        isPopular: !!isPopular,
        isNewArrival: !!isNewArrival,
        isSlider: !!isSlider,
        isActive: !!isActive,
        categoryId,
        mainImage,
        images: {
          deleteMany: {}, // Clear existing images
          create: images ? images.map((url) => ({ url })) : [],
        },
      },
      include: { images: true },
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 }
      );
    }

    await prisma.$transaction([prisma.product.delete({ where: { id } })]);

    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Failed to delete product due to foreign key constraints. Check for dependent records like review images.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete product: " + error.message },
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
    case "newest":
    default:
      orderBy.createdAt = "desc";
      break;
  }

  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;

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
      { error: "Failed to fetch products: " + error.message },
      { status: 500 }
    );
  }
}
