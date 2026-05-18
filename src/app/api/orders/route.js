import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const pageSize = parseInt(searchParams.get("pageSize")) || 10;
  const skip = (page - 1) * pageSize;

  try {
    const totalOrdersCount = await prisma.order.count({
      where: {
        userId: userId,
      },
    });

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        paymentMethod: true,
        items: {
          select: {
            quantity: true,
            pricePaid: true,
            productSnapshot: true,
          },
        },
        invoice: { select: { id: true } },
      },

      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalOrdersCount / pageSize);

    return NextResponse.json({
      data: orders,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalOrders: totalOrdersCount,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
