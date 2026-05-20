/**
 * File: app/api/admin/loans/[id]/approve/route.js
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, addMonths, f2 } from "@/lib/loan-utils";

export async function POST(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const { adminNote, loanStartDate, customSchedule } = await req.json();

    const loan = await prisma.loanApplication.findUnique({
      where: { id },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    if (!["PENDING", "REVIEWING"].includes(loan.status)) {
      return NextResponse.json(
        { error: `Cannot approve status: ${loan.status}.` },
        { status: 400 }
      );
    }

    const installmentTotal = f2(Number(loan.totalPayable) - Number(loan.downPayment));

    if (installmentTotal <= 0) {
      return NextResponse.json(
        { error: "Invalid installment total. Check totalPayable and downPayment." },
        { status: 400 }
      );
    }

    if (Array.isArray(customSchedule) && customSchedule.length > 0) {
      if (customSchedule.length !== loan.tenureMonths) {
        return NextResponse.json(
          {
            error: `Custom schedule has ${customSchedule.length} rows but tenure is ${loan.tenureMonths}.`,
          },
          { status: 400 }
        );
      }

      for (let i = 0; i < customSchedule.length; i++) {
        const row = customSchedule[i];

        if (!row.dueDate || isNaN(new Date(row.dueDate).getTime())) {
          return NextResponse.json(
            { error: `Row ${i + 1}: invalid dueDate.` },
            { status: 400 }
          );
        }

        if (!row.amount || Number(row.amount) <= 0) {
          return NextResponse.json(
            { error: `Row ${i + 1}: amount must be > 0.` },
            { status: 400 }
          );
        }
      }

      const customTotal = f2(
        customSchedule.reduce((sum, row) => sum + Number(row.amount || 0), 0)
      );

      if (Math.abs(customTotal - installmentTotal) > 0.01) {
        return NextResponse.json(
          {
            error: `Custom schedule total must be ৳${installmentTotal}. Current total is ৳${customTotal}.`,
          },
          { status: 400 }
        );
      }
    }

    const startDate = loanStartDate ? new Date(loanStartDate) : new Date();

    const firstDueDate = new Date(startDate);
    firstDueDate.setDate(
      firstDueDate.getDate() + Number(loan.firstEmiDelayDays || 30)
    );

    const installments =
      Array.isArray(customSchedule) && customSchedule.length > 0
        ? customSchedule.map((row, index) => {
            const amount = f2(row.amount);

            return {
              loanApplicationId: loan.id,
              installmentNo: index + 1,
              dueDate: new Date(row.dueDate),
              originalDueDate: new Date(row.dueDate),
              amount,
              paidAmount: 0,
              remainingAmount: amount,
              lateFee: 0,
              status: "UNPAID",
            };
          })
        : Array.from({ length: loan.tenureMonths }, (_, index) => {
            const dueDate = addMonths(firstDueDate, index);
            const amount = f2(loan.monthlyEmi);

            return {
              loanApplicationId: loan.id,
              installmentNo: index + 1,
              dueDate: new Date(dueDate),
              originalDueDate: new Date(dueDate),
              amount,
              paidAmount: 0,
              remainingAmount: amount,
              lateFee: 0,
              status: "UNPAID",
            };
          });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.installmentPayment.deleteMany({
        where: { loanApplicationId: loan.id },
      });

      await tx.installmentPayment.createMany({
        data: installments,
      });

      return tx.loanApplication.update({
        where: { id: loan.id },
        data: {
          status: "DOWN_PAYMENT_PENDING",
          approvedAt: new Date(),
          loanStartDate: startDate,
          firstDueDate,
          ...(adminNote?.trim() && {
            adminNote: adminNote.trim(),
          }),
        },
      });
    });

    return NextResponse.json({
      message: "Approved. Awaiting down payment.",
      loan: updated,
      installmentCount: installments.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/approve]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}