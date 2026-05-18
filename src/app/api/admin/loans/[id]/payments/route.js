/**
 * File: app/api/admin/loans/[id]/payments/route.js
 *
 * GET  /api/admin/loans/[id]/payments — List all payments for a loan (newest first)
 * POST /api/admin/loans/[id]/payments — Record a new payment
 *
 * Payment types and behaviour:
 *
 *   DOWN_PAYMENT
 *     Adds to downPaymentPaid. When downPaymentPaid >= downPayment → loan status → ACTIVE.
 *     Guards: cannot exceed the required down payment amount.
 *
 *   INSTALLMENT  (carry-forward)
 *     Applies payment amount forward from the chosen (or first unpaid) installment.
 *     Excess automatically covers the next installment(s) — nothing is wasted.
 *     When every installment is PAID or WAIVED → loan status → COMPLETED.
 *     Guards: loan must be ACTIVE, at least one unpaid installment must exist.
 *
 *   LATE_FEE
 *     Applies to a specific installment's outstanding balance (principal + late fee).
 *     installmentId is required.
 *
 *   OTHER
 *     Recorded as-is with no installment or loan status change.
 *
 * POST body:
 *   paymentType       — "DOWN_PAYMENT" | "INSTALLMENT" | "LATE_FEE" | "OTHER"
 *   amount            — positive number
 *   installmentId     — UUID (required for LATE_FEE; optional for INSTALLMENT)
 *   paymentMethod     — "bKash" | "Nagad" | "Rocket" | "Bank Transfer" | "Cash" | "Card" | "Cheque" | "Other"
 *   transactionNumber — string (optional)
 *   referenceNumber   — string (optional)
 *   note              — string (optional)
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser, f2, isZero } from "@/lib/loan-utils";

// ─── Allowed payment methods ──────────────────────────────────────────────────

const VALID_METHODS = [
  "bKash", "Nagad", "Rocket", "Bank Transfer",
  "Cash", "Card", "Cheque", "Other",
];

// ─── GET /api/admin/loans/[id]/payments ──────────────────────────────────────

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const payments = await prisma.loanPayment.findMany({
      where:   { loanApplicationId: params.id },
      include: {
        installment: {
          select: { installmentNo: true, dueDate: true, amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalCollected = payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments,
      totalCollected: f2(totalCollected),
    });
  } catch (err) {
    console.error("[GET /api/admin/loans/[id]/payments]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─── POST /api/admin/loans/[id]/payments ─────────────────────────────────────

export async function POST(req, { params }) {
  try {
    // ── Auth ──
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await req.json();
    const {
      paymentType,
      amount,
      installmentId,
      paymentMethod,
      transactionNumber,
      referenceNumber,
      note,
    } = body;

    // ── Validate paymentType ──
    const VALID_TYPES = ["DOWN_PAYMENT", "INSTALLMENT", "LATE_FEE", "OTHER"];
    if (!paymentType || !VALID_TYPES.includes(paymentType))
      return NextResponse.json(
        { error: `paymentType must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );

    // ── Validate amount ──
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return NextResponse.json(
        { error: "amount must be a positive number." },
        { status: 400 }
      );

    // ── Validate payment method (if provided) ──
    if (paymentMethod && !VALID_METHODS.includes(paymentMethod))
      return NextResponse.json(
        { error: `paymentMethod must be one of: ${VALID_METHODS.join(", ")}.` },
        { status: 400 }
      );

    // ── Load loan + installments ──
    const loan = await prisma.loanApplication.findUnique({
      where:   { id: params.id },
      include: { installments: { orderBy: { installmentNo: "asc" } } },
    });

    if (!loan)
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    // ── Status guards per payment type ──
    if (paymentType === "DOWN_PAYMENT" && loan.status !== "DOWN_PAYMENT_PENDING") {
      return NextResponse.json(
        { error: `Down payment can only be recorded when loan status is DOWN_PAYMENT_PENDING. Current status: ${loan.status}.` },
        { status: 400 }
      );
    }

    if (paymentType === "INSTALLMENT" && !["ACTIVE", "DOWN_PAYMENT_PENDING"].includes(loan.status)) {
      return NextResponse.json(
        { error: `Installment payment requires loan status ACTIVE. Current status: ${loan.status}.` },
        { status: 400 }
      );
    }

    // ── Down payment cap ──
    if (paymentType === "DOWN_PAYMENT") {
      const remaining = f2(loan.downPayment - loan.downPaymentPaid);
      if (parsedAmount > remaining + 0.005) {
        return NextResponse.json(
          {
            error: `Payment amount ৳${parsedAmount} exceeds the remaining down payment of ৳${remaining}. Please enter ৳${remaining} or less.`,
          },
          { status: 400 }
        );
      }
    }

    // ── Shared payment record fields ──
    const paymentBase = {
      loanApplicationId: loan.id,
      status:            "SUCCESS",
      amount:            parsedAmount,
      paymentMethod:     paymentMethod     || null,
      transactionNumber: transactionNumber?.trim() || null,
      referenceNumber:   referenceNumber?.trim()   || null,
      receivedBy:        current.name || current.email,
      paidAt:            new Date(),
      note:              note?.trim()               || null,
    };

    // ─────────────────────────────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {

      // ══ DOWN PAYMENT ══════════════════════════════════════════════════════

      if (paymentType === "DOWN_PAYMENT") {
        const newPaid  = f2(loan.downPaymentPaid + parsedAmount);
        const isActive = newPaid >= loan.downPayment;

        const [payment, updatedLoan] = await Promise.all([
          tx.loanPayment.create({
            data: { ...paymentBase, paymentType: "DOWN_PAYMENT", installmentId: null },
          }),
          tx.loanApplication.update({
            where: { id: loan.id },
            data:  {
              downPaymentPaid: newPaid,
              ...(isActive && { status: "ACTIVE" }),
            },
          }),
        ]);

        return { payment, loan: updatedLoan };
      }

      // ══ INSTALLMENT — with automatic carry-forward ════════════════════════

      if (paymentType === "INSTALLMENT") {
        // Find starting installment
        const startIdx = installmentId
          ? loan.installments.findIndex((i) => i.id === installmentId)
          : loan.installments.findIndex((i) => !["PAID", "WAIVED"].includes(i.status));

        if (startIdx === -1)
          throw new Error("No unpaid installment found. All installments are already settled.");

        // Validate the specified installment exists
        if (installmentId && startIdx === -1)
          throw new Error("Specified installmentId not found on this loan.");

        const primaryInstId = loan.installments[startIdx].id;
        let remaining       = parsedAmount;

        // Walk forward applying payment across installments
        for (let i = startIdx; i < loan.installments.length && remaining > 0.005; i++) {
          const inst = loan.installments[i];
          if (["PAID", "WAIVED"].includes(inst.status)) continue;

          const totalDue  = inst.amount + inst.lateFee - inst.paidAmount;
          if (totalDue <= 0.005) continue;

          const applyAmt  = Math.min(remaining, totalDue);
          const newPaid   = f2(inst.paidAmount + applyAmt);
          const newRemain = f2(Math.max(0, inst.amount + inst.lateFee - newPaid));
          const isPaidOff = isZero(newRemain);

          await tx.installmentPayment.update({
            where: { id: inst.id },
            data:  {
              paidAmount:      newPaid,
              remainingAmount: newRemain,
              status:          isPaidOff ? "PAID" : "PARTIAL",
              paidAt:          isPaidOff ? new Date() : null,
            },
          });

          remaining = f2(remaining - applyAmt);
        }

        // Re-query (avoid stale in-memory state after updates)
        const allInsts   = await tx.installmentPayment.findMany({
          where:  { loanApplicationId: loan.id },
          select: { status: true },
        });
        const allSettled = allInsts.every((i) => ["PAID", "WAIVED"].includes(i.status));

        const [payment, updatedLoan] = await Promise.all([
          tx.loanPayment.create({
            data: { ...paymentBase, paymentType: "INSTALLMENT", installmentId: primaryInstId },
          }),
          allSettled
            ? tx.loanApplication.update({
                where: { id: loan.id },
                data:  { status: "COMPLETED" },
              })
            : tx.loanApplication.findUnique({ where: { id: loan.id } }),
        ]);

        return {
          payment,
          loan:             updatedLoan,
          carryForwardUsed: remaining < parsedAmount,
          remainingUnused:  f2(Math.max(0, remaining)),
          loanCompleted:    allSettled,
        };
      }

      // ══ LATE_FEE ══════════════════════════════════════════════════════════

      if (paymentType === "LATE_FEE") {
        if (!installmentId)
          throw new Error("installmentId is required for LATE_FEE payments.");

        const inst = loan.installments.find((i) => i.id === installmentId);
        if (!inst) throw new Error("Installment not found on this loan.");

        if (["PAID", "WAIVED"].includes(inst.status))
          throw new Error(`Installment #${inst.installmentNo} is already ${inst.status}.`);

        const newPaid   = f2(inst.paidAmount + parsedAmount);
        const newRemain = f2(Math.max(0, inst.amount + inst.lateFee - newPaid));
        const isPaidOff = isZero(newRemain);

        const [payment] = await Promise.all([
          tx.loanPayment.create({
            data: { ...paymentBase, paymentType: "LATE_FEE", installmentId },
          }),
          tx.installmentPayment.update({
            where: { id: installmentId },
            data:  {
              paidAmount:      newPaid,
              remainingAmount: newRemain,
              status:          isPaidOff ? "PAID" : newPaid > 0 ? "PARTIAL" : "OVERDUE",
              paidAt:          isPaidOff ? new Date() : null,
            },
          }),
        ]);

        const updatedLoan = await tx.loanApplication.findUnique({ where: { id: loan.id } });
        return { payment, loan: updatedLoan };
      }

      // ══ OTHER ════════════════════════════════════════════════════════════

      const [payment, updatedLoan] = await Promise.all([
        tx.loanPayment.create({
          data: { ...paymentBase, paymentType: "OTHER", installmentId: null },
        }),
        tx.loanApplication.findUnique({ where: { id: loan.id } }),
      ]);

      return { payment, loan: updatedLoan };
    });
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      message:          "Payment recorded successfully.",
      payment:          result.payment,
      loan:             result.loan,
      ...(result.loanCompleted          && { loanCompleted: true }),
      ...(result.carryForwardUsed       && { carryForwardUsed: true }),
      ...(result.remainingUnused > 0.005 && { remainingUnused: result.remainingUnused }),
    });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/payments]", err);

    // Surface known business-logic errors clearly to the client
    const KNOWN_ERRORS = [
      "No unpaid installment",
      "installmentId is required",
      "Installment not found",
      "already PAID",
      "already WAIVED",
      "Specified installmentId",
    ];
    const isKnown = KNOWN_ERRORS.some((m) => err.message?.includes(m));

    return NextResponse.json(
      { error: isKnown ? err.message : "Internal server error." },
      { status: isKnown ? 400 : 500 }
    );
  }
}