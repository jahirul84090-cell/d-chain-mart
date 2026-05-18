import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/sendOtpEmail";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error: "This account uses Google sign-in and cannot reset a password",
        },
        { status: 400 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Email not verified. Please verify your email first.",
          action: "verify",
        },
        { status: 400 }
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: { otpCode, otpExpiresAt },
    });

    await sendOtpEmail({
      email,
      name: user.name || "User",
      otpCode,
      type: "reset",
    });

    console.log("Forgot-password API: Reset OTP sent", {
      email,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { message: "Password reset OTP sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot-password API: Error", {
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
