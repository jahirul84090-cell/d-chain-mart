/**
 * File: app/api/admin/accounting/daily/route.js
 *
 * GET /api/admin/accounting/daily
 *
 * Query:
 *   ?date=2026-05-20
 *
 * Admin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2 } from "@/lib/loan-utils";

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

function parseDay(searchParams) {
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  if (isNaN(date.getTime())) {
    return {
      error: "Invalid date. Use YYYY-MM-DD.",
    };
  }

  const start = new Date(date);
  const end = new Date(date);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const range = parseDay(searchParams);

    if (range.error) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const { start, end } = range;

    const [orders, loans, payments, expenses] = await Promise.all([
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
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  mainImage: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
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
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              mainImage: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          appliedAt: "desc",
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
        include: {
          loanApplication: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  mainImage: true,
                },
              },
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          paidAt: "desc",
        },
      }),

      prisma.expense.findMany({
        where: {
          expenseAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          expenseAt: "desc",
        },
      }),
    ]);

    const directSales = orders.reduce(
      (sum, order) => sum + Number(order.orderTotal || 0),
      0
    );

    const directProfit = orders.reduce((sum, order) => {
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

    const loanSales = loans.reduce(
      (sum, loan) => sum + Number(loan.productPrice || 0),
      0
    );

    const expectedLoanProfit = loans.reduce(
      (sum, loan) => sum + Number(loan.expectedProfit || 0),
      0
    );

    const downPaymentCollected = payments
      .filter((payment) => payment.paymentType === "DOWN_PAYMENT")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const emiCollected = payments
      .filter((payment) => payment.paymentType === "INSTALLMENT")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const lateFeeCollected = payments
      .filter((payment) => payment.paymentType === "LATE_FEE")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const totalExpense = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

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
      },
      counts: {
        directOrders: orders.length,
        loanApplications: loans.length,
        loanPayments: payments.length,
        expenses: expenses.length,
      },
      data: {
        orders,
        loans,
        payments,
        expenses,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/daily]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}