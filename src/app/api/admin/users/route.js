import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authCheck";

const ROLES = ["USER", "ADMIN", "SUPER_ADMIN"];
const PAGE_SIZE = 10;

// GET /api/admin/users?page=&role=&search=  (any staff member)
export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
  const role = searchParams.get("role") || "ALL";
  const search = (searchParams.get("search") || "").trim();

  try {
    const where = {
      ...(ROLES.includes(role) && { role }),
      ...(role === "BLOCKED" && { isBlocked: true }),
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
          isBlocked: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.user.count({ where }),
    ]);
    return NextResponse.json({ users, total, pageSize: PAGE_SIZE }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH { userId, role?, isBlocked? }  (super admins only)
export async function PATCH(request) {
  const authCheck = await requireAuthenticatedUser(request, { superAdminOnly: true });
  if (authCheck) return authCheck;

  try {
    const { userId, role, isBlocked } = await request.json();
    if (!userId || (role === undefined && isBlocked === undefined)) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    if (userId === request.user.id) {
      return NextResponse.json(
        { error: "You cannot change your own role or block yourself." },
        { status: 403 }
      );
    }
    if (role !== undefined && !ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user
      .update({
        where: { id: userId },
        data: {
          ...(role !== undefined && { role }),
          ...(isBlocked !== undefined && { isBlocked: !!isBlocked }),
        },
        select: { id: true, role: true, isBlocked: true },
      })
      .catch(() => null);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // A blocked user's sessions are ended by the auth callbacks on their next request.
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE { userId }  (super admins only)
// Customers with orders or EMI records are kept for accounting; block them instead.
export async function DELETE(request) {
  const authCheck = await requireAuthenticatedUser(request, { superAdminOnly: true });
  if (authCheck) return authCheck;

  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    if (userId === request.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, _count: { select: { orders: true, loanApplications: true } } },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user._count.orders > 0 || user._count.loanApplications > 0) {
      return NextResponse.json(
        {
          error:
            "This customer has orders or EMI records that must be kept. Block the account instead of deleting it.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.delete({ where: { id: cart.id } });
      }
      await tx.wishlist.deleteMany({ where: { userId } });
      const reviews = await tx.review.findMany({ where: { userId }, select: { id: true } });
      await tx.reviewImage.deleteMany({ where: { reviewId: { in: reviews.map((r) => r.id) } } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.address.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
