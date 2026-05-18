/**
 * File: app/api/admin/loans/[id]/approve/route.js
 *
 * POST /api/admin/loans/[id]/approve
 *
 * Approves a PENDING or REVIEWING loan application.
 *
 * Behaviour:
 *  - Atomically deletes any previously generated installments (safe for re-approval).
 *  - Generates a full installment schedule using standard EMI,
 *    OR uses a custom schedule if provided by the admin.
 *  - Sets loan status → DOWN_PAYMENT_PENDING.
 *  - Records approvedAt timestamp.
 *
 * Body:
 *   adminNote      — string (optional, saved as internal note)
 *   loanStartDate  — "YYYY-MM-DD" (optional, defaults to today)
 *   customSchedule — optional array of { dueDate: "YYYY-MM-DD", amount: number }
 *                    If omitted, auto-generates from loan.monthlyEmi + firstEmiDelayDays.
 *                    If provided, its installment count must match loan.tenureMonths.
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser, addMonths, f2 } from "@/lib/loan-utils";

// ─── POST /api/admin/loans/[id]/approve ──────────────────────────────────────

export async function POST(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await req.json();
    const { adminNote, loanStartDate, customSchedule } = body;

    const loan = await prisma.loanApplication.findUnique({
      where: { id: params.id },
    });

    if (!loan)
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    if (!["PENDING", "REVIEWING"].includes(loan.status))
      return NextResponse.json(
        { error: `Cannot approve a loan with status: ${loan.status}.` },
        { status: 400 }
      );

    // ── Validate custom schedule if provided ──
    if (Array.isArray(customSchedule) && customSchedule.length > 0) {
      if (customSchedule.length !== loan.tenureMonths)
        return NextResponse.json(
          {
            error: `Custom schedule has ${customSchedule.length} rows but loan tenure is ${loan.tenureMonths} months. They must match.`,
          },
          { status: 400 }
        );

      for (let i = 0; i < customSchedule.length; i++) {
        const row = customSchedule[i];
        if (!row.dueDate || isNaN(new Date(row.dueDate).getTime()))
          return NextResponse.json(
            { error: `Row ${i + 1}: invalid dueDate "${row.dueDate}".` },
            { status: 400 }
          );
        if (!row.amount || parseFloat(row.amount) <= 0)
          return NextResponse.json(
            { error: `Row ${i + 1}: amount must be a positive number.` },
            { status: 400 }
          );
      }
    }

    // ── Date setup ──
    const startDate    = loanStartDate ? new Date(loanStartDate) : new Date();
    const firstDueDate = new Date(startDate);
    firstDueDate.setDate(firstDueDate.getDate() + (loan.firstEmiDelayDays || 30));

    // ── Build installment rows ──
    let installments;

    if (Array.isArray(customSchedule) && customSchedule.length > 0) {
      installments = customSchedule.map((row, idx) => {
        const amt = f2(row.amount);
        return {
          loanApplicationId: loan.id,
          installmentNo:     idx + 1,
          dueDate:           new Date(row.dueDate),
          originalDueDate:   new Date(row.dueDate),
          amount:            amt,
          paidAmount:        0,
          remainingAmount:   amt,
          lateFee:           0,
          status:            "UNPAID",
        };
      });
    } else {
      installments = Array.from({ length: loan.tenureMonths }, (_, i) => {
        const dueDate = addMonths(firstDueDate, i);
        return {
          loanApplicationId: loan.id,
          installmentNo:     i + 1,
          dueDate:           new Date(dueDate),
          originalDueDate:   new Date(dueDate),
          amount:            loan.monthlyEmi,
          paidAmount:        0,
          remainingAmount:   loan.monthlyEmi,
          lateFee:           0,
          status:            "UNPAID",
        };
      });
    }

    // ── Atomic transaction ──
    const updated = await prisma.$transaction(async (tx) => {
      await tx.installmentPayment.deleteMany({
        where: { loanApplicationId: loan.id },
      });
      await tx.installmentPayment.createMany({ data: installments });

      return tx.loanApplication.update({
        where: { id: loan.id },
        data:  {
          status:        "DOWN_PAYMENT_PENDING",
          approvedAt:    new Date(),
          loanStartDate: startDate,
          firstDueDate,
          ...(adminNote?.trim() && { adminNote: adminNote.trim() }),
        },
      });
    });

    return NextResponse.json({
      message:          "Loan approved. Awaiting down payment.",
      loan:             updated,
      installmentCount: installments.length,
      firstDueDate:     firstDueDate.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/approve]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}