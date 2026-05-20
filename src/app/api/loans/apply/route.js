/**
 * File: app/api/loans/apply/route.js
 *
 * POST /api/loans/apply  — Submit loan application (auth required)
 * GET  /api/loans/apply  — List current user's own applications
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import {
  calcFlatProductPriceEmi,
  validateDownPayment,
  f2,
} from "@/lib/loan-utils";
import { sendLoanEmail } from "@/lib/loan-email";

const ALLOWED_TENURES = [3, 6];
const REQUIRED_DOC_TYPES = ["nid_front", "nid_back", "selfie", "nominee_photo"];

const DOC_TYPE_MAP = {
  nid_front: "NID_FRONT",
  nid_back: "NID_BACK",
  selfie: "SELFIE",
  nominee_photo: "NOMINEE_PHOTO",
};

const PLAN_INTEREST_MAP = {
  3: 10,
  6: 20,
};

export async function POST(req) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      productId,
      downPayment,
      tenureMonths,
      nidNumber,
      monthlyIncome,
      jobType,
      customerNote,
      applicantName,
      applicantAddress,
      nomineeName,
      nomineeRelation,
      nomineePhone,
      nomineeAddress,
      documents,
    } = body;

    const missing = [];

    if (!productId) missing.push("productId");
    if (!downPayment) missing.push("downPayment");
    if (!tenureMonths) missing.push("tenureMonths");
    if (!nidNumber) missing.push("nidNumber");
    if (!monthlyIncome) missing.push("monthlyIncome");
    if (!jobType) missing.push("jobType");
    if (!applicantName) missing.push("applicantName");
    if (!applicantAddress) missing.push("applicantAddress");
    if (!nomineeName) missing.push("nomineeName");
    if (!nomineeRelation) missing.push("nomineeRelation");
    if (!nomineePhone) missing.push("nomineePhone");
    if (!nomineeAddress) missing.push("nomineeAddress");

    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const tenure = Number(tenureMonths);

    if (!ALLOWED_TENURES.includes(tenure)) {
      return NextResponse.json(
        {
          error: `Invalid tenureMonths. Allowed: ${ALLOWED_TENURES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$|^\d{17}$/.test(String(nidNumber).trim())) {
      return NextResponse.json(
        { error: "NID must be exactly 10 or 17 digits." },
        { status: 400 }
      );
    }

    const income = Number(monthlyIncome);

    if (!income || income <= 0) {
      return NextResponse.json(
        { error: "monthlyIncome must be positive." },
        { status: 400 }
      );
    }

    if (String(applicantName).trim().length < 3) {
      return NextResponse.json(
        { error: "Applicant name must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (String(applicantAddress).trim().length < 10) {
      return NextResponse.json(
        { error: "Applicant address must be at least 10 characters." },
        { status: 400 }
      );
    }

    if (String(nomineeName).trim().length < 3) {
      return NextResponse.json(
        { error: "Nominee name must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (String(nomineeRelation).trim().length < 2) {
      return NextResponse.json(
        { error: "Nominee relation is required." },
        { status: 400 }
      );
    }

    if (!/^01[3-9]\d{8}$/.test(String(nomineePhone).trim())) {
      return NextResponse.json(
        {
          error:
            "Nominee phone must be a valid BD mobile number (01XXXXXXXXX).",
        },
        { status: 400 }
      );
    }

    if (String(nomineeAddress).trim().length < 10) {
      return NextResponse.json(
        { error: "Nominee address must be at least 10 characters." },
        { status: 400 }
      );
    }

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: `All documents required: ${REQUIRED_DOC_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    const submittedTypes = documents.map((doc) =>
      String(doc.type || "").toLowerCase()
    );

    const missingDocs = REQUIRED_DOC_TYPES.filter(
      (type) => !submittedTypes.includes(type)
    );

    if (missingDocs.length) {
      return NextResponse.json(
        { error: `Missing documents: ${missingDocs.join(", ")}.` },
        { status: 400 }
      );
    }

    for (const doc of documents) {
      const type = String(doc.type || "").toLowerCase();

      if (!REQUIRED_DOC_TYPES.includes(type)) {
        return NextResponse.json(
          { error: `Invalid document type: ${doc.type}.` },
          { status: 400 }
        );
      }

      if (!doc.url || !String(doc.url).startsWith("https://")) {
        return NextResponse.json(
          {
            error: `Document "${doc.type}" has invalid URL. Please re-upload.`,
          },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        stockAmount: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or inactive." },
        { status: 404 }
      );
    }

    if (Number(product.stockAmount || 0) <= 0) {
      return NextResponse.json(
        { error: "This product is out of stock." },
        { status: 400 }
      );
    }

    const setting = await prisma.loanSetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const cfg = {
      firstEmiDelayDays: setting?.firstEmiDelayDays ?? 30,
      gracePeriodDays: setting?.gracePeriodDays ?? 3,
      lateFee: setting?.lateFee ?? 100,
    };

    const dpErr = validateDownPayment(
      Number(downPayment),
      Number(product.price)
    );

    if (dpErr) {
      return NextResponse.json({ error: dpErr }, { status: 400 });
    }

    const dp = f2(downPayment);
    const loanAmount = f2(Number(product.price) - dp);

    if (loanAmount <= 0) {
      return NextResponse.json(
        { error: "Loan amount must be greater than zero." },
        { status: 400 }
      );
    }

    const existing = await prisma.loanApplication.findFirst({
      where: {
        userId: current.id,
        productId,
        status: {
          in: [
            "PENDING",
            "REVIEWING",
            "APPROVED",
            "DOWN_PAYMENT_PENDING",
            "ACTIVE",
          ],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have an active loan for this product." },
        { status: 409 }
      );
    }

    const interestRate = PLAN_INTEREST_MAP[tenure];

    const loanCalc = calcFlatProductPriceEmi(
      Number(product.price),
      dp,
      interestRate,
      tenure
    );

    const emi = loanCalc.monthlyEmi;
    const totalPayable = loanCalc.totalPayable;

    const loan = await prisma.loanApplication.create({
      data: {
        userId: current.id,
        productId,
        productPrice: Number(product.price),
        downPayment: dp,
        downPaymentPaid: 0,
        loanAmount,
        interestRate,
        tenureMonths: tenure,
        monthlyEmi: f2(emi),
        totalPayable: f2(totalPayable),
        firstEmiDelayDays: cfg.firstEmiDelayDays,
        gracePeriodDays: cfg.gracePeriodDays,
        lateFee: cfg.lateFee,
        nidNumber: String(nidNumber).trim(),
        monthlyIncome: f2(income),
        jobType: String(jobType).trim(),
        customerNote: customerNote?.trim() || null,
        applicantName: String(applicantName).trim(),
        applicantAddress: String(applicantAddress).trim(),
        nomineeName: String(nomineeName).trim(),
        nomineeRelation: String(nomineeRelation).trim(),
        nomineePhone: String(nomineePhone).trim(),
        nomineeAddress: String(nomineeAddress).trim(),
        status: "PENDING",

        documents: {
          create: documents.map((doc) => {
            const type = String(doc.type).toLowerCase();

            return {
              type: DOC_TYPE_MAP[type] || "OTHER",
              url: doc.url,
              title:
                doc.title ||
                type.replace(/_/g, " ").replace(/\b\w/g, (c) =>
                  c.toUpperCase()
                ),
            };
          }),
        },
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
            id: true,
            name: true,
            price: true,
            mainImage: true,
          },
        },
        documents: true,
      },
    });
try {
  await sendLoanEmail({
    type: "APPLICATION_SUBMITTED",
    loan,
  });
} catch (emailError) {
  console.error("[LOAN_APPLICATION_EMAIL_ERROR]", emailError);
}
    return NextResponse.json(
      {
        message: "Loan application submitted successfully.",
        loan: {
          id: loan.id,
          status: loan.status,
          productName: loan.product.name,
          productPrice: loan.productPrice,
          downPayment: loan.downPayment,
          loanAmount: loan.loanAmount,
          interestRate: loan.interestRate,
          tenureMonths: loan.tenureMonths,
          monthlyEmi: loan.monthlyEmi,
          totalPayable: loan.totalPayable,
          appliedAt: loan.appliedAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/loans/apply]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

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
            id: true,
            name: true,
            mainImage: true,
            slug: true,
          },
        },
        installments: {
          select: {
            id: true,
            installmentNo: true,
            dueDate: true,
            amount: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
            lateFee: true,
          },
          orderBy: {
            installmentNo: "asc",
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            url: true,
            title: true,
          },
        },
        payments: {
          where: {
            status: "SUCCESS",
          },
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        appliedAt: "desc",
      },
    });

    return NextResponse.json({
      loans: loans.map((loan) => ({
        ...loan,
        totalCollected: f2(
          loan.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
          )
        ),
        payments: undefined,
      })),
    });
  } catch (err) {
    console.error("[GET /api/loans/apply]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}