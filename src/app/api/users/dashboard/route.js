import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const [totalOrders, pendingOrders, completedOrders, wishlist, activeLoans] =
      await Promise.all([
        prisma.order.count({
          where: { userId: userId },
        }),

        prisma.order.count({
          // Orders still on their way (not delivered or cancelled).
          where: { userId, status: { in: ["PENDING", "PROCESSING", "SHIPPED"] } },
        }),

        prisma.order.count({
          where: { userId: userId, status: "DELIVERED" },
        }),

        prisma.wishlist.findUnique({
          where: { userId: userId },
          select: { _count: { select: { products: true } } },
        }),

        prisma.loanApplication.count({
          where: { userId, status: { in: ["PENDING", "REVIEWING", "APPROVED", "DOWN_PAYMENT_PENDING", "ACTIVE"] } },
        }),
      ]);

    const dashboardData = {
      totalOrders: totalOrders,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      wishlistItems: wishlist?._count.products || 0,
      activeLoans,
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
