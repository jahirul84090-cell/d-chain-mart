import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const productIdParam = searchParams.get("productId");

    const where = {
      ownerId: current.id,
      ...(monthParam ? { month: Number.parseInt(monthParam, 10) } : {}),
      ...(yearParam ? { year: Number.parseInt(yearParam, 10) } : {}),
      ...(productIdParam ? { productId: productIdParam } : {}),
    };

    const sales = await prisma.inventorySale.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            brandName: true,
            model: true,
            variant: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enriched = sales.map((sale) => {
      const revenue = sale.sellPrice * sale.qty;
      const cost = sale.buyPrice * sale.qty;

      const margin =
        sale.buyPrice > 0
          ? Number((((sale.sellPrice - sale.buyPrice) / sale.buyPrice) * 100).toFixed(2))
          : 0;

      return {
        ...sale,
        revenue: Number(revenue.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        margin,
      };
    });

    const totals = {
      revenue: Number(
        enriched.reduce((sum, sale) => sum + sale.revenue, 0).toFixed(2)
      ),
      cost: Number(
        enriched.reduce((sum, sale) => sum + sale.cost, 0).toFixed(2)
      ),
      profit: Number(
        enriched.reduce((sum, sale) => sum + sale.profit, 0).toFixed(2)
      ),
      units: enriched.reduce((sum, sale) => sum + sale.qty, 0),
      count: enriched.length,
    };

    return NextResponse.json({
      sales: enriched,
      totals,
    });
  } catch (error) {
    console.error("[GET /api/admin/inventory/sales]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();

    const { productId, qty, sellPrice, month, year, note } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required." },
        { status: 400 }
      );
    }

    const q = Number.parseInt(qty, 10);
    const sp = Number.parseFloat(sellPrice);
    const m = Number.parseInt(month, 10);
    const y = Number.parseInt(year, 10);

    if (Number.isNaN(q) || q <= 0) {
      return NextResponse.json(
        { error: "qty must be a positive integer." },
        { status: 400 }
      );
    }

    if (Number.isNaN(sp) || sp <= 0) {
      return NextResponse.json(
        { error: "sellPrice must be a positive number." },
        { status: 400 }
      );
    }

    if (Number.isNaN(m) || m < 1 || m > 12) {
      return NextResponse.json(
        { error: "month must be between 1 and 12." },
        { status: 400 }
      );
    }

    if (Number.isNaN(y) || y < 2000 || y > 2100) {
      return NextResponse.json(
        { error: "year must be a valid 4-digit year." },
        { status: 400 }
      );
    }

    const product = await prisma.inventoryProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    if (product.ownerId !== current.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: "Product is inactive." },
        { status: 400 }
      );
    }

    if (q > product.stock) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${product.stock}, requested: ${q}.`,
        },
        { status: 400 }
      );
    }

    const profit = Number(((sp - product.buyPrice) * q).toFixed(2));

    const [sale] = await prisma.$transaction([
      prisma.inventorySale.create({
        data: {
          productId,
          ownerId: current.id,
          qty: q,
          sellPrice: sp,
          buyPrice: product.buyPrice,
          profit,
          month: m,
          year: y,
          note: note?.trim() || null,
        },
        include: {
          product: {
            select: {
              id: true,
              brandName: true,
              model: true,
              variant: true,
            },
          },
        },
      }),

      prisma.inventoryProduct.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: q,
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Sale recorded successfully.",
        sale: {
          ...sale,
          revenue: Number((sp * q).toFixed(2)),
          cost: Number((product.buyPrice * q).toFixed(2)),
          margin:
            product.buyPrice > 0
              ? Number((((sp - product.buyPrice) / product.buyPrice) * 100).toFixed(2))
              : 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/inventory/sales]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}