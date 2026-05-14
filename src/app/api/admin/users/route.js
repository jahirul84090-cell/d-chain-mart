import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireAuthenticatedUser } from "@/lib/authCheck";

export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const role = searchParams.get("role") || "ALL";
  const search = searchParams.get("search") || "";
  const pageSize = 10;

  try {
    const where = {
      ...(role !== "ALL" && { role }),
      ...(search && {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      }),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          image: true,
          createdAt: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return NextResponse.json({ users, total }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;

  try {
    const { userId, role } = await request.json();
    if (userId === request.user.id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 403 }
      );
    }
    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;

  try {
    const { userId } = await request.json();
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
