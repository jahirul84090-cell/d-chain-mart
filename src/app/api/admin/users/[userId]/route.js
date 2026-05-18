import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;

    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 10;
    const skip = (page - 1) * pageSize;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const totalOrders = await prisma.order.count({
      where: { userId: userId },
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderTotal: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            shippingAddress: {
              select: { street: true, city: true, country: true },
            },
            items: {
              select: {
                id: true,
                productId: true,
                quantity: true,
                pricePaid: true,
                productSnapshot: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: skip,
          take: pageSize,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { user: targetUser, totalOrders },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details: " + error.message },
      { status: 500 }
    );
  }
}
