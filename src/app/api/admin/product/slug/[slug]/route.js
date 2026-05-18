import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { slug } = params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { name: true },
        },
        images: {
          select: { url: true },
        },
        reviews: {
          where: { isApproved: true },
          select: {
            rating: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
            images: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }
    await prisma.product.update({
      where: { slug },
      data: {
        views: {
          increment: 1,
        },
      },
    });
    const reviewsData = product.reviews || [];

    const averageRating =
      reviewsData.length > 0
        ? parseFloat(
            (
              reviewsData.reduce((sum, review) => sum + review.rating, 0) /
              reviewsData.length
            ).toFixed(1)
          )
        : null;

    const productWithRating = {
      ...product,
      averageRating: averageRating,
    };

    return NextResponse.json({ product: productWithRating }, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { message: "Failed to fetch product data." },
      { status: 500 }
    );
  }
}
