/**
 * File: app/api/admin/loans/[id]/route.js
 *
 * GET   /api/admin/loans/[id]  — Full loan detail. Auto-marks overdue installments.
 *                                Parses applicant/nominee meta from customerNote JSON.
 *                                Returns computed totalCollected, totalOutstanding.
 * PATCH /api/admin/loans/[id]  — Edit note/interest/tenure/lateFee/gracePeriodDays.
 *                                Only for PENDING or REVIEWING status.
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser, calcEmi, f2 } from "@/lib/loan-utils";

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
  order: { select: { id: true, transactionNumber: true, status: true, isPaid: true } },
  installments: { orderBy: { installmentNo: "asc" } },
  documents:    true,
  payments: {
    orderBy: { createdAt: "desc" },
    include: { installment: { select: { installmentNo: true, dueDate: true, amount: true } } },
  },
};

function enrichLoan(loan) {
  const totalCollected   = (loan.payments || []).filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = (loan.installments || []).reduce((s, i) => s + (i.remainingAmount || 0), 0);

  // Parse structured meta from customerNote
  let applicantMeta = null;
  try {
    if (loan.customerNote && loan.customerNote.startsWith("{"))
      applicantMeta = JSON.parse(loan.customerNote);
  } catch { /* ignore */ }

  return {
    ...loan,
    totalCollected:   f2(totalCollected),
    totalOutstanding: f2(totalOutstanding),
    applicantMeta,    // { applicantName, applicantAddress, nominee, userNote }
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    let loan = await prisma.loanApplication.findUnique({
      where: { id: params.id }, include: LOAN_INCLUDE,
    });
    if (!loan) return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    // Auto-mark overdue
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const toOverdue = (loan.installments || []).filter(
      (i) => ["UNPAID", "PARTIAL"].includes(i.status) && new Date(i.dueDate) < today
    );

    if (toOverdue.length > 0) {
      await Promise.all(toOverdue.map((i) =>
        prisma.installmentPayment.update({
          where: { id: i.id },
          data:  {
            status:          "OVERDUE",
            lateFee:         i.lateFee > 0 ? i.lateFee : loan.lateFee,
            remainingAmount: f2(Math.max(0, i.amount + (i.lateFee > 0 ? i.lateFee : loan.lateFee) - i.paidAmount)),
          },
        })
      ));
      loan = await prisma.loanApplication.findUnique({ where: { id: params.id }, include: LOAN_INCLUDE });
    }

    return NextResponse.json({ loan: enrichLoan(loan) });
  } catch (err) {
    console.error("[GET /api/admin/loans/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await req.json();
    const { adminNote, interestRate, tenureMonths, lateFee, gracePeriodDays } = body;

    const loan = await prisma.loanApplication.findUnique({ where: { id: params.id } });
    if (!loan) return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    if (!["PENDING", "REVIEWING"].includes(loan.status))
      return NextResponse.json(
        { error: `Cannot edit a loan with status: ${loan.status}.` },
        { status: 400 }
      );

    let recalc = {};
    if (interestRate !== undefined || tenureMonths !== undefined) {
      const rate   = parseFloat(interestRate  ?? loan.interestRate);
      const tenure = parseInt(tenureMonths    ?? loan.tenureMonths);
      if (![3,6,9,12,18,24,36].includes(tenure))
        return NextResponse.json({ error: "Invalid tenureMonths." }, { status: 400 });
      const emi = calcEmi(loan.loanAmount, rate, tenure);
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
      },
    });

    return NextResponse.json({ message: "Loan updated.", loan: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/loans/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}