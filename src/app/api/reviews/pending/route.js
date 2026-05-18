import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit")) || 10;

  try {
    const deliveredOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: userId,
          status: "DELIVERED",
          isPaid: true,
        },
      },
      select: {
        productId: true,
        productSnapshot: true,
        product: {
          select: {
            slug: true,
            mainImage: true,
          },
        },
      },
      distinct: ["productId"],
      take: limit,
    });

    const productIds = deliveredOrderItems.map((item) => item.productId);

    const existingReviews = await prisma.review.findMany({
      where: {
        userId: userId,
        productId: {
          in: productIds,
        },
      },
      select: {
        productId: true,
      },
    });

    const reviewedProductIds = new Set(
      existingReviews.map((review) => review.productId)
    );

    const pendingReviewProducts = deliveredOrderItems
      .filter((item) => !reviewedProductIds.has(item.productId))
      .map((item) => {
        const snapshot = item.productSnapshot || {};
        const currentProduct = item.product;

        return {
          id: item.productId,
          name: snapshot.name || "Product Name Missing",
          imageUrl: currentProduct?.mainImage || "/placeholder.png",
          slug: currentProduct?.slug || item.productId,
        };
      });

    return NextResponse.json(
      {
        products: pendingReviewProducts,
        total: pendingReviewProducts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return NextResponse.json(
      {
        error:
          "Failed to fetch pending reviews. An internal server error occurred.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
