import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 10;
    const skip = (page - 1) * pageSize;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const [totalOrders, earned] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      // Lifetime value = paid, non-cancelled orders across all pages.
      prisma.order.aggregate({
        where: { userId, isPaid: true, status: { not: "CANCELLED" } },
        _sum: { orderTotal: true },
        _count: true,
      }),
    ]);
    const stats = {
      lifetimeValue: earned._sum.orderTotal || 0,
      paidOrders: earned._count,
      averageOrderValue: earned._count ? (earned._sum.orderTotal || 0) / earned._count : 0,
    };

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        phoneNumber: true,
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
              select: { street: true, city: true, state: true, country: true, phoneNumber: true },
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
      { user: targetUser, totalOrders, stats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
