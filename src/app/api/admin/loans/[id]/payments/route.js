/**
 * File: app/api/admin/loans/[id]/payments/route.js
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2, isZero } from "@/lib/loan-utils";
import { sendLoanEmail } from "@/lib/loan-email";

const VALID_TYPES = ["DOWN_PAYMENT", "INSTALLMENT", "LATE_FEE", "OTHER"];
const VALID_METHODS = [
  "bKash",
  "Nagad",
  "Rocket",
  "Bank Transfer",
  "Cash",
  "Card",
  "Cheque",
  "Other",
];

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const payments = await prisma.loanPayment.findMany({
      where: { loanApplicationId: id },
      include: {
        installment: {
          select: {
            installmentNo: true,
            dueDate: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalCollected = payments
      .filter((payment) => payment.status === "SUCCESS")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    return NextResponse.json({
      payments,
      totalCollected: f2(totalCollected),
    });
  } catch (err) {
    console.error("[GET /api/admin/loans/[id]/payments]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const {
      paymentType,
      amount,
      installmentId,
      paymentMethod,
      transactionNumber,
      referenceNumber,
      note,
    } = await req.json();

    if (!paymentType || !VALID_TYPES.includes(paymentType)) {
      return NextResponse.json(
        { error: `paymentType must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    const parsedAmount = f2(parseFloat(amount));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number." },
        { status: 400 }
      );
    }

    if (paymentMethod && !VALID_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `paymentMethod must be one of: ${VALID_METHODS.join(", ")}.` },
        { status: 400 }
      );
    }

    const loan = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        installments: {
          orderBy: {
            installmentNo: "asc",
          },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    if (
      paymentType === "DOWN_PAYMENT" &&
      loan.status !== "DOWN_PAYMENT_PENDING"
    ) {
      return NextResponse.json(
        {
          error: `Down payment only allowed when status is DOWN_PAYMENT_PENDING. Current: ${loan.status}.`,
        },
        { status: 400 }
      );
    }

    if (
      paymentType === "INSTALLMENT" &&
      !["ACTIVE", "DOWN_PAYMENT_PENDING"].includes(loan.status)
    ) {
      return NextResponse.json(
        { error: `Installment requires ACTIVE loan. Current: ${loan.status}.` },
        { status: 400 }
      );
    }

    if (paymentType === "DOWN_PAYMENT") {
      const remaining = f2(
        Number(loan.downPayment) - Number(loan.downPaymentPaid)
      );

      if (parsedAmount > remaining + 0.005) {
        return NextResponse.json(
          {
            error: `Payment ৳${parsedAmount} exceeds remaining down payment ৳${remaining}.`,
          },
          { status: 400 }
        );
      }
    }

    if (paymentType === "INSTALLMENT") {
      const unpaid = loan.installments.filter(
        (installment) => !["PAID", "WAIVED"].includes(installment.status)
      );

      const totalOutstanding = f2(
        unpaid.reduce(
          (sum, installment) =>
            sum +
            Number(installment.amount) +
            Number(installment.lateFee) -
            Number(installment.paidAmount),
          0
        )
      );

      if (totalOutstanding <= 0) {
        return NextResponse.json(
          { error: "All installments are already settled." },
          { status: 400 }
        );
      }

      if (parsedAmount > totalOutstanding + 0.005) {
        return NextResponse.json(
          {
            error: `Payment ৳${parsedAmount} exceeds total outstanding ৳${totalOutstanding}. Maximum: ৳${totalOutstanding}.`,
            totalOutstanding,
          },
          { status: 400 }
        );
      }
    }

    const paymentBase = {
      loanApplicationId: loan.id,
      status: "SUCCESS",
      amount: parsedAmount,
      paymentMethod: paymentMethod || null,
      transactionNumber: transactionNumber?.trim() || null,
      referenceNumber: referenceNumber?.trim() || null,
      receivedBy: current.name || current.email,
      paidAt: new Date(),
      note: note?.trim() || null,
    };

    const result = await prisma.$transaction(async (tx) => {
      if (paymentType === "DOWN_PAYMENT") {
        const newPaid = f2(Number(loan.downPaymentPaid) + parsedAmount);
        const isActive = newPaid >= Number(loan.downPayment);

        const [payment, updatedLoan] = await Promise.all([
          tx.loanPayment.create({
            data: {
              ...paymentBase,
              paymentType: "DOWN_PAYMENT",
              installmentId: null,
            },
          }),

          tx.loanApplication.update({
            where: { id: loan.id },
            data: {
              downPaymentPaid: newPaid,
              ...(isActive && {
                status: "ACTIVE",
              }),
            },
          }),
        ]);

        return {
          payment,
          loan: updatedLoan,
          loanActivated: isActive,
        };
      }

      if (paymentType === "INSTALLMENT") {
        const startIdx = installmentId
          ? loan.installments.findIndex(
              (installment) => installment.id === installmentId
            )
          : loan.installments.findIndex(
              (installment) =>
                !["PAID", "WAIVED"].includes(installment.status)
            );

        if (startIdx === -1) {
          throw new Error("No unpaid installment found.");
        }

        const primaryInstId = loan.installments[startIdx].id;
        let remaining = parsedAmount;

        for (
          let i = startIdx;
          i < loan.installments.length && remaining > 0.005;
          i++
        ) {
          const installment = loan.installments[i];

          if (["PAID", "WAIVED"].includes(installment.status)) continue;

          const due = f2(
            Number(installment.amount) +
              Number(installment.lateFee) -
              Number(installment.paidAmount)
          );

          if (due <= 0.005) continue;

          const apply = Math.min(remaining, due);
          const newPaid = f2(Number(installment.paidAmount) + apply);
          const newRemaining = f2(
            Math.max(
              0,
              Number(installment.amount) +
                Number(installment.lateFee) -
                newPaid
            )
          );
          const done = isZero(newRemaining);

          await tx.installmentPayment.update({
            where: { id: installment.id },
            data: {
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: done ? "PAID" : "PARTIAL",
              paidAt: done ? new Date() : null,
            },
          });

          remaining = f2(remaining - apply);
        }

        const allInstallments = await tx.installmentPayment.findMany({
          where: {
            loanApplicationId: loan.id,
          },
          select: {
            status: true,
          },
        });

        const allSettled = allInstallments.every((installment) =>
          ["PAID", "WAIVED"].includes(installment.status)
        );

        const [payment, updatedLoan] = await Promise.all([
          tx.loanPayment.create({
            data: {
              ...paymentBase,
              paymentType: "INSTALLMENT",
              installmentId: primaryInstId,
            },
          }),

          allSettled
            ? tx.loanApplication.update({
                where: { id: loan.id },
                data: {
                  status: "COMPLETED",
                },
              })
            : tx.loanApplication.findUnique({
                where: { id: loan.id },
              }),
        ]);

        return {
          payment,
          loan: updatedLoan,
          loanCompleted: allSettled,
        };
      }

      if (paymentType === "LATE_FEE") {
        if (!installmentId) {
          throw new Error("installmentId required for LATE_FEE.");
        }

        const installment = loan.installments.find(
          (item) => item.id === installmentId
        );

        if (!installment) {
          throw new Error("Installment not found.");
        }

        if (["PAID", "WAIVED"].includes(installment.status)) {
          throw new Error(
            `Installment #${installment.installmentNo} is already ${installment.status}.`
          );
        }

        const due = f2(
          Number(installment.amount) +
            Number(installment.lateFee) -
            Number(installment.paidAmount)
        );

        if (parsedAmount > due + 0.005) {
          throw new Error(
            `Payment ৳${parsedAmount} exceeds installment balance ৳${due}.`
          );
        }

        const newPaid = f2(Number(installment.paidAmount) + parsedAmount);
        const newRemaining = f2(
          Math.max(
            0,
            Number(installment.amount) +
              Number(installment.lateFee) -
              newPaid
          )
        );
        const done = isZero(newRemaining);

        const [payment] = await Promise.all([
          tx.loanPayment.create({
            data: {
              ...paymentBase,
              paymentType: "LATE_FEE",
              installmentId,
            },
          }),

          tx.installmentPayment.update({
            where: { id: installmentId },
            data: {
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: done ? "PAID" : newPaid > 0 ? "PARTIAL" : "OVERDUE",
              paidAt: done ? new Date() : null,
            },
          }),
        ]);

        const updatedLoan = await tx.loanApplication.findUnique({
          where: { id: loan.id },
        });

        return {
          payment,
          loan: updatedLoan,
        };
      }

      const [payment, updatedLoan] = await Promise.all([
        tx.loanPayment.create({
          data: {
            ...paymentBase,
            paymentType: "OTHER",
            installmentId: null,
          },
        }),

        tx.loanApplication.findUnique({
          where: { id: loan.id },
        }),
      ]);

      return {
        payment,
        loan: updatedLoan,
      };
    });

    try {
      if (result.loanActivated) {
        const emailLoan = await prisma.loanApplication.findUnique({
          where: { id: loan.id },
          include: {
            user: true,
            product: true,
          },
        });

        await sendLoanEmail({
          type: "ACTIVE",
          loan: emailLoan,
        });
      }

      if (result.loanCompleted) {
        const emailLoan = await prisma.loanApplication.findUnique({
          where: { id: loan.id },
          include: {
            user: true,
            product: true,
          },
        });

        await sendLoanEmail({
          type: "COMPLETED",
          loan: emailLoan,
        });
      }
    } catch (emailError) {
      console.error("[PAYMENT_EMAIL_ERROR]", emailError);
    }

    return NextResponse.json({
      message: "Payment recorded.",
      payment: result.payment,
      loan: result.loan,
      ...(result.loanCompleted && {
        loanCompleted: true,
      }),
      ...(result.loanActivated && {
        loanActivated: true,
      }),
    });
  } catch (err) {
    console.error("[POST /api/admin/loans/[id]/payments]", err);

    const KNOWN = [
      "No unpaid",
      "installmentId required",
      "Installment not found",
      "already PAID",
      "already WAIVED",
      "exceeds",
    ];

    const isKnown = KNOWN.some((message) => err.message?.includes(message));

    return NextResponse.json(
      {
        error: isKnown ? err.message : "Internal server error.",
      },
      {
        status: isKnown ? 400 : 500,
      }
    );
  }
}