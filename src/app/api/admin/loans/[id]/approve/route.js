/**
 * File: app/api/admin/loans/[id]/approve/route.js
 *
 * POST /api/admin/loans/[id]/approve
 *
 * Approves PENDING or REVIEWING loan.
 * Atomically removes old installments and generates new schedule.
 * Supports optional customSchedule: [{ dueDate, amount }]
 * Status → DOWN_PAYMENT_PENDING
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser, addMonths, f2 } from "@/lib/loan-utils";

export async function POST(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { adminNote, loanStartDate, customSchedule } = await req.json();

    const loan = await prisma.loanApplication.findUnique({ where: { id: params.id } });
    if (!loan) return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    if (!["PENDING", "REVIEWING"].includes(loan.status))
      return NextResponse.json({ error: `Cannot approve status: ${loan.status}.` }, { status: 400 });

    if (Array.isArray(customSchedule) && customSchedule.length > 0) {
      if (customSchedule.length !== loan.tenureMonths)
        return NextResponse.json(
          { error: `Custom schedule has ${customSchedule.length} rows but tenure is ${loan.tenureMonths}.` },
          { status: 400 }
        );
      for (let i = 0; i < customSchedule.length; i++) {
        const r = customSchedule[i];
        if (!r.dueDate || isNaN(new Date(r.dueDate).getTime()))
          return NextResponse.json({ error: `Row ${i + 1}: invalid dueDate.` }, { status: 400 });
        if (!r.amount || parseFloat(r.amount) <= 0)
          return NextResponse.json({ error: `Row ${i + 1}: amount must be > 0.` }, { status: 400 });
      }
    }

    const startDate    = loanStartDate ? new Date(loanStartDate) : new Date();
    const firstDueDate = new Date(startDate);
    firstDueDate.setDate(firstDueDate.getDate() + (loan.firstEmiDelayDays || 30));

    const installments = Array.isArray(customSchedule) && customSchedule.length > 0
      ? customSchedule.map((row, idx) => {
          const amt = f2(row.amount);
          return { loanApplicationId: loan.id, installmentNo: idx + 1, dueDate: new Date(row.dueDate), originalDueDate: new Date(row.dueDate), amount: amt, paidAmount: 0, remainingAmount: amt, lateFee: 0, status: "UNPAID" };
        })
      : Array.from({ length: loan.tenureMonths }, (_, i) => {
          const due = addMonths(firstDueDate, i);
          return { loanApplicationId: loan.id, installmentNo: i + 1, dueDate: new Date(due), originalDueDate: new Date(due), amount: loan.monthlyEmi, paidAmount: 0, remainingAmount: loan.monthlyEmi, lateFee: 0, status: "UNPAID" };
        });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.installmentPayment.deleteMany({ where: { loanApplicationId: loan.id } });
      await tx.installmentPayment.createMany({ data: installments });
      return tx.loanApplication.update({
        where: { id: loan.id },
        data:  { status: "DOWN_PAYMENT_PENDING", approvedAt: new Date(), loanStartDate: startDate, firstDueDate, ...(adminNote?.trim() && { adminNote: adminNote.trim() }) },
      });
    });

    return NextResponse.json({ message: "Approved. Awaiting down payment.", loan: updated, installmentCount: installments.length });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/approve]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}