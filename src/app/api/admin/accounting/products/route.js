/**
 * File: app/api/admin/accounting/products/route.js
 *
 * GET /api/admin/accounting/products
 *
 * Product-wise accounting report.
 * Admin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2 } from "@/lib/loan-utils";

const MAX_LIMIT = 100;

async function requireAdmin() {
  const current = await getCurrentUser();

  if (!current) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!isAdminUser(current)) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { current };
}

function parseDateRange(searchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;

  if (start && isNaN(start.getTime())) {
    return { error: "Invalid from date. Use YYYY-MM-DD." };
  }

  if (end && isNaN(end.getTime())) {
    return { error: "Invalid to date. Use YYYY-MM-DD." };
  }

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  if (start && end && start > end) {
    return { error: "from date cannot be after to date." };
  }

  return { start, end };
}

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") || 20))
    );

    const q = searchParams.get("q");
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const minStock = Number(searchParams.get("minStock") || 0);
    const maxStockParam = searchParams.get("maxStock");
    const maxStock = maxStockParam ? Number(maxStockParam) : null;

    const range = parseDateRange(searchParams);

    if (range.error) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const productWhere = {
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { slug: { contains: q } },
              { shortdescription: { contains: q } },
            ],
          }
        : {}),
      ...(lowStockOnly
        ? {
            stockAmount: {
              lte: 5,
            },
          }
        : {}),
      ...(minStock > 0 || maxStock !== null
        ? {
            stockAmount: {
              ...(minStock > 0 ? { gte: minStock } : {}),
              ...(maxStock !== null ? { lte: maxStock } : {}),
            },
          }
        : {}),
    };

    const orderDateWhere =
      range.start || range.end
        ? {
            order: {
              createdAt: {
                ...(range.start ? { gte: range.start } : {}),
                ...(range.end ? { lte: range.end } : {}),
              },
              status: "DELIVERED",
              isPaid: true,
            },
          }
        : {
            order: {
              status: "DELIVERED",
              isPaid: true,
            },
          };

    const loanDateWhere =
      range.start || range.end
        ? {
            appliedAt: {
              ...(range.start ? { gte: range.start } : {}),
              ...(range.end ? { lte: range.end } : {}),
            },
          }
        : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        select: {
          id: true,
          name: true,
          slug: true,
          mainImage: true,
          price: true,
          buyingPrice: true,
          stockAmount: true,
          isActive: true,
          category: {
            select: {
              name: true,
            },
          },
          orderItems: {
            where: orderDateWhere,
            select: {
              quantity: true,
              pricePaid: true,
              buyingPrice: true,
              sellingPrice: true,
              totalCost: true,
              totalRevenue: true,
              totalProfit: true,
            },
          },
          loanApplications: {
            where: {
              status: {
                in: ["DOWN_PAYMENT_PENDING", "ACTIVE", "COMPLETED"],
              },
              ...loanDateWhere,
            },
            select: {
              productPrice: true,
              productBuyingPrice: true,
              productProfit: true,
              interestProfit: true,
              expectedProfit: true,
              totalPayable: true,
              downPaymentPaid: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.product.count({
        where: productWhere,
      }),
    ]);

    const mappedProducts = products.map((product) => {
      const stockCostValue =
        Number(product.buyingPrice || 0) * Number(product.stockAmount || 0);

      const stockSellingValue =
        Number(product.price || 0) * Number(product.stockAmount || 0);

      const directSoldQty = product.orderItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      const directRevenue = product.orderItems.reduce((sum, item) => {
        if (Number(item.totalRevenue || 0) > 0) {
          return sum + Number(item.totalRevenue || 0);
        }

        return (
          sum + Number(item.pricePaid || 0) * Number(item.quantity || 0)
        );
      }, 0);

      const directCost = product.orderItems.reduce((sum, item) => {
        if (Number(item.totalCost || 0) > 0) {
          return sum + Number(item.totalCost || 0);
        }

        return (
          sum +
          Number(item.buyingPrice || product.buyingPrice || 0) *
            Number(item.quantity || 0)
        );
      }, 0);

      const directProfit = product.orderItems.reduce((sum, item) => {
        if (Number(item.totalProfit || 0) !== 0) {
          return sum + Number(item.totalProfit || 0);
        }

        const revenue =
          Number(item.pricePaid || 0) * Number(item.quantity || 0);

        const cost =
          Number(item.buyingPrice || product.buyingPrice || 0) *
          Number(item.quantity || 0);

        return sum + revenue - cost;
      }, 0);

      const loanSoldQty = product.loanApplications.length;

      const loanSales = product.loanApplications.reduce(
        (sum, loan) => sum + Number(loan.productPrice || 0),
        0
      );

      const loanProductProfit = product.loanApplications.reduce(
        (sum, loan) => sum + Number(loan.productProfit || 0),
        0
      );

      const loanInterestProfit = product.loanApplications.reduce(
        (sum, loan) => sum + Number(loan.interestProfit || 0),
        0
      );

      const loanExpectedProfit = product.loanApplications.reduce(
        (sum, loan) => sum + Number(loan.expectedProfit || 0),
        0
      );

      const totalSoldQty = directSoldQty + loanSoldQty;
      const totalRevenue = directRevenue + loanSales;
      const totalProfit = directProfit + loanExpectedProfit;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        mainImage: product.mainImage,
        categoryName: product.category?.name || null,
        isActive: product.isActive,

        buyingPrice: f2(product.buyingPrice),
        sellingPrice: f2(product.price),
        stockAmount: product.stockAmount,

        stockCostValue: f2(stockCostValue),
        stockSellingValue: f2(stockSellingValue),

        directSoldQty,
        directRevenue: f2(directRevenue),
        directCost: f2(directCost),
        directProfit: f2(directProfit),

        loanSoldQty,
        loanSales: f2(loanSales),
        loanProductProfit: f2(loanProductProfit),
        loanInterestProfit: f2(loanInterestProfit),
        loanExpectedProfit: f2(loanExpectedProfit),

        totalSoldQty,
        totalRevenue: f2(totalRevenue),
        totalProfit: f2(totalProfit),
      };
    });

    const summary = mappedProducts.reduce(
      (acc, product) => {
        acc.stockCostValue += product.stockCostValue;
        acc.stockSellingValue += product.stockSellingValue;

        acc.directSoldQty += product.directSoldQty;
        acc.directRevenue += product.directRevenue;
        acc.directProfit += product.directProfit;

        acc.loanSoldQty += product.loanSoldQty;
        acc.loanSales += product.loanSales;
        acc.loanExpectedProfit += product.loanExpectedProfit;

        acc.totalSoldQty += product.totalSoldQty;
        acc.totalRevenue += product.totalRevenue;
        acc.totalProfit += product.totalProfit;

        return acc;
      },
      {
        stockCostValue: 0,
        stockSellingValue: 0,
        directSoldQty: 0,
        directRevenue: 0,
        directProfit: 0,
        loanSoldQty: 0,
        loanSales: 0,
        loanExpectedProfit: 0,
        totalSoldQty: 0,
        totalRevenue: 0,
        totalProfit: 0,
      }
    );

    return NextResponse.json({
      range: {
        from: range.start,
        to: range.end,
      },
      products: mappedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        stockCostValue: f2(summary.stockCostValue),
        stockSellingValue: f2(summary.stockSellingValue),

        directSoldQty: summary.directSoldQty,
        directRevenue: f2(summary.directRevenue),
        directProfit: f2(summary.directProfit),

        loanSoldQty: summary.loanSoldQty,
        loanSales: f2(summary.loanSales),
        loanExpectedProfit: f2(summary.loanExpectedProfit),

        totalSoldQty: summary.totalSoldQty,
        totalRevenue: f2(summary.totalRevenue),
        totalProfit: f2(summary.totalProfit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/products]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}