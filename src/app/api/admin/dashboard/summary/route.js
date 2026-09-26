import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { requireAuthenticatedUser } from "@/lib/authCheck";


export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    let startDate;
    const now = new Date();

    // Fix 1: Robust Date Filtering
    // This uses a consistent calculation for the start date
    // and correctly handles the 'all-time' case.
    switch (period) {
      case "7days":
        startDate = subDays(now, 7);
        break;
      case "15days":
        startDate = subDays(now, 15);
        break;
      case "1month":
        startDate = subDays(now, 30);
        break;
      case "all-time":
      default:
        startDate = new Date(0); // Epoch time to fetch all orders
        break;
    }

    const LOW_STOCK_THRESHOLD = 5;

    const [orders, totalProducts, totalUsers, lowStockProducts] =
      await Promise.all([
        // Query 1: Fetch orders and related data filtered by the period
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          include: {
            user: { select: { name: true } },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),

        // Query 2: Get the total count of all products
        prisma.product.count(),

        // Query 3: customer accounts (staff excluded)
        prisma.user.count({ where: { role: "USER" } }),

        // Query 4: Get products with low stock, using the 'stockAmount' field
        // Fix 2: Correct Schema Field
        // This query now correctly uses `stockAmount` as per your schema.
        prisma.product.findMany({
          where: {
            isActive: true,
            stockAmount: {
              lte: LOW_STOCK_THRESHOLD,
            },
          },
          orderBy: {
            stockAmount: "asc",
          },
        }),
      ]);

    // Revenue counts only money actually received: paid, not cancelled.
    const earning = orders.filter((o) => o.isPaid && o.status !== "CANCELLED");
    const totalRevenue = earning.reduce((sum, order) => sum + order.orderTotal, 0);
    const pendingRevenue = orders
      .filter((o) => !o.isPaid && o.status !== "CANCELLED")
      .reduce((sum, order) => sum + order.orderTotal, 0);
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;

    // Logic to find the top-selling product by aggregating quantities
    const productSales = {};
    orders.filter((o) => o.status !== "CANCELLED").forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        const quantity = item.quantity;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            image: item.product.images[0],
            quantitySold: 0,
          };
        }
        productSales[productId].quantitySold += quantity;
      });
    });

    // Fix 3: Handling Zero Orders
    // This check prevents the 'Cannot read properties of undefined' error
    // by ensuring we only run the reduce function if sales data exists.
    let topSellingProduct = null;
    const soldProductIds = Object.keys(productSales);
    if (soldProductIds.length > 0) {
      const topSellingProductId = soldProductIds.reduce((a, b) =>
        productSales[a].quantitySold > productSales[b].quantitySold ? a : b
      );
      topSellingProduct = productSales[topSellingProductId];
    }

    return NextResponse.json({
      orders,
      metrics: {
        totalRevenue,
        pendingRevenue,
        totalOrders,
        cancelledOrders,
        totalProducts,
        totalUsers,
      },
      topSellingProduct,
      lowStockProducts,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data." },
      { status: 500 }
    );
  }
}
