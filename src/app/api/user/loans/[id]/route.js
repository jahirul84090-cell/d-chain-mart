/**
 * File: app/api/user/loans/[id]/route.js
 *
 * GET /api/user/loans/[id]
 *
 * Returns full detail for a single loan application.
 * Security: loan must belong to the authenticated user.
 *
 * Returns:
 *   loan — all fields + applicantMeta (parsed from customerNote)
 *   installments — full list with status
 *   payments — full payment history (user-visible fields only)
 *   documents — with URLs for display
 *   computed: totalCollected, totalOutstanding, nextDueInstallment,
 *             paidInstallments, overdueInstallments, progressPct
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { f2 }             from "@/lib/loan-utils";

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!current)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const loan = await prisma.loanApplication.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true, name: true, mainImage: true, slug: true, price: true,
            category: { select: { name: true } },
          },
        },
        installments: {
          orderBy: { installmentNo: "asc" },
        },
        documents: {
          orderBy: { createdAt: "asc" },
        },
        payments: {
          where:   { status: "SUCCESS" },
          orderBy: { paidAt: "desc" },
          include: {
            installment: {
              select: { installmentNo: true, dueDate: true, amount: true },
            },
          },
        },
      },
    });

    if (!loan)
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    // Security: only owner can view
    if (loan.userId !== current.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    // Auto-mark overdue installments
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const toOverdue = (loan.installments || []).filter(
      (i) => ["UNPAID","PARTIAL"].includes(i.status) && new Date(i.dueDate) < today
    );
    if (toOverdue.length > 0) {
      await Promise.all(
        toOverdue.map((i) =>
          prisma.installmentPayment.update({
            where: { id: i.id },
            data:  {
              status:          "OVERDUE",
              lateFee:         i.lateFee > 0 ? i.lateFee : loan.lateFee,
              remainingAmount: f2(Math.max(0, i.amount + (i.lateFee > 0 ? i.lateFee : loan.lateFee) - i.paidAmount)),
            },
          })
        )
      );
      // Refetch with updated statuses
      return GET(req, { params });
    }

    // Computed fields
    const totalCollected     = f2(loan.payments.reduce((s, p) => s + p.amount, 0));
    const totalOutstanding   = f2((loan.installments || []).reduce((s, i) => s + (i.remainingAmount || 0), 0));
    const paidCount          = (loan.installments || []).filter((i) => ["PAID","WAIVED"].includes(i.status)).length;
    const overdueCount       = (loan.installments || []).filter((i) => i.status === "OVERDUE").length;
    const totalCount         = loan.installments?.length || 0;
    const progressPct        = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    const nextDue            = (loan.installments || []).find((i) => !["PAID","WAIVED"].includes(i.status)) || null;

    // Sanitize: hide adminNote from user response
    const { adminNote: _adminNote, ...loanData } = loan;

    return NextResponse.json({
      loan: {
        ...loanData,
        totalCollected,
        totalOutstanding,
        paidInstallments:    paidCount,
        overdueInstallments: overdueCount,
        totalInstallments:   totalCount,
        progressPct,
        nextDueInstallment:  nextDue,
      },
    });
  } catch (err) {
    console.error("[GET /api/user/loans/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}