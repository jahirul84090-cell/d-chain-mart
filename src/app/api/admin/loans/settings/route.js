/**
 * File: app/api/loans/settings/route.js
 *
 * GET /api/loans/settings — Returns the active LoanSetting record.
 *   Used by the apply page frontend to show correct min down payment %,
 *   interest rate, tenure options, and late fee to the user.
 *   Falls back to safe defaults if no active setting exists in DB.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/loans/settings ──────────────────────────────────────────────────

export async function GET() {
  try {
    const setting = await prisma.loanSetting.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({
      settings: setting ?? {
        minDownPaymentPct: 30,
        defaultInterest:   10,
        defaultTenure:     12,
        firstEmiDelayDays: 30,
        gracePeriodDays:   3,
        lateFee:           100,
        isActive:          true,
      },
    });
  } catch (err) {
    console.error("[GET /api/loans/settings]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}