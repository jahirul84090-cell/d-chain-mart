// app/api/admin/products/[id]/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const p = await params;
  const { id } = p;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        images: { select: { url: true } },
        reviews: { select: { rating: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productWithRating = {
      ...product,
      rating:
        product.reviews.length > 0
          ? (
              product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            ).toFixed(1)
          : "N/A",
    };

    return NextResponse.json({ product: productWithRating }, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product: " + error.message },
      { status: 500 }
    );
  }
}
