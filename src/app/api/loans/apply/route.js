<<<<<<< HEAD
/**
 * File: app/api/loans/apply/route.js
 *
 * POST /api/loans/apply  — Submit a new loan application (authenticated user)
 * GET  /api/loans/apply  — List the current user's own loan applications
 *
 * Production validations (POST):
 *  - User must be authenticated
 *  - productId, downPayment, tenureMonths required
 *  - Product must exist and be active
 *  - Down payment rules (all enforced, watertight):
 *      • Must be a positive number
 *      • Cannot be >= product price (loan amount must be > 0)
 *      • Cannot exceed 95% of product price (use direct purchase instead)
 *      • Must be >= minDownPaymentPct% of product price (from LoanSetting)
 *  - No duplicate active loan for same user + product
 *  - tenureMonths must be one of the allowed values
 */

import { NextResponse }        from "next/server";
import { getCurrentUser }      from "@/lib/user";
import { prisma }              from "@/lib/prisma";
import {
  calcEmi,
  validateDownPayment,
  f2,
} from "@/lib/loan-utils";

// ─── Allowed tenure options ───────────────────────────────────────────────────

const ALLOWED_TENURES = [3, 6, 9, 12, 18, 24, 36];

// ─── POST /api/loans/apply ────────────────────────────────────────────────────

export async function POST(req) {
  try {
    // ── Auth ──
    const current = await getCurrentUser();
    if (!current)
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });

    const body = await req.json();
