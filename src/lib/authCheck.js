import { getServerSession } from "next-auth";

import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

// Staff roles. ADMIN runs the store; SUPER_ADMIN can also manage
// customers, roles and account blocking.
export const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * Staff guard for API route handlers (every HTTP method).
 * Returns a JSON error response when the caller is not staff (or not a
 * SUPER_ADMIN when `superAdminOnly` is set); otherwise sets `request.user`
 * and returns null.
 */
export async function requireAuthenticatedUser(request, { superAdminOnly = false } = {}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isBlocked: true },
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = superAdminOnly ? user.role === "SUPER_ADMIN" : STAFF_ROLES.includes(user.role);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    request.user = user;
    return null;
  } catch (error) {
    console.error("requireAuthenticatedUser: Error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * True when the current session belongs to an active staff member. For
 * public endpoints that return extra data (e.g. hidden products) to staff.
 */
export async function isStaffSession() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return false;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isBlocked: true },
    });
    return !!user && !user.isBlocked && STAFF_ROLES.includes(user.role);
  } catch {
    return false;
  }
}

/**
 * Guard for resources that belong to a user.
 * Returns { user, isAdmin } for any signed-in user, or { response } with a
 * JSON error. Callers must still compare ownership against `user.id`
 * unless `isAdmin` is true.
 */
export async function requireSignedInUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isBlocked: true },
    });

    if (!user || user.isBlocked) {
      return {
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return { user, isAdmin: STAFF_ROLES.includes(user.role) };
  } catch (error) {
    console.error("requireSignedInUser: Error", error);
    return {
      response: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}
