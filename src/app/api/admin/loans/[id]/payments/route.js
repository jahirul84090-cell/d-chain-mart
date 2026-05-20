/**
 * File: app/api/admin/loans/[id]/payments/route.js
 *
 * GET  /api/admin/loans/[id]/payments — list all payments
 * POST /api/admin/loans/[id]/payments — record payment
 *
 * INSTALLMENT hard cap: payment cannot exceed total outstanding across all
 * unpaid installments. Overpayment beyond this is rejected with a clear error.
 * Carry-forward applies excess within the outstanding balance only.
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser, f2, isZero } from "@/lib/loan-utils";

const VALID_TYPES   = ["DOWN_PAYMENT", "INSTALLMENT", "LATE_FEE", "OTHER"];
const VALID_METHODS = ["bKash", "Nagad", "Rocket", "Bank Transfer", "Cash", "Card", "Cheque", "Other"];

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const payments = await prisma.loanPayment.findMany({
      where:   { loanApplicationId: params.id },
      include: { installment: { select: { installmentNo: true, dueDate: true, amount: true } } },
      orderBy: { createdAt: "desc" },
    });

    const totalCollected = payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);
    return NextResponse.json({ payments, totalCollected: f2(totalCollected) });
  } catch (err) {
    console.error("[GET /api/admin/loans/[id]/payments]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { paymentType, amount, installmentId, paymentMethod, transactionNumber, referenceNumber, note } = await req.json();

    if (!paymentType || !VALID_TYPES.includes(paymentType))
      return NextResponse.json({ error: `paymentType must be one of: ${VALID_TYPES.join(", ")}.` }, { status: 400 });

    const parsedAmount = f2(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return NextResponse.json({ error: "amount must be a positive number." }, { status: 400 });

    if (paymentMethod && !VALID_METHODS.includes(paymentMethod))
      return NextResponse.json({ error: `paymentMethod must be one of: ${VALID_METHODS.join(", ")}.` }, { status: 400 });

    const loan = await prisma.loanApplication.findUnique({
      where:   { id: params.id },
      include: { installments: { orderBy: { installmentNo: "asc" } } },
    });
    if (!loan) return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    // Status guards
    if (paymentType === "DOWN_PAYMENT" && loan.status !== "DOWN_PAYMENT_PENDING")
      return NextResponse.json({ error: `Down payment only allowed when status is DOWN_PAYMENT_PENDING. Current: ${loan.status}.` }, { status: 400 });

    if (paymentType === "INSTALLMENT" && !["ACTIVE", "DOWN_PAYMENT_PENDING"].includes(loan.status))
      return NextResponse.json({ error: `Installment requires ACTIVE loan. Current: ${loan.status}.` }, { status: 400 });

    // Down payment cap
    if (paymentType === "DOWN_PAYMENT") {
      const remaining = f2(loan.downPayment - loan.downPaymentPaid);
      if (parsedAmount > remaining + 0.005)
        return NextResponse.json(
          { error: `Payment ৳${parsedAmount} exceeds remaining down payment ৳${remaining}.` },
          { status: 400 }
        );
    }

    // Installment hard cap
    if (paymentType === "INSTALLMENT") {
      const unpaid = loan.installments.filter((i) => !["PAID", "WAIVED"].includes(i.status));
      const totalOutstanding = f2(unpaid.reduce((s, i) => s + i.amount + i.lateFee - i.paidAmount, 0));
      if (totalOutstanding <= 0)
        return NextResponse.json({ error: "All installments are already settled." }, { status: 400 });
      if (parsedAmount > totalOutstanding + 0.005)
        return NextResponse.json(
          { error: `Payment ৳${parsedAmount} exceeds total outstanding ৳${totalOutstanding}. Maximum: ৳${totalOutstanding}.`, totalOutstanding },
          { status: 400 }
        );
    }

    const paymentBase = {
      loanApplicationId: loan.id,
      status:            "SUCCESS",
      amount:            parsedAmount,
      paymentMethod:     paymentMethod           || null,
      transactionNumber: transactionNumber?.trim() || null,
      referenceNumber:   referenceNumber?.trim()   || null,
      receivedBy:        current.name || current.email,
      paidAt:            new Date(),
      note:              note?.trim()               || null,
    };

    const result = await prisma.$transaction(async (tx) => {
      if (paymentType === "DOWN_PAYMENT") {
        const newPaid  = f2(loan.downPaymentPaid + parsedAmount);
        const isActive = newPaid >= loan.downPayment;
        const [payment, updatedLoan] = await Promise.all([
          tx.loanPayment.create({ data: { ...paymentBase, paymentType: "DOWN_PAYMENT", installmentId: null } }),
          tx.loanApplication.update({ where: { id: loan.id }, data: { downPaymentPaid: newPaid, ...(isActive && { status: "ACTIVE" }) } }),
        ]);
        return { payment, loan: updatedLoan };
      }

      if (paymentType === "INSTALLMENT") {
        const startIdx = installmentId
          ? loan.installments.findIndex((i) => i.id === installmentId)
          : loan.installments.findIndex((i) => !["PAID", "WAIVED"].includes(i.status));
        if (startIdx === -1) throw new Error("No unpaid installment found.");

        const primaryInstId = loan.installments[startIdx].id;
        let remaining = parsedAmount;

        for (let i = startIdx; i < loan.installments.length && remaining > 0.005; i++) {
          const inst = loan.installments[i];
          if (["PAID", "WAIVED"].includes(inst.status)) continue;
          const due    = f2(inst.amount + inst.lateFee - inst.paidAmount);
          if (due <= 0.005) continue;
          const apply  = Math.min(remaining, due);
          const newPd  = f2(inst.paidAmount + apply);
          const newRem = f2(Math.max(0, inst.amount + inst.lateFee - newPd));
          const done   = isZero(newRem);
          await tx.installmentPayment.update({
            where: { id: inst.id },
            data:  { paidAmount: newPd, remainingAmount: newRem, status: done ? "PAID" : "PARTIAL", paidAt: done ? new Date() : null },
          });
          remaining = f2(remaining - apply);
        }

        const allInsts   = await tx.installmentPayment.findMany({ where: { loanApplicationId: loan.id }, select: { status: true } });
        const allSettled = allInsts.every((i) => ["PAID", "WAIVED"].includes(i.status));

        const [payment, updatedLoan] = await Promise.all([
          tx.loanPayment.create({ data: { ...paymentBase, paymentType: "INSTALLMENT", installmentId: primaryInstId } }),
          allSettled
            ? tx.loanApplication.update({ where: { id: loan.id }, data: { status: "COMPLETED" } })
            : tx.loanApplication.findUnique({ where: { id: loan.id } }),
        ]);
        return { payment, loan: updatedLoan, loanCompleted: allSettled };
      }

      if (paymentType === "LATE_FEE") {
        if (!installmentId) throw new Error("installmentId required for LATE_FEE.");
        const inst = loan.installments.find((i) => i.id === installmentId);
        if (!inst) throw new Error("Installment not found.");
        if (["PAID", "WAIVED"].includes(inst.status)) throw new Error(`Installment #${inst.installmentNo} is already ${inst.status}.`);
        const due = f2(inst.amount + inst.lateFee - inst.paidAmount);
        if (parsedAmount > due + 0.005) throw new Error(`Payment ৳${parsedAmount} exceeds installment balance ৳${due}.`);
        const newPd  = f2(inst.paidAmount + parsedAmount);
        const newRem = f2(Math.max(0, inst.amount + inst.lateFee - newPd));
        const done   = isZero(newRem);
        const [payment] = await Promise.all([
          tx.loanPayment.create({ data: { ...paymentBase, paymentType: "LATE_FEE", installmentId } }),
          tx.installmentPayment.update({ where: { id: installmentId }, data: { paidAmount: newPd, remainingAmount: newRem, status: done ? "PAID" : newPd > 0 ? "PARTIAL" : "OVERDUE", paidAt: done ? new Date() : null } }),
        ]);
        const updatedLoan = await tx.loanApplication.findUnique({ where: { id: loan.id } });
        return { payment, loan: updatedLoan };
      }

      // OTHER
      const [payment, updatedLoan] = await Promise.all([
        tx.loanPayment.create({ data: { ...paymentBase, paymentType: "OTHER", installmentId: null } }),
        tx.loanApplication.findUnique({ where: { id: loan.id } }),
      ]);
      return { payment, loan: updatedLoan };
    });

    return NextResponse.json({ message: "Payment recorded.", payment: result.payment, loan: result.loan, ...(result.loanCompleted && { loanCompleted: true }) });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/payments]", err);
    const KNOWN = ["No unpaid", "installmentId required", "Installment not found", "already PAID", "already WAIVED", "exceeds"];
    const isKnown = KNOWN.some((m) => err.message?.includes(m));
    return NextResponse.json({ error: isKnown ? err.message : "Internal server error." }, { status: isKnown ? 400 : 500 });
  }
}