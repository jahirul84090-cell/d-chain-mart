/**
 * File: app/api/admin/loans/[id]/reject/route.js
 *
 * POST /api/admin/loans/[id]/reject
 *
 * Rejects a loan that is not already REJECTED, CANCELLED, or COMPLETED.
 * Requires a non-empty rejection reason saved as adminNote.
 * Records the rejectedAt timestamp.
 *
 * Body:
 *   adminNote — string (required — rejection reason for audit trail)
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser }    from "@/lib/loan-utils";

// ─── POST /api/admin/loans/[id]/reject ───────────────────────────────────────

export async function POST(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await req.json();
    const { adminNote } = body;

    if (!adminNote?.trim())
      return NextResponse.json(
        { error: "A rejection reason is required (adminNote)." },
        { status: 400 }
      );

    const loan = await prisma.loanApplication.findUnique({
      where: { id: params.id },
    });

    if (!loan)
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    if (["REJECTED", "CANCELLED", "COMPLETED"].includes(loan.status))
      return NextResponse.json(
        { error: `Cannot reject a loan with status: ${loan.status}.` },
        { status: 400 }
      );

    const updated = await prisma.loanApplication.update({
      where: { id: params.id },
      data:  {
        status:     "REJECTED",
        rejectedAt: new Date(),
        adminNote:  adminNote.trim(),
      },
    });

    return NextResponse.json({
      message: "Loan application rejected.",
      loan:    updated,
    });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/reject]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}