=======
// src/app/api/loans/apply/route.js

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const current = await getCurrentUser();

    if (!current?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await req.json();

>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
    const {
      productId,
      downPayment,
      tenureMonths,
<<<<<<< HEAD
      nidNumber,
      monthlyIncome,
      jobType,
      customerNote,
      documents, // [{ type, url, title }]
    } = body;

    // ── Required field check ──
    const missing = [];
    if (!productId)    missing.push("productId");
    if (!downPayment)  missing.push("downPayment");
    if (!tenureMonths) missing.push("tenureMonths");
    if (missing.length)
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 }
      );

    // ── Tenure validation ──
    const tenure = parseInt(tenureMonths);
    if (!ALLOWED_TENURES.includes(tenure))
      return NextResponse.json(
        { error: `Invalid tenureMonths. Allowed values: ${ALLOWED_TENURES.join(", ")} months.` },
        { status: 400 }
      );

    // ── NID format check (10 or 17 digits) ──
    if (nidNumber && !/^\d{10}$|^\d{17}$/.test(nidNumber.trim()))
      return NextResponse.json(
        { error: "NID number must be exactly 10 or 17 digits." },
        { status: 400 }
      );

    // ── Income check ──
    if (monthlyIncome !== undefined && monthlyIncome !== null) {
      const inc = parseFloat(monthlyIncome);
      if (isNaN(inc) || inc < 0)
        return NextResponse.json(
          { error: "monthlyIncome must be a non-negative number." },
          { status: 400 }
        );
    }

    // ── Fetch product ──
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: { id: true, name: true, price: true, stockAmount: true },
    });

    if (!product)
      return NextResponse.json(
        { error: "Product not found or is currently inactive." },
        { status: 404 }
      );

    if (product.stockAmount <= 0)
      return NextResponse.json(
        { error: "This product is currently out of stock." },
        { status: 400 }
      );

    // ── Fetch active loan settings ──
    const setting = await prisma.loanSetting.findFirst({ where: { isActive: true } });
    const cfg = {
      minDownPaymentPct: setting?.minDownPaymentPct ?? 30,
      defaultInterest:   setting?.defaultInterest   ?? 10,
      firstEmiDelayDays: setting?.firstEmiDelayDays ?? 30,
      gracePeriodDays:   setting?.gracePeriodDays   ?? 3,
      lateFee:           setting?.lateFee           ?? 100,
    };

    // ── Down payment validation (watertight) ──
    const dpError = validateDownPayment(
      parseFloat(downPayment),
      product.price,
      cfg.minDownPaymentPct
      // maxDownPaymentPct defaults to 95%
    );
    if (dpError)
      return NextResponse.json({ error: dpError }, { status: 400 });

    const dp         = f2(downPayment);
    const loanAmount = f2(product.price - dp);

    // Safety net — should never reach here after validateDownPayment, but just in case
    if (loanAmount <= 0)
      return NextResponse.json(
        { error: "Calculated loan amount is zero or negative. Please reduce your down payment." },
        { status: 400 }
      );

    // ── Duplicate active loan check ──
    const existing = await prisma.loanApplication.findFirst({
      where: {
        userId:    current.id,
        productId,
        status:    { in: ["PENDING","REVIEWING","APPROVED","DOWN_PAYMENT_PENDING","ACTIVE"] },
      },
    });
    if (existing)
      return NextResponse.json(
        { error: "You already have an active loan application for this product." },
        { status: 409 }
      );

    // ── Calculate EMI ──
    const emi         = calcEmi(loanAmount, cfg.defaultInterest, tenure);
    const totalPayable = f2(emi * tenure + dp);

    // ── Create application ──
    const loan = await prisma.loanApplication.create({
      data: {
        userId:            current.id,
        productId,
        productPrice:      product.price,
        downPayment:       dp,
        downPaymentPaid:   0,
        loanAmount,
        interestRate:      cfg.defaultInterest,
        tenureMonths:      tenure,
        monthlyEmi:        f2(emi),
        totalPayable,
        firstEmiDelayDays: cfg.firstEmiDelayDays,
        gracePeriodDays:   cfg.gracePeriodDays,
        lateFee:           cfg.lateFee,
        nidNumber:         nidNumber     ? nidNumber.trim() : null,
        monthlyIncome:     monthlyIncome ? f2(monthlyIncome) : null,
        jobType:           jobType       || null,
        customerNote:      customerNote  || null,
        status:            "PENDING",
        documents:
          Array.isArray(documents) && documents.length > 0
            ? {
                create: documents.map((d) => ({
                  type:  d.type,
                  url:   d.url,
                  title: d.title || null,
                })),
              }
            : undefined,
      },
      include: {
        product:   { select: { id: true, name: true, price: true, mainImage: true } },
        documents: true,
      },
    });

    return NextResponse.json(
      {
        message: "Loan application submitted successfully.",
        loan: {
          id:           loan.id,
          status:       loan.status,
          productName:  loan.product.name,
          productPrice: loan.productPrice,
          downPayment:  loan.downPayment,
          loanAmount:   loan.loanAmount,
          interestRate: loan.interestRate,
          tenureMonths: loan.tenureMonths,
          monthlyEmi:   loan.monthlyEmi,
          totalPayable: loan.totalPayable,
          appliedAt:    loan.appliedAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/loans/apply]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─── GET /api/loans/apply ─────────────────────────────────────────────────────

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
          select: { id: true, name: true, mainImage: true, slug: true },
        },
        installments: {
          select: {
            id: true, installmentNo: true, dueDate: true,
            amount: true, paidAmount: true, remainingAmount: true,
            status: true, lateFee: true,
          },
          orderBy: { installmentNo: "asc" },
        },
        payments: {
          select: { id: true, amount: true, status: true, paymentType: true, paidAt: true },
          orderBy: { createdAt: "desc" },
          take: 5, // latest 5 for the user portal
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    // Attach totalCollected per loan
    const enriched = loans.map((l) => ({
      ...l,
      totalCollected: l.payments
        .filter((p) => p.status === "SUCCESS")
        .reduce((sum, p) => sum + p.amount, 0),
    }));

    return NextResponse.json({ loans: enriched });
  } catch (err) {
    console.error("[GET /api/loans/apply]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
=======
      interestRate,
      monthlyIncome,
      jobType,
      nidNumber,
      customerNote,
    } = body;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID required",
        },
        { status: 400 },
      );
    }

    if (!downPayment || downPayment < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid down payment",
        },
        { status: 400 },
      );
    }

    if (!tenureMonths || tenureMonths <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tenure",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    const productPrice = Number(product.price);

    if (downPayment >= productPrice) {
      return NextResponse.json(
        {
          success: false,
          message: "Down payment cannot exceed product price",
        },
        { status: 400 },
      );
    }

    const loanAmount = productPrice - Number(downPayment);

    const totalPayable =
      loanAmount + (loanAmount * Number(interestRate || 0)) / 100;

    const monthlyEmi = totalPayable / Number(tenureMonths);

    const loan = await prisma.loanApplication.create({
      data: {
        userId: current.id,
        productId,

        productPrice,
        downPayment: Number(downPayment),

        loanAmount,

        interestRate: Number(interestRate || 0),

        tenureMonths: Number(tenureMonths),

        monthlyEmi,

        totalPayable,

        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : null,

        jobType,

        nidNumber,

        customerNote,

        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Loan application submitted",
      loan,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
