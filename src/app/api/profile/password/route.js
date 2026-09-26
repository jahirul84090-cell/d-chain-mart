import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

// PATCH { currentPassword, newPassword } — change the signed-in user's password.
export async function PATCH(request) {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await request.json().catch(() => ({}));
    if (!newPassword || String(newPassword).length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: current.id },
      select: { id: true, password: true },
    });
    if (!user?.password) {
      return NextResponse.json(
        { error: "This account signs in with Google, so it has no password to change." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(String(currentPassword || ""), user.password);
    if (!valid) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    }
    if (await bcrypt.compare(String(newPassword), user.password)) {
      return NextResponse.json({ error: "Choose a password you haven't used here before." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(String(newPassword), 10) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/profile/password failed", error);
    return NextResponse.json({ error: "Could not change your password." }, { status: 500 });
  }
}
