/**
 * File: app/api/admin/loans/[id]/installments/[instId]/route.js
 *
 * PATCH — granular installment control
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2, isZero } from "@/lib/loan-utils";
import { sendLoanEmail } from "@/lib/loan-email";

const EMAIL_TYPE_BY_ACTION = {
  reschedule: "INSTALLMENT_RESCHEDULED",
  adjust_amount: "INSTALLMENT_AMOUNT_UPDATED",
  add_late_fee: "LATE_FEE_ADDED",
  remove_late_fee: "LATE_FEE_REMOVED",
  waive: "INSTALLMENT_WAIVED",
  reset: "INSTALLMENT_RESET",
};

export async function PATCH(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!isAdminUser(current)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id, instId } = await params;
    const { action, newDueDate, newAmount, feeAmount, reason } =
      await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "action is required." },
        { status: 400 }
      );
    }

    const inst = await prisma.installmentPayment.findUnique({
      where: { id: instId },
      include: {
        loanApplication: true,
      },
    });

    if (!inst) {
      return NextResponse.json(
        { error: "Installment not found." },
        { status: 404 }
      );
    }

    if (inst.loanApplicationId !== id) {
      return NextResponse.json({ error: "Mismatch." }, { status: 400 });
    }

    let data = {};

    switch (action) {
      case "reschedule": {
        if (!newDueDate || isNaN(new Date(newDueDate).getTime())) {
          return NextResponse.json(
            { error: "Valid newDueDate required." },
            { status: 400 }
          );
        }

        if (["PAID", "WAIVED"].includes(inst.status)) {
          return NextResponse.json(
            { error: `Cannot reschedule a ${inst.status} installment.` },
            { status: 400 }
          );
        }

        data = {
          dueDate: new Date(newDueDate),
          isDateChanged: true,
          dateChangedReason: reason || "Rescheduled by admin",
          lateFee: 0,
          remainingAmount: f2(Math.max(0, inst.amount - inst.paidAmount)),
          status: inst.paidAmount > 0 ? "PARTIAL" : "UNPAID",
          note: reason || "Due date rescheduled",
        };

        break;
      }

      case "adjust_amount": {
        const amt = parseFloat(newAmount);

        if (isNaN(amt) || amt <= 0) {
          return NextResponse.json(
            { error: "newAmount must be > 0." },
            { status: 400 }
          );
        }

        if (["PAID", "WAIVED"].includes(inst.status)) {
          return NextResponse.json(
            { error: `Cannot adjust ${inst.status} installment.` },
            { status: 400 }
          );
        }

        const newRem = f2(Math.max(0, amt + inst.lateFee - inst.paidAmount));

        data = {
          amount: amt,
          remainingAmount: newRem,
          status: isZero(newRem)
            ? "PAID"
            : inst.paidAmount > 0
              ? "PARTIAL"
              : inst.status,
          paidAt: isZero(newRem) ? inst.paidAt ?? new Date() : null,
          note: reason || `Amount adjusted to ৳${amt}`,
        };

        break;
      }

      case "add_late_fee": {
        if (["PAID", "WAIVED"].includes(inst.status)) {
          return NextResponse.json(
            { error: `Cannot add fee to ${inst.status} installment.` },
            { status: 400 }
          );
        }

        const addFee = parseFloat(feeAmount ?? inst.loanApplication.lateFee);

        if (isNaN(addFee) || addFee <= 0) {
          return NextResponse.json(
            { error: "feeAmount must be > 0." },
            { status: 400 }
          );
        }

        const newFee = f2(inst.lateFee + addFee);
        const newRem = f2(Math.max(0, inst.amount + newFee - inst.paidAmount));

        data = {
          lateFee: newFee,
          remainingAmount: newRem,
          status: inst.paidAmount > 0 ? "PARTIAL" : "OVERDUE",
          note: reason || `Late fee ৳${addFee} added`,
        };

        break;
      }

      case "remove_late_fee": {
        if (inst.lateFee <= 0) {
          return NextResponse.json(
            { error: "No late fee to remove." },
            { status: 400 }
          );
        }

        const newRem = f2(Math.max(0, inst.amount - inst.paidAmount));

        data = {
          lateFee: 0,
          remainingAmount: newRem,
          status: isZero(newRem)
            ? "PAID"
            : inst.paidAmount > 0
              ? "PARTIAL"
              : "UNPAID",
          paidAt: isZero(newRem) ? inst.paidAt ?? new Date() : null,
          note: reason || "Late fee removed",
        };

        break;
      }

      case "waive": {
        if (inst.status === "PAID") {
          return NextResponse.json(
            { error: "Cannot waive a PAID installment." },
            { status: 400 }
          );
        }

        if (inst.status === "WAIVED") {
          return NextResponse.json(
            { error: "Already WAIVED." },
            { status: 400 }
          );
        }

        data = {
          status: "WAIVED",
          remainingAmount: 0,
          paidAt: new Date(),
          note: reason || "Waived by admin",
        };

        break;
      }

      case "reset": {
        if (inst.status === "PAID" && !reason?.trim()) {
          return NextResponse.json(
            { error: "Reason required to reset a PAID installment." },
            { status: 400 }
          );
        }

        data = {
          paidAmount: 0,
          remainingAmount: inst.amount,
          lateFee: 0,
          status: "UNPAID",
          paidAt: null,
          isDateChanged: false,
          dateChangedReason: null,
          note: reason || "Reset by admin",
        };

        break;
      }

      default: {
        return NextResponse.json(
          { error: `Unknown action: "${action}".` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.installmentPayment.update({
      where: { id: instId },
      data,
      include: {
        loanApplication: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    try {
      await sendLoanEmail({
        type: EMAIL_TYPE_BY_ACTION[action],
        loan: updated.loanApplication,
        installment: updated,
      });
    } catch (emailError) {
      console.error("[INSTALLMENT_ACTION_EMAIL_ERROR]", emailError);
    }

    return NextResponse.json({
      message: `Action "${action}" applied.`,
      installment: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/loans/[id]/installments/[instId]]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}