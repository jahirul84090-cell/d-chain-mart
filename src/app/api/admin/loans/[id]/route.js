/**
 * File: app/api/admin/loans/[id]/route.js
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import {
  isAdminUser,
  calcFlatProductPriceEmi,
  f2,
} from "@/lib/loan-utils";

const LOAN_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      addresses: {
        take: 1,
        orderBy: { isDefault: "desc" },
      },
    },
  },
  product: {
    select: {
      id: true,
      name: true,
      mainImage: true,
      slug: true,
      price: true,
      category: {
        select: { name: true },
      },
    },
  },
  order: {
    select: {
      id: true,
      transactionNumber: true,
      status: true,
      isPaid: true,
    },
  },
  installments: {
    orderBy: { installmentNo: "asc" },
  },
  documents: true,
  payments: {
    orderBy: { createdAt: "desc" },
    include: {
      installment: {
        select: {
          installmentNo: true,
          dueDate: true,
          amount: true,
        },
      },
    },
  },
};

function enrichLoan(loan) {
  const totalCollected = (loan.payments || [])
    .filter((payment) => payment.status === "SUCCESS")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalOutstanding = (loan.installments || []).reduce(
    (sum, installment) => sum + Number(installment.remainingAmount || 0),
    0
  );

  let applicantMeta = null;

  try {
    if (loan.customerNote && loan.customerNote.startsWith("{")) {
      applicantMeta = JSON.parse(loan.customerNote);
    }
  } catch {
    applicantMeta = null;
  }

  return {
    ...loan,
    totalCollected: f2(totalCollected),
    totalOutstanding: f2(totalOutstanding),
    applicantMeta,
  };
}

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    let loan = await prisma.loanApplication.findUnique({
      where: { id },
      include: LOAN_INCLUDE,
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toOverdue = (loan.installments || []).filter(
      (installment) =>
        ["UNPAID", "PARTIAL"].includes(installment.status) &&
        new Date(installment.dueDate) < today
    );

    if (toOverdue.length > 0) {
      await Promise.all(
        toOverdue.map((installment) =>
          prisma.installmentPayment.update({
            where: { id: installment.id },
            data: {
              status: "OVERDUE",
              lateFee:
                installment.lateFee > 0
                  ? installment.lateFee
                  : loan.lateFee,
              remainingAmount: f2(
                Math.max(
                  0,
                  Number(installment.amount) +
                    Number(installment.lateFee > 0 ? installment.lateFee : loan.lateFee) -
                    Number(installment.paidAmount)
                )
              ),
            },
          })
        )
      );

      loan = await prisma.loanApplication.findUnique({
        where: { id },
        include: LOAN_INCLUDE,
      });
    }

    return NextResponse.json({
      loan: enrichLoan(loan),
    });
  } catch (err) {
    console.error("[GET /api/admin/loans/[id]]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const body = await req.json();

    const {
      adminNote,
      interestRate,
      tenureMonths,
      lateFee,
      gracePeriodDays,
    } = body;

    const loan = await prisma.loanApplication.findUnique({
      where: { id },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    if (!["PENDING", "REVIEWING"].includes(loan.status)) {
      return NextResponse.json(
        { error: `Cannot edit a loan with status: ${loan.status}.` },
        { status: 400 }
      );
    }

    let recalc = {};

    if (interestRate !== undefined || tenureMonths !== undefined) {
      const rate = Number(interestRate ?? loan.interestRate);
      const tenure = Number(tenureMonths ?? loan.tenureMonths);

      if (![3, 6].includes(tenure)) {
        return NextResponse.json(
          { error: "Invalid tenureMonths. Allowed: 3, 6." },
          { status: 400 }
        );
      }

      if (Number.isNaN(rate) || rate < 0) {
        return NextResponse.json(
          { error: "Invalid interestRate." },
          { status: 400 }
        );
      }

      const result = calcFlatProductPriceEmi(
        Number(loan.productPrice),
        Number(loan.downPayment),
        rate,
        tenure
      );

      recalc = {
        interestRate: rate,
        tenureMonths: tenure,
        monthlyEmi: result.monthlyEmi,
        totalPayable: result.totalPayable,
      };
    }

    const updated = await prisma.loanApplication.update({
      where: { id },
      data: {
        ...(adminNote !== undefined && {
          adminNote: adminNote?.trim() || null,
        }),
        ...(lateFee !== undefined && {
          lateFee: Number(lateFee),
        }),
        ...(gracePeriodDays !== undefined && {
          gracePeriodDays: Number(gracePeriodDays),
        }),
        ...recalc,
        status: "REVIEWING",
      },
    });

    return NextResponse.json({
      message: "Loan updated.",
      loan: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/loans/[id]]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}