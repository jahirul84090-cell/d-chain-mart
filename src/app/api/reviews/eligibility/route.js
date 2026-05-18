import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");

    if (!productId || !userId) {
      return NextResponse.json(
        { error: "Product ID and User ID are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: "DELIVERED",
        isPaid: true,
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          eligible: false,
          message:
            "You must purchase and complete payment for this product to review it.",
        },
        { status: 200 }
      );
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          eligible: false,
          message: "You have already reviewed this product.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        eligible: true,
        message: "You can submit a review for this product.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json(
      { error: "Failed to check eligibility: " + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
