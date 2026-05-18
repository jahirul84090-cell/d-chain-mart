import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    let startDate;
    const now = new Date();

    switch (period) {
      case "day":
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        // Default to a week if no period is specified
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
    }

    // Prisma query to get orders and related user data within the specified time period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // You can now aggregate this data for your metrics
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.orderTotal,
      0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json({
      orders,
      metrics: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
