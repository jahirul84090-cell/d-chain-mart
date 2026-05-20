/**
 * File: app/api/loans/settings/route.js
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  minDownPaymentPct: 0,
  defaultInterest: 10,
  defaultTenure: 3,
  firstEmiDelayDays: 30,
  gracePeriodDays: 3,
  lateFee: 100,
  isActive: true,
};

export async function GET() {
  try {
    const setting = await prisma.loanSetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      settings: setting
        ? {
            ...DEFAULTS,
            ...setting,
          }
        : DEFAULTS,
    });
  } catch (err) {
    console.error("[GET /api/loans/settings]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}