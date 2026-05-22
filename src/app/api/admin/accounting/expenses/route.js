/**
 * File: app/api/admin/accounting/expenses/route.js
 *
 * GET  /api/admin/accounting/expenses
 * POST /api/admin/accounting/expenses
 *
 * Admin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2 } from "@/lib/loan-utils";

const MAX_LIMIT = 100;

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

function parseDateRange(searchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;

  if (start && isNaN(start.getTime())) {
    return { error: "Invalid from date. Use YYYY-MM-DD." };
  }

  if (end && isNaN(end.getTime())) {
    return { error: "Invalid to date. Use YYYY-MM-DD." };
  }

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  if (start && end && start > end) {
    return { error: "from date cannot be after to date." };
  }

  return { start, end };
}

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") || 20))
    );

    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const range = parseDateRange(searchParams);
    if (range.error) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const where = {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { category: { contains: q } },
              { note: { contains: q } },
            ],
          }
        : {}),
      ...(range.start || range.end
        ? {
            expenseAt: {
              ...(range.start ? { gte: range.start } : {}),
              ...(range.end ? { lte: range.end } : {}),
            },
          }
        : {}),
    };

    const [expenses, total, aggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: {
          expenseAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.expense.count({ where }),

      prisma.expense.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalExpense: f2(aggregate._sum.amount || 0),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/expenses]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();

    const title = String(body.title || "").trim();
    const amount = Number(body.amount);
    const category = body.category ? String(body.category).trim() : null;
    const note = body.note ? String(body.note).trim() : null;
    const expenseAt = body.expenseAt ? new Date(body.expenseAt) : new Date();

    if (!title || title.length < 2) {
      return NextResponse.json(
        { error: "Expense title must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Expense amount must be greater than 0." },
        { status: 400 }
      );
    }

    if (isNaN(expenseAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid expenseAt date." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: f2(amount),
        category,
        note,
        expenseAt,
      },
    });

    return NextResponse.json(
      {
        message: "Expense created successfully.",
        expense,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/accounting/expenses]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}