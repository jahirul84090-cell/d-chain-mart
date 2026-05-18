import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;
  const { id } = params;
  try {
    const updatedReview = await prisma.review.update({
      where: { id: id },
      data: { isApproved: true },
    });
    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Failed to approve review:", error);
    return NextResponse.json(
      { error: "Failed to approve review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.reviewImage.deleteMany({
      where: {
        reviewId: id,
      },
    });

    await prisma.review.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
