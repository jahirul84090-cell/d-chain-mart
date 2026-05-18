/**
 * File: app/api/admin/loans/[id]/installments/[instId]/route.js
 *
 * PATCH /api/admin/loans/[id]/installments/[instId]
 *
 * Granular admin control over individual installment records.
 * Every action is audited via the installment's `note` field.
 *
 * Actions (body.action):
 *
 *   reschedule
 *     Move the due date to a new future or past date.
 *     Clears the late fee and resets status to UNPAID or PARTIAL.
 *     Body: { newDueDate: "YYYY-MM-DD", reason?: string }
 *
 *   adjust_amount
 *     Change the principal EMI amount for this installment.
 *     Recalculates remainingAmount = newAmount + lateFee - paidAmount.
 *     Auto-marks as PAID if remainingAmount drops to zero.
 *     Body: { newAmount: number, reason?: string }
 *
 *   add_late_fee
 *     Adds an additional late fee on top of any existing lateFee.
 *     Uses loan.lateFee as default if feeAmount not specified.
 *     Body: { feeAmount?: number, reason?: string }
 *
 *   remove_late_fee
 *     Zeros out the lateFee and recalculates remainingAmount.
 *     Body: { reason?: string }
 *
 *   waive
 *     Marks as WAIVED — no payment required, counts toward loan completion.
 *     Cannot waive an already PAID installment.
 *     Body: { reason?: string }
 *
 *   reset
 *     Clears all payment data: paidAmount → 0, status → UNPAID, lateFee → 0.
 *     Cannot reset a WAIVED installment without explicit reason.
 *     Body: { reason?: string }
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser, f2, isZero } from "@/lib/loan-utils";

// ─── PATCH /api/admin/loans/[id]/installments/[instId] ───────────────────────

export async function PATCH(req, { params }) {
  try {
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await req.json();
    const { action, newDueDate, newAmount, feeAmount, reason } = body;

    if (!action)
      return NextResponse.json({ error: "action is required." }, { status: 400 });

    // ── Load installment with parent loan ──
    const inst = await prisma.installmentPayment.findUnique({
      where:   { id: params.instId },
      include: { loanApplication: true },
    });

    if (!inst)
      return NextResponse.json({ error: "Installment not found." }, { status: 404 });

    if (inst.loanApplicationId !== params.id)
      return NextResponse.json(
        { error: "Installment does not belong to this loan." },
        { status: 400 }
      );

    const loan = inst.loanApplication;

    // ── Build update payload ──
    let updateData = {};

    switch (action) {

      // ── Reschedule ────────────────────────────────────────────────────────
      case "reschedule": {
        if (!newDueDate)
          return NextResponse.json(
            { error: "newDueDate is required for reschedule." },
            { status: 400 }
          );
        if (isNaN(new Date(newDueDate).getTime()))
          return NextResponse.json(
            { error: `Invalid newDueDate: "${newDueDate}".` },
            { status: 400 }
          );
        if (["PAID", "WAIVED"].includes(inst.status))
          return NextResponse.json(
            { error: `Cannot reschedule a ${inst.status} installment.` },
            { status: 400 }
          );

        const newRemain = f2(Math.max(0, inst.amount - inst.paidAmount));
        updateData = {
          dueDate:           new Date(newDueDate),
          isDateChanged:     true,
          dateChangedReason: reason?.trim() || "Rescheduled by admin",
          lateFee:           0,               // clear late fee on reschedule
          remainingAmount:   newRemain,
          status:            inst.paidAmount > 0 ? "PARTIAL" : "UNPAID",
          note:              reason?.trim() || "Due date rescheduled by admin",
        };
        break;
      }

      // ── Adjust Amount ─────────────────────────────────────────────────────
      case "adjust_amount": {
        const amt = parseFloat(newAmount);
        if (isNaN(amt) || amt <= 0)
          return NextResponse.json(
            { error: "newAmount must be a positive number." },
            { status: 400 }
          );
        if (["PAID", "WAIVED"].includes(inst.status))
          return NextResponse.json(
            { error: `Cannot adjust a ${inst.status} installment.` },
            { status: 400 }
          );

        const newRemain = f2(Math.max(0, amt + inst.lateFee - inst.paidAmount));
        const isPaid    = isZero(newRemain);
        updateData = {
          amount:          amt,
          remainingAmount: newRemain,
          status:          isPaid ? "PAID" : inst.paidAmount > 0 ? "PARTIAL" : inst.status,
          paidAt:          isPaid ? (inst.paidAt ?? new Date()) : null,
          note:            reason?.trim() || `Amount adjusted to ৳${amt} by admin`,
        };
        break;
      }

      // ── Add Late Fee ──────────────────────────────────────────────────────
      case "add_late_fee": {
        const defaultFee = loan.lateFee || 0;
        const addFee     = feeAmount !== undefined ? parseFloat(feeAmount) : defaultFee;
        if (isNaN(addFee) || addFee <= 0)
          return NextResponse.json(
            { error: "feeAmount must be a positive number." },
            { status: 400 }
          );
        if (["PAID", "WAIVED"].includes(inst.status))
          return NextResponse.json(
            { error: `Cannot add late fee to a ${inst.status} installment.` },
            { status: 400 }
          );

        const newLateFee = f2(inst.lateFee + addFee);
        const newRemain  = f2(Math.max(0, inst.amount + newLateFee - inst.paidAmount));
        updateData = {
          lateFee:         newLateFee,
          remainingAmount: newRemain,
          status:          inst.paidAmount > 0 ? "PARTIAL" : "OVERDUE",
          note:            reason?.trim() || `Late fee ৳${addFee} added by admin`,
        };
        break;
      }

      // ── Remove Late Fee ───────────────────────────────────────────────────
      case "remove_late_fee": {
        if (inst.lateFee <= 0)
          return NextResponse.json(
            { error: "This installment has no late fee to remove." },
            { status: 400 }
          );

        const newRemain = f2(Math.max(0, inst.amount - inst.paidAmount));
        const isPaid    = isZero(newRemain);
        updateData = {
          lateFee:         0,
          remainingAmount: newRemain,
          status:          isPaid ? "PAID" : inst.paidAmount > 0 ? "PARTIAL" : "UNPAID",
          paidAt:          isPaid ? (inst.paidAt ?? new Date()) : null,
          note:            reason?.trim() || "Late fee removed by admin",
        };
        break;
      }

      // ── Waive ─────────────────────────────────────────────────────────────
      case "waive": {
        if (inst.status === "PAID")
          return NextResponse.json(
            { error: "Cannot waive an already PAID installment." },
            { status: 400 }
          );
        if (inst.status === "WAIVED")
          return NextResponse.json(
            { error: "Installment is already WAIVED." },
            { status: 400 }
          );

        updateData = {
          status:          "WAIVED",
          remainingAmount: 0,
          paidAt:          new Date(),
          note:            reason?.trim() || "Waived by admin",
        };
        break;
      }

      // ── Reset ─────────────────────────────────────────────────────────────
      case "reset": {
        if (inst.status === "PAID" && !reason?.trim())
          return NextResponse.json(
            { error: "A reason is required to reset a PAID installment." },
            { status: 400 }
          );

        updateData = {
          paidAmount:        0,
          remainingAmount:   inst.amount,
          lateFee:           0,
          status:            "UNPAID",
          paidAt:            null,
          isDateChanged:     false,
          dateChangedReason: null,
          note:              reason?.trim() || "Reset to unpaid by admin",
        };
        break;
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: "${action}". Valid: reschedule, adjust_amount, add_late_fee, remove_late_fee, waive, reset`,
          },
          { status: 400 }
        );
    }

    const updated = await prisma.installmentPayment.update({
      where: { id: params.instId },
      data:  updateData,
    });

    return NextResponse.json({
      message:     `Installment "${action}" applied successfully.`,
      installment: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/loans/[id]/installments/[instId]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}