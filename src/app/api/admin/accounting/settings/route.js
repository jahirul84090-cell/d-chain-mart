/**
 * File: app/api/admin/accounting/settings/route.js
 *
 * GET  /api/admin/accounting/settings
 * PATCH /api/admin/accounting/settings
 *
 * Admin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2 } from "@/lib/loan-utils";

async function requireAdmin() {
  const current = await getCurrentUser();

  if (!current) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!isAdminUser(current)) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { current };
}

const DEFAULT_SETTINGS = {
  minDownPaymentPct: 0,
  defaultInterest: 10,
  defaultTenure: 12,
  firstEmiDelayDays: 30,
  gracePeriodDays: 3,
  lateFee: 100,
  isActive: true,

  lowStockLimit: 5,
  autoOverdueEnabled: true,
};

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const setting = await prisma.loanSetting.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      settings: {
        ...DEFAULT_SETTINGS,
        ...(setting || {}),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/settings]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();

    const minDownPaymentPct = Number(body.minDownPaymentPct);
    const defaultInterest = Number(body.defaultInterest);
    const defaultTenure = Number(body.defaultTenure);
    const firstEmiDelayDays = Number(body.firstEmiDelayDays);
    const gracePeriodDays = Number(body.gracePeriodDays);
    const lateFee = Number(body.lateFee);

    if (isNaN(minDownPaymentPct) || minDownPaymentPct < 0 || minDownPaymentPct > 95) {
      return NextResponse.json(
        { error: "minDownPaymentPct must be between 0 and 95." },
        { status: 400 }
      );
    }

    if (isNaN(defaultInterest) || defaultInterest < 0 || defaultInterest > 100) {
      return NextResponse.json(
        { error: "defaultInterest must be between 0 and 100." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(defaultTenure) || defaultTenure <= 0 || defaultTenure > 60) {
      return NextResponse.json(
        { error: "defaultTenure must be between 1 and 60 months." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(firstEmiDelayDays) ||
      firstEmiDelayDays < 0 ||
      firstEmiDelayDays > 365
    ) {
      return NextResponse.json(
        { error: "firstEmiDelayDays must be between 0 and 365." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(gracePeriodDays) ||
      gracePeriodDays < 0 ||
      gracePeriodDays > 60
    ) {
      return NextResponse.json(
        { error: "gracePeriodDays must be between 0 and 60." },
        { status: 400 }
      );
    }

    if (isNaN(lateFee) || lateFee < 0) {
      return NextResponse.json(
        { error: "lateFee must be 0 or greater." },
        { status: 400 }
      );
    }

    await prisma.loanSetting.updateMany({
      where: {
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const setting = await prisma.loanSetting.create({
      data: {
        minDownPaymentPct: f2(minDownPaymentPct),
        defaultInterest: f2(defaultInterest),
        defaultTenure,
        firstEmiDelayDays,
        gracePeriodDays,
        lateFee: f2(lateFee),
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Accounting settings updated successfully.",
      settings: {
        ...DEFAULT_SETTINGS,
        ...setting,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/accounting/settings]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}