import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOAN_PLAN_RATES, getActiveLoanSettings } from "@/lib/loan-plans";

// GET — the active loan settings plus plan rates (defaults if none saved).
export async function GET() {
  try {
    const settings = await getActiveLoanSettings(prisma);
    return NextResponse.json({ settings, planRates: LOAN_PLAN_RATES });
  } catch (err) {
    console.error("[GET loan settings]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
