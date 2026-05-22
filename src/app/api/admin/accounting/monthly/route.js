/**
 * File: app/api/admin/accounting/monthly/route.js
 *
 * GET /api/admin/accounting/monthly
 *
 * Query:
 *   ?year=2026
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

function monthRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const year = Number(searchParams.get("year") || new Date().getFullYear());

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Invalid year." },
        { status: 400 }
      );
    }

    const monthly = [];

    for (let i = 0; i < 12; i++) {
      const { start, end } = monthRange(year, i);

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
      ]);

      const directSales = orders.reduce(
        (sum, order) => sum + Number(order.orderTotal || 0),
        0
      );

      const directProfit = orders.reduce((sum, order) => {
        const orderProfit = order.items.reduce((itemSum, item) => {
          if (Number(item.totalProfit || 0) !== 0) {
            return itemSum + Number(item.totalProfit || 0);
          }

          const revenue =
            Number(item.pricePaid || 0) * Number(item.quantity || 0);

          return itemSum + revenue;
        }, 0);

        return sum + orderProfit;
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

      monthly.push({
        month: MONTHS[i],
        monthNumber: i + 1,

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

        counts: {
          orders: orders.length,
          loans: loans.length,
          payments: payments.length,
          expenses: expenses.length,
        },
      });
    }

    const summary = monthly.reduce(
      (acc, item) => {
        acc.directSales += item.directSales;
        acc.loanSales += item.loanSales;

        acc.downPaymentCollected += item.downPaymentCollected;
        acc.emiCollected += item.emiCollected;
        acc.lateFeeCollected += item.lateFeeCollected;

        acc.totalCollection += item.totalCollection;

        acc.directProfit += item.directProfit;
        acc.expectedLoanProfit += item.expectedLoanProfit;
        acc.grossProfit += item.grossProfit;

        acc.totalExpense += item.totalExpense;
        acc.netProfit += item.netProfit;

        return acc;
      },
      {
        directSales: 0,
        loanSales: 0,
        downPaymentCollected: 0,
        emiCollected: 0,
        lateFeeCollected: 0,
        totalCollection: 0,
        directProfit: 0,
        expectedLoanProfit: 0,
        grossProfit: 0,
        totalExpense: 0,
        netProfit: 0,
      }
    );

    return NextResponse.json({
      year,
      monthly,
      summary: {
        directSales: f2(summary.directSales),
        loanSales: f2(summary.loanSales),

        downPaymentCollected: f2(summary.downPaymentCollected),
        emiCollected: f2(summary.emiCollected),
        lateFeeCollected: f2(summary.lateFeeCollected),

        totalCollection: f2(summary.totalCollection),

        directProfit: f2(summary.directProfit),
        expectedLoanProfit: f2(summary.expectedLoanProfit),
        grossProfit: f2(summary.grossProfit),

        totalExpense: f2(summary.totalExpense),
        netProfit: f2(summary.netProfit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/monthly]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}