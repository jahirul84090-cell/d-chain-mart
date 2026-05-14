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

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        orderTotal: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
