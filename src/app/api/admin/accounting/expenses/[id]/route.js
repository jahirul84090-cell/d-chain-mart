/**
 * File: app/api/admin/accounting/expenses/[id]/route.js
 *
 * GET    /api/admin/accounting/expenses/[id]
 * PATCH  /api/admin/accounting/expenses/[id]
 * DELETE /api/admin/accounting/expenses/[id]
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

export async function GET(req, { params }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ expense });
  } catch (err) {
    console.error("[GET /api/admin/accounting/expenses/[id]]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Expense not found." },
        { status: 404 }
      );
    }

    const data = {};

    if (body.title !== undefined) {
      const title = String(body.title || "").trim();

      if (!title || title.length < 2) {
        return NextResponse.json(
          { error: "Expense title must be at least 2 characters." },
          { status: 400 }
        );
      }

      data.title = title;
    }

    if (body.amount !== undefined) {
      const amount = Number(body.amount);

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: "Expense amount must be greater than 0." },
          { status: 400 }
        );
      }

      data.amount = f2(amount);
    }

    if (body.category !== undefined) {
      data.category = body.category ? String(body.category).trim() : null;
    }

    if (body.note !== undefined) {
      data.note = body.note ? String(body.note).trim() : null;
    }

    if (body.expenseAt !== undefined) {
      const expenseAt = body.expenseAt ? new Date(body.expenseAt) : null;

      if (!expenseAt || isNaN(expenseAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid expenseAt date." },
          { status: 400 }
        );
      }

      data.expenseAt = expenseAt;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: "Expense updated successfully.",
      expense,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/accounting/expenses/[id]]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Expense not found." },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Expense deleted successfully.",
    });
  } catch (err) {
    console.error("[DELETE /api/admin/accounting/expenses/[id]]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}