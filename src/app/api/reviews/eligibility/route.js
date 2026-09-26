import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = current.id;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
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
      { error: "Failed to check eligibility" },
      { status: 500 }
    );
  }
}
