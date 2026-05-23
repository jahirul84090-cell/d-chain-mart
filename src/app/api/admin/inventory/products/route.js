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
    const includeInactive = searchParams.get("includeInactive") === "true";

    const products = await prisma.inventoryProduct.findMany({
      where: {
        ownerId: current.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
        sales: {
          select: {
            qty: true,
            profit: true,
            sellPrice: true,
            buyPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enriched = products.map((p) => {
      const totalUnitsSold = p.sales.reduce((sum, sale) => sum + sale.qty, 0);

      const totalRevenue = p.sales.reduce(
        (sum, sale) => sum + sale.sellPrice * sale.qty,
        0
      );

      const totalCost = p.sales.reduce(
        (sum, sale) => sum + sale.buyPrice * sale.qty,
        0
      );

      const totalProfit = p.sales.reduce(
        (sum, sale) => sum + sale.profit,
        0
      );

      const stockValue = p.buyPrice * p.stock;

      const margin =
        p.buyPrice > 0
          ? Number((((p.sellPrice - p.buyPrice) / p.buyPrice) * 100).toFixed(2))
          : 0;

      return {
        id: p.id,
        brandName: p.brandName,
        model: p.model,
        variant: p.variant,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        stock: p.stock,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        margin,
        stockValue,
        totalUnitsSold,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        salesCount: p._count.sales,
      };
    });

    return NextResponse.json({ products: enriched });
  } catch (error) {
    console.error("[GET /api/admin/inventory/products]", error);

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

    const { brandName, model, variant, buyPrice, sellPrice, stock } = body;

    if (!brandName?.trim()) {
      return NextResponse.json(
        { error: "brandName is required." },
        { status: 400 }
      );
    }

    if (!model?.trim()) {
      return NextResponse.json(
        { error: "model is required." },
        { status: 400 }
      );
    }

    const bp = Number.parseFloat(buyPrice);
    const sp = Number.parseFloat(sellPrice);
    const st = Number.parseInt(stock ?? 0, 10);

    if (Number.isNaN(bp) || bp <= 0) {
      return NextResponse.json(
        { error: "buyPrice must be a positive number." },
        { status: 400 }
      );
    }

    if (Number.isNaN(sp) || sp <= 0) {
      return NextResponse.json(
        { error: "sellPrice must be a positive number." },
        { status: 400 }
      );
    }

    if (Number.isNaN(st) || st < 0) {
      return NextResponse.json(
        { error: "stock cannot be negative." },
        { status: 400 }
      );
    }

    const product = await prisma.inventoryProduct.create({
      data: {
        ownerId: current.id,
        brandName: brandName.trim(),
        model: model.trim(),
        variant: variant?.trim() || null,
        buyPrice: bp,
        sellPrice: sp,
        stock: st,
      },
    });

    return NextResponse.json(
      {
        message: "Product created.",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/inventory/products]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}