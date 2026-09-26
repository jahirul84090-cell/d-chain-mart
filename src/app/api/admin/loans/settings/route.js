import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authCheck";
import { LOAN_PLAN_RATES, getActiveLoanSettings } from "@/lib/loan-plans";

// Admin: GET — the active loan settings plus plan rates (defaults if none saved).
export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;
  try {
    const settings = await getActiveLoanSettings(prisma);
    return NextResponse.json({ settings, planRates: LOAN_PLAN_RATES });
  } catch (err) {
    console.error("[GET loan settings]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
