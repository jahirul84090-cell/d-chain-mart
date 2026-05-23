import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

async function getOwnedProduct(id, userId) {
  const product = await prisma.inventoryProduct.findUnique({
    where: { id },
  });

  if (!product) {
    return { error: "Product not found.", status: 404 };
  }

  if (product.ownerId !== userId) {
    return { error: "Forbidden.", status: 403 };
  }

  return { product };
}

export async function GET(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { error, status } = await getOwnedProduct(params.id, current.id);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const product = await prisma.inventoryProduct.findUnique({
      where: { id: params.id },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            qty: true,
            sellPrice: true,
            buyPrice: true,
            profit: true,
            month: true,
            year: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    const totalProfit = product.sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalUnitsSold = product.sales.reduce((sum, sale) => sum + sale.qty, 0);

    const margin =
      product.buyPrice > 0
        ? Number((((product.sellPrice - product.buyPrice) / product.buyPrice) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      product: {
        ...product,
        margin,
        totalProfit: Number(totalProfit.toFixed(2)),
        totalUnitsSold,
        stockValue: Number((product.buyPrice * product.stock).toFixed(2)),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/inventory/products/[id]]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await getOwnedProduct(params.id, current.id);

    if (owned.error) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const body = await req.json();

    const { brandName, model, variant, buyPrice, sellPrice, stock, isActive } = body;

    const data = {};

    if (brandName !== undefined) {
      if (!brandName.trim()) {
        return NextResponse.json(
          { error: "brandName cannot be empty." },
          { status: 400 }
        );
      }

      data.brandName = brandName.trim();
    }

    if (model !== undefined) {
      if (!model.trim()) {
        return NextResponse.json(
          { error: "model cannot be empty." },
          { status: 400 }
        );
      }

      data.model = model.trim();
    }

    if (variant !== undefined) {
      data.variant = variant?.trim() || null;
    }

    if (isActive !== undefined) {
      data.isActive = Boolean(isActive);
    }

    if (buyPrice !== undefined) {
      const bp = Number.parseFloat(buyPrice);

      if (Number.isNaN(bp) || bp <= 0) {
        return NextResponse.json(
          { error: "buyPrice must be greater than 0." },
          { status: 400 }
        );
      }

      data.buyPrice = bp;
    }

    if (sellPrice !== undefined) {
      const sp = Number.parseFloat(sellPrice);

      if (Number.isNaN(sp) || sp <= 0) {
        return NextResponse.json(
          { error: "sellPrice must be greater than 0." },
          { status: 400 }
        );
      }

      data.sellPrice = sp;
    }

    if (stock !== undefined) {
      const st = Number.parseInt(stock, 10);

      if (Number.isNaN(st) || st < 0) {
        return NextResponse.json(
          { error: "stock cannot be negative." },
          { status: 400 }
        );
      }

      data.stock = st;
    }

    const updated = await prisma.inventoryProduct.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      message: "Product updated.",
      product: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/inventory/products/[id]]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await getOwnedProduct(params.id, current.id);

    if (owned.error) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

    if (hard) {
      const salesCount = await prisma.inventorySale.count({
        where: { productId: params.id },
      });

      if (salesCount > 0) {
        return NextResponse.json(
          {
            error: `Cannot hard-delete: ${salesCount} sales exist for this product. Use soft delete instead.`,
          },
          { status: 400 }
        );
      }

      await prisma.inventoryProduct.delete({
        where: { id: params.id },
      });

      return NextResponse.json({
        message: "Product permanently deleted.",
      });
    }

    await prisma.inventoryProduct.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Product deactivated.",
    });
  } catch (error) {
    console.error("[DELETE /api/admin/inventory/products/[id]]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}