/**
 * File: app/api/admin/accounting/stock-ledger/route.js
 *
 * GET  /api/admin/accounting/stock-ledger
 * POST /api/admin/accounting/stock-ledger
 *
 * Admin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/loan-utils";

const VALID_TYPES = [
  "STOCK_IN",
  "STOCK_OUT",
  "SALE",
  "RETURN",
  "DAMAGE",
  "ADJUSTMENT",
];

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

    const productId = searchParams.get("productId");
    const type = searchParams.get("type");

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    const range = parseDateRange(searchParams);

    if (range.error) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const where = {
      ...(productId ? { productId } : {}),
      ...(type ? { type } : {}),
      ...(range.start || range.end
        ? {
            createdAt: {
              ...(range.start ? { gte: range.start } : {}),
              ...(range.end ? { lte: range.end } : {}),
            },
          }
        : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              mainImage: true,
              stockAmount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.stockLedger.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/stock-ledger]", err);

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

    const productId = String(body.productId || "").trim();
    const type = String(body.type || "").trim();
    const quantity = Number(body.quantity);
    const note = body.note ? String(body.note).trim() : null;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required." },
        { status: 400 }
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "quantity must be a positive integer." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          stockAmount: true,
        },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      let nextStock = Number(product.stockAmount || 0);

      if (["STOCK_IN", "RETURN"].includes(type)) {
        nextStock += quantity;
      }

      if (["STOCK_OUT", "SALE", "DAMAGE"].includes(type)) {
        nextStock -= quantity;
      }

      if (type === "ADJUSTMENT") {
        nextStock = quantity;
      }

      if (nextStock < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const [entry, updatedProduct] = await Promise.all([
        tx.stockLedger.create({
          data: {
            productId,
            type,
            quantity,
            note,
          },
        }),

        tx.product.update({
          where: { id: productId },
          data: {
            stockAmount: nextStock,
          },
        }),
      ]);

      return {
        entry,
        product: updatedProduct,
      };
    });

    return NextResponse.json(
      {
        message: "Stock ledger entry created successfully.",
        entry: result.entry,
        product: result.product,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/accounting/stock-ledger]", err);

    if (err.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    if (err.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Insufficient stock for this operation." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}