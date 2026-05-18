/**
 * File: app/api/admin/loans/[id]/route.js
 *
 * GET   /api/admin/loans/[id]
 *   Returns full loan detail including user, product, installments, payments, documents.
 *   Auto-marks UNPAID/PARTIAL installments whose due date has passed as OVERDUE
 *   and applies the configured lateFee before returning.
 *   Also attaches computed fields: totalCollected, totalOutstanding.
 *
 * PATCH /api/admin/loans/[id]
 *   Edits admin note, interest rate, tenure, lateFee, or gracePeriodDays.
 *   Only allowed when status is PENDING or REVIEWING.
 *   Automatically recalculates monthlyEmi and totalPayable when rate/tenure changes.
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser, calcEmi, f2 } from "@/lib/loan-utils";

// ─── Shared include shape ─────────────────────────────────────────────────────

const LOAN_INCLUDE = {
  user: {
    select: {
      id: true, name: true, email: true, image: true, createdAt: true,
      addresses: { take: 1, orderBy: { isDefault: "desc" } },
    },
  },
  product: {
    select: {
      id: true, name: true, mainImage: true, slug: true, price: true,
      category: { select: { name: true } },
    },
  },
  order: {
    select: { id: true, transactionNumber: true, status: true, isPaid: true },
  },
  installments: { orderBy: { installmentNo: "asc" } },
  documents:    true,
  payments: {
    orderBy: { createdAt: "desc" },
    include: {
      installment: { select: { installmentNo: true, dueDate: true, amount: true } },
    },
  },
};

// ─── Enrich loan with computed fields ────────────────────────────────────────

function enrichLoan(loan) {
  const totalCollected = (loan.payments || [])
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = (loan.installments || [])
    .reduce((sum, i) => sum + (i.remainingAmount || 0), 0);

  return {
    ...loan,
    totalCollected:   f2(totalCollected),
    totalOutstanding: f2(totalOutstanding),
  };
}

// ─── GET /api/admin/loans/[id] ────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    let loan = await prisma.loanApplication.findUnique({
      where:   { id: params.id },
      include: LOAN_INCLUDE,
    });

    if (!loan)
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    // ── Auto-mark overdue ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toOverdue = (loan.installments || []).filter(
      (i) => ["UNPAID", "PARTIAL"].includes(i.status) && new Date(i.dueDate) < today
    );

    if (toOverdue.length > 0) {
      await Promise.all(
        toOverdue.map((i) =>
          prisma.installmentPayment.update({
            where: { id: i.id },
            data:  {
              status:          "OVERDUE",
              lateFee:         i.lateFee > 0 ? i.lateFee : loan.lateFee,
              remainingAmount: f2(
                Math.max(0, i.amount + (i.lateFee > 0 ? i.lateFee : loan.lateFee) - i.paidAmount)
              ),
            },
          })
        )
      );

      // Re-fetch with fresh overdue data
      loan = await prisma.loanApplication.findUnique({
        where:   { id: params.id },
        include: LOAN_INCLUDE,
      });
    }

    return NextResponse.json({ loan: enrichLoan(loan) });
  } catch (err) {
    console.error("[GET /api/admin/loans/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─── PATCH /api/admin/loans/[id] ──────────────────────────────────────────────

export async function PATCH(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await req.json();
    const { adminNote, interestRate, tenureMonths, lateFee, gracePeriodDays } = body;

    const loan = await prisma.loanApplication.findUnique({ where: { id: params.id } });
    if (!loan)
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    if (!["PENDING", "REVIEWING"].includes(loan.status))
      return NextResponse.json(
        { error: `Cannot edit a loan with status: ${loan.status}. Only PENDING or REVIEWING loans can be modified.` },
        { status: 400 }
      );

    // ── Validate editable fields ──
    if (interestRate !== undefined && (isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0))
      return NextResponse.json({ error: "interestRate must be a non-negative number." }, { status: 400 });

    if (tenureMonths !== undefined && ![3,6,9,12,18,24,36].includes(parseInt(tenureMonths)))
      return NextResponse.json({ error: "Invalid tenureMonths." }, { status: 400 });

    if (lateFee !== undefined && (isNaN(parseFloat(lateFee)) || parseFloat(lateFee) < 0))
      return NextResponse.json({ error: "lateFee must be a non-negative number." }, { status: 400 });

    // ── Recalculate EMI if rate or tenure changed ──
    let recalc = {};
    if (interestRate !== undefined || tenureMonths !== undefined) {
      const rate   = parseFloat(interestRate  ?? loan.interestRate);
      const tenure = parseInt(tenureMonths    ?? loan.tenureMonths);
      const emi    = calcEmi(loan.loanAmount, rate, tenure);
      recalc = {
        interestRate: rate,
        tenureMonths: tenure,
        monthlyEmi:   f2(emi),
        totalPayable: f2(emi * tenure + loan.downPayment),
      };
    }

    const updated = await prisma.loanApplication.update({
      where: { id: params.id },
      data:  {
        ...(adminNote       !== undefined && { adminNote: adminNote.trim() }),
        ...(lateFee         !== undefined && { lateFee: parseFloat(lateFee) }),
        ...(gracePeriodDays !== undefined && { gracePeriodDays: parseInt(gracePeriodDays) }),
        ...recalc,
        status: "REVIEWING",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Loan updated successfully.",
      loan:    updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/loans/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}