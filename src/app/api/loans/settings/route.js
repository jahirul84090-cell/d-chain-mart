/**
 * File: app/api/loans/settings/route.js
 *
 * GET /api/loans/settings
 *
 * Returns the active LoanSetting record used by the apply page frontend.
 * Falls back to safe production defaults if no active setting exists in DB.
 * Public endpoint — no auth required (settings are not sensitive).
 */

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

// ─── Safe defaults (mirrors Prisma schema defaults) ──────────────────────────

const DEFAULTS = {
  minDownPaymentPct: 30,
  defaultInterest:   10,
  defaultTenure:     12,
  firstEmiDelayDays: 30,
  gracePeriodDays:   3,
  lateFee:           100,
  isActive:          true,
};

// ─── GET /api/loans/settings ──────────────────────────────────────────────────

export async function GET() {
  try {
    const setting = await prisma.loanSetting.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({ settings: setting ?? DEFAULTS });
  } catch (err) {
    console.error("[GET /api/loans/settings]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}