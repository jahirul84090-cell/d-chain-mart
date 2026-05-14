import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const categoryWithProducts = await prisma.category.findFirst({
      where: {},
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        products: {
          where: {
            isActive: true,
          },
          take: 20,
        },
      },
    });

    if (!categoryWithProducts) {
      return NextResponse.json(
        { message: "No categories found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { category: categoryWithProducts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching category and products:", error);
    return NextResponse.json(
      { error: "Failed to fetch category and products" },
      { status: 500 }
    );
  }
}
