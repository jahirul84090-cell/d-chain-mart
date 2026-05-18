import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");
    const limit = Number(searchParams.get("limit")) || 8;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const mainProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!mainProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: mainProduct.id },
        categoryId: mainProduct.categoryId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        oldPrice: true,
        discount: true,
        mainImage: true,
        category: {
          select: { name: true, slug: true },
        },
      },
    });

    if (relatedProducts.length === 0) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          id: { not: mainProduct.id },
          isActive: true,
          OR: [
            {
              name: {
                contains: mainProduct.name.split(" ")[0],
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: mainProduct.name.split(" ")[0],
                mode: "insensitive",
              },
            },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          oldPrice: true,
          discount: true,
          mainImage: true,
          category: {
            select: { name: true, slug: true },
          },
        },
      });

      return NextResponse.json({ relatedProducts: fallbackProducts });
    }

    return NextResponse.json({ relatedProducts });
  } catch (error) {
    console.error("❌ Error fetching related products:", error);
    return NextResponse.json(
      { error: "Failed to fetch related products" },
      { status: 500 }
    );
  }
}
