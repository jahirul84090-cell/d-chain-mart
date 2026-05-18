import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireAuthenticatedUser } from "@/lib/authCheck";

export async function GET(request) {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
      },
    });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;
  try {
    const { name, slug, imageUrl } = await request.json();
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });
    if (existingCategory) {
      return NextResponse.json(
        {
          error:
            existingCategory.name === name
              ? "Category name already exists"
              : "Slug already exists",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name, slug, imageUrl },
      select: { id: true, name: true, slug: true, imageUrl: true },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;
  try {
    const { id, name, slug, imageUrl } = await request.json();
    if (!id || !name || !slug) {
      return NextResponse.json(
        { error: "ID, name, and slug are required" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
        NOT: { id },
      },
    });
    if (existingCategory) {
      return NextResponse.json(
        {
          error:
            existingCategory.name === name
              ? "Category name already exists"
              : "Slug already exists",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, imageUrl },
      select: { id: true, name: true, slug: true, imageUrl: true },
    });
    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
