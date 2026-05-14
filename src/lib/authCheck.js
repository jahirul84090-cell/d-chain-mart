import { getServerSession } from "next-auth";

import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

function clearAuthCookies(response) {
  response.cookies.set("next-auth.session-token", "", {
    expires: new Date(0),
    path: "/",
  });
  return response;
}

export async function requireAuthenticatedUser(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      const response = NextResponse.redirect(
        new URL(process.env.NEXT_PUBLIC_LOGIN_URL || "/auth/login", request.url)
      );
      return clearAuthCookies(response);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: { id: true, role: true },
    });

    if (!user) {
      const response = NextResponse.redirect(
        new URL(process.env.NEXT_PUBLIC_LOGIN_URL || "/auth/login", request.url)
      );
      return clearAuthCookies(response);
    }

    if (
      ["POST", "PUT", "DELETE", "GET"].includes(request.method) &&
      user.role !== "SUPER_ADMIN"
    ) {
      const response = NextResponse.redirect(
        new URL(process.env.NEXT_PUBLIC_LOGIN_URL || "/auth/login", request.url)
      );
      return clearAuthCookies(response);
    }

    request.user = user;
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
