/**
 * File: app/api/admin/loans/[id]/reject/route.js
 *
 * POST /api/admin/loans/[id]/reject
 * Rejects any loan not already REJECTED/CANCELLED/COMPLETED.
 * adminNote (rejection reason) is required.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/loan-utils";
import { sendLoanEmail } from "@/lib/loan-email";

export async function POST(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const { adminNote } = await req.json();

    if (!adminNote?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason (adminNote) is required." },
        { status: 400 }
      );
    }

    const loan = await prisma.loanApplication.findUnique({
      where: { id },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    if (["REJECTED", "CANCELLED", "COMPLETED"].includes(loan.status)) {
      return NextResponse.json(
        { error: `Cannot reject status: ${loan.status}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.loanApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        adminNote: adminNote.trim(),
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    try {
      await sendLoanEmail({
        type: "REJECTED",
        loan: updated,
      });
    } catch (emailError) {
      console.error("[LOAN_REJECT_EMAIL_ERROR]", emailError);
    }

    return NextResponse.json({
      message: "Loan rejected.",
      loan: updated,
    });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/reject]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}