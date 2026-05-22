/**
 * File: app/api/admin/accounting/dashboard/route.js
 *
 * GET /api/admin/accounting/dashboard
 *
 * Query:
 *   ?from=2026-05-01&to=2026-05-31
 *
 * Admin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2 } from "@/lib/loan-utils";

function parseDateRange(searchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();

  const start = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const end = to ? new Date(to) : now;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      error: "Invalid date format. Use YYYY-MM-DD.",
    };
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (start > end) {
    return {
      error: "from date cannot be after to date.",
    };
  }

  return { start, end };
}

export async function GET(req) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = parseDateRange(searchParams);

    if (range.error) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const { start, end } = range;

    const [
      directOrders,
      loanApplications,
      loanPayments,
      expenses,
      products,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: "DELIVERED",
          isPaid: true,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          items: true,
        },
      }),

      prisma.loanApplication.findMany({
        where: {
          status: {
            in: ["DOWN_PAYMENT_PENDING", "ACTIVE", "COMPLETED"],
          },
          appliedAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      prisma.loanPayment.findMany({
        where: {
          status: "SUCCESS",
          paidAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      prisma.expense.findMany({
        where: {
          expenseAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          buyingPrice: true,
          stockAmount: true,
        },
      }),

      prisma.product.findMany({
        where: {
          stockAmount: {
            lte: 5,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          stockAmount: true,
          mainImage: true,
        },
        orderBy: {
          stockAmount: "asc",
        },
        take: 10,
      }),
    ]);

    const directSales = directOrders.reduce((sum, order) => {
      return sum + Number(order.orderTotal || 0);
    }, 0);

    const directProfit = directOrders.reduce((sum, order) => {
      const profit = order.items.reduce((itemSum, item) => {
        if (Number(item.totalProfit || 0) !== 0) {
          return itemSum + Number(item.totalProfit || 0);
        }

        const revenue =
          Number(item.pricePaid || 0) * Number(item.quantity || 0);

        return itemSum + revenue;
      }, 0);

      return sum + profit;
    }, 0);

    const loanSales = loanApplications.reduce((sum, loan) => {
      return sum + Number(loan.productPrice || 0);
    }, 0);

    const expectedLoanProfit = loanApplications.reduce((sum, loan) => {
      return sum + Number(loan.expectedProfit || 0);
    }, 0);

    const downPaymentCollected = loanPayments
      .filter((payment) => payment.paymentType === "DOWN_PAYMENT")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const emiCollected = loanPayments
      .filter((payment) => payment.paymentType === "INSTALLMENT")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const lateFeeCollected = loanPayments
      .filter((payment) => payment.paymentType === "LATE_FEE")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const totalExpense = expenses.reduce((sum, expense) => {
      return sum + Number(expense.amount || 0);
    }, 0);

    const stockValue = products.reduce((sum, product) => {
      return (
        sum +
        Number(product.buyingPrice || 0) * Number(product.stockAmount || 0)
      );
    }, 0);

    const stockSellingValue = products.reduce((sum, product) => {
      return (
        sum +
        Number(product.price || 0) * Number(product.stockAmount || 0)
      );
    }, 0);

    const totalCollection =
      directSales + downPaymentCollected + emiCollected + lateFeeCollected;

    const grossProfit =
      directProfit + expectedLoanProfit + lateFeeCollected;

    const netProfit = grossProfit - totalExpense;

    return NextResponse.json({
      range: {
        from: start,
        to: end,
      },
      summary: {
        directSales: f2(directSales),
        loanSales: f2(loanSales),

        downPaymentCollected: f2(downPaymentCollected),
        emiCollected: f2(emiCollected),
        lateFeeCollected: f2(lateFeeCollected),

        totalCollection: f2(totalCollection),

        directProfit: f2(directProfit),
        expectedLoanProfit: f2(expectedLoanProfit),
        grossProfit: f2(grossProfit),

        totalExpense: f2(totalExpense),
        netProfit: f2(netProfit),

        stockValue: f2(stockValue),
        stockSellingValue: f2(stockSellingValue),

        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
      },
      counts: {
        directOrders: directOrders.length,
        loanApplications: loanApplications.length,
        loanPayments: loanPayments.length,
        expenses: expenses.length,
      },
      lowStockProducts,
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/dashboard]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}