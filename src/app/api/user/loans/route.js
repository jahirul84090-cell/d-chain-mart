/**
 * File: app/api/user/loans/route.js
 *
 * GET /api/user/loans
 *
 * Returns all loan applications for the authenticated user.
 * Each loan includes: product, installments, documents, payments summary,
 * computed totalCollected, totalOutstanding, nextDueInstallment.
 *
 * Query params:
 *   status — optional filter by LoanStatus
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { f2 }             from "@/lib/loan-utils";
import { withSignedDocuments } from "@/lib/loan-documents";

export async function GET(req) {
  try {
    const current = await getCurrentUser();
    if (!current)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const loans = await prisma.loanApplication.findMany({
      where: {
        userId: current.id,
        ...(status ? { status } : {}),
      },
      include: {
        product: {
          select: {
            id: true, name: true, mainImage: true, slug: true,
            category: { select: { name: true } },
          },
        },
        installments: {
          orderBy: { installmentNo: "asc" },
          select: {
            id: true, installmentNo: true, dueDate: true,
            amount: true, paidAmount: true, remainingAmount: true,
            lateFee: true, status: true, paidAt: true,
          },
        },
        documents: {
          select: { id: true, type: true, url: true, title: true, createdAt: true },
        },
        payments: {
          where:   { status: "SUCCESS" },
          select:  { id: true, amount: true, paymentType: true, paymentMethod: true, paidAt: true, transactionNumber: true },
          orderBy: { paidAt: "desc" },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    // Enrich each loan
    const enriched = loans.map((loan) => {
      const totalCollected   = f2(loan.payments.reduce((s, p) => s + p.amount, 0));
      const totalOutstanding = f2((loan.installments || []).reduce((s, i) => s + (i.remainingAmount || 0), 0));
      const paidCount        = (loan.installments || []).filter((i) => ["PAID","WAIVED"].includes(i.status)).length;
      const overdueCount     = (loan.installments || []).filter((i) => i.status === "OVERDUE").length;
      const nextDue          = (loan.installments || []).find((i) => !["PAID","WAIVED"].includes(i.status)) || null;

      return {
        ...withSignedDocuments(loan),
        totalCollected,
        totalOutstanding,
        paidInstallments:  paidCount,
        overdueInstallments: overdueCount,
        totalInstallments: loan.installments?.length || 0,
        nextDueInstallment: nextDue,
        // Don't expose raw payments list on the list endpoint — only summary
        paymentCount: loan.payments.length,
        payments: undefined,
      };
    });

    return NextResponse.json({ loans: enriched });
  } catch (err) {
    console.error("[GET /api/user/loans]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}