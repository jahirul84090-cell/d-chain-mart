/**
 * File: app/api/admin/accounting/loans/route.js
 *
 * GET /api/admin/accounting/loans
 *
 * Admin only.
 * Loan-wise accounting report.
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

    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const range = parseDateRange(searchParams);

    if (range.error) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const where = {
      ...(status ? { status } : {}),
      ...(range.start || range.end
        ? {
            appliedAt: {
              ...(range.start ? { gte: range.start } : {}),
              ...(range.end ? { lte: range.end } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { applicantName: { contains: q } },
              { nomineePhone: { contains: q } },
              { nidNumber: { contains: q } },
              {
                product: {
                  name: {
                    contains: q,
                  },
                },
              },
              {
                user: {
                  email: {
                    contains: q,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [loans, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              mainImage: true,
            },
          },
          payments: {
            where: {
              status: "SUCCESS",
            },
            select: {
              paymentType: true,
              amount: true,
            },
          },
          installments: {
            select: {
              status: true,
              remainingAmount: true,
              dueDate: true,
              lateFee: true,
            },
          },
        },
        orderBy: {
          appliedAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.loanApplication.count({ where }),
    ]);

    const mappedLoans = loans.map((loan) => {
      const downPaymentCollected = loan.payments
        .filter((p) => p.paymentType === "DOWN_PAYMENT")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const emiCollected = loan.payments
        .filter((p) => p.paymentType === "INSTALLMENT")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const lateFeeCollected = loan.payments
        .filter((p) => p.paymentType === "LATE_FEE")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const totalCollected =
        downPaymentCollected + emiCollected + lateFeeCollected;

      const outstanding = loan.installments.reduce((sum, inst) => {
        return sum + Number(inst.remainingAmount || 0);
      }, 0);

      const overdueAmount = loan.installments
        .filter((inst) => inst.status === "OVERDUE")
        .reduce((sum, inst) => sum + Number(inst.remainingAmount || 0), 0);

      const paidInstallments = loan.installments.filter((inst) =>
        ["PAID", "WAIVED"].includes(inst.status)
      ).length;

      const totalInstallments = loan.installments.length;

      return {
        id: loan.id,
        status: loan.status,
        appliedAt: loan.appliedAt,

        customer: {
          id: loan.user?.id,
          name: loan.user?.name || loan.applicantName,
          email: loan.user?.email,
        },

        product: loan.product,

        productPrice: f2(loan.productPrice),
        productBuyingPrice: f2(loan.productBuyingPrice),

        downPayment: f2(loan.downPayment),
        downPaymentPaid: f2(loan.downPaymentPaid),

        loanAmount: f2(loan.loanAmount),
        interestRate: f2(loan.interestRate),
        tenureMonths: loan.tenureMonths,
        monthlyEmi: f2(loan.monthlyEmi),
        totalPayable: f2(loan.totalPayable),

        productProfit: f2(loan.productProfit),
        interestProfit: f2(loan.interestProfit),
        expectedProfit: f2(loan.expectedProfit),

        downPaymentCollected: f2(downPaymentCollected),
        emiCollected: f2(emiCollected),
        lateFeeCollected: f2(lateFeeCollected),
        totalCollected: f2(totalCollected),

        outstanding: f2(outstanding),
        overdueAmount: f2(overdueAmount),

        paidInstallments,
        totalInstallments,
      };
    });

    const summary = mappedLoans.reduce(
      (acc, loan) => {
        acc.productPrice += loan.productPrice;
        acc.productBuyingPrice += loan.productBuyingPrice;
        acc.loanAmount += loan.loanAmount;
        acc.totalPayable += loan.totalPayable;

        acc.downPaymentCollected += loan.downPaymentCollected;
        acc.emiCollected += loan.emiCollected;
        acc.lateFeeCollected += loan.lateFeeCollected;
        acc.totalCollected += loan.totalCollected;

        acc.productProfit += loan.productProfit;
        acc.interestProfit += loan.interestProfit;
        acc.expectedProfit += loan.expectedProfit;

        acc.outstanding += loan.outstanding;
        acc.overdueAmount += loan.overdueAmount;

        return acc;
      },
      {
        productPrice: 0,
        productBuyingPrice: 0,
        loanAmount: 0,
        totalPayable: 0,

        downPaymentCollected: 0,
        emiCollected: 0,
        lateFeeCollected: 0,
        totalCollected: 0,

        productProfit: 0,
        interestProfit: 0,
        expectedProfit: 0,

        outstanding: 0,
        overdueAmount: 0,
      }
    );

    return NextResponse.json({
      range: {
        from: range.start,
        to: range.end,
      },
      loans: mappedLoans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        productPrice: f2(summary.productPrice),
        productBuyingPrice: f2(summary.productBuyingPrice),
        loanAmount: f2(summary.loanAmount),
        totalPayable: f2(summary.totalPayable),

        downPaymentCollected: f2(summary.downPaymentCollected),
        emiCollected: f2(summary.emiCollected),
        lateFeeCollected: f2(summary.lateFeeCollected),
        totalCollected: f2(summary.totalCollected),

        productProfit: f2(summary.productProfit),
        interestProfit: f2(summary.interestProfit),
        expectedProfit: f2(summary.expectedProfit),

        outstanding: f2(summary.outstanding),
        overdueAmount: f2(summary.overdueAmount),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/loans]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}