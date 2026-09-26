import { getServerSession } from "next-auth";

import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/**
 * Admin guard for API route handlers.
 * Returns a JSON error response when the caller is not a SUPER_ADMIN,
 * otherwise sets `request.user` and returns null.
 * Applies to every HTTP method (GET, POST, PUT, PATCH, DELETE, ...).
 */
export async function requireAuthenticatedUser(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
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
      select: { id: true, role: true },
    });

    if (!user) {
      return {
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return { user, isAdmin: user.role === "SUPER_ADMIN" };
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
