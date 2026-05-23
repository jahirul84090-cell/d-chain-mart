import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function DELETE(req, { params }) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const sale = await prisma.inventorySale.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found." },
        { status: 404 }
      );
    }

    if (sale.ownerId !== current.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.inventorySale.delete({
        where: {
          id: params.id,
        },
      }),

      prisma.inventoryProduct.update({
        where: {
          id: sale.productId,
        },
        data: {
          stock: {
            increment: sale.qty,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: "Sale deleted and stock restored.",
    });
  } catch (error) {
    console.error("[DELETE /api/admin/inventory/sales/[id]]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}