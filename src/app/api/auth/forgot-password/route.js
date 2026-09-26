import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/sendOtpEmail";
import { NextResponse } from "next/server";
import { newOtpFields, OTP_TTL_MS } from "@/lib/otp";

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

    // Same response whether or not the account exists, so the endpoint
    // cannot be used to discover registered emails.
    if (!user || !user.password || !user.emailVerified) {
      return NextResponse.json(
        {
          message:
            "If an account exists for this email, a reset OTP has been sent.",
        },
        { status: 200 }
      );
    }
    // Allow at most one new code per minute.
    if (
      user.otpExpiresAt &&
      user.otpExpiresAt.getTime() - OTP_TTL_MS + 60 * 1000 > Date.now()
    ) {
      return NextResponse.json(
        { error: "Please wait a minute before requesting another OTP." },
        { status: 429 }
      );
    }

    const otp = newOtpFields();

    await prisma.user.update({
      where: { email },
      data: otp,
    });

    await sendOtpEmail({
      email,
      name: user.name || "User",
      otpCode: otp.otpCode,
      type: "reset",
    });

    return NextResponse.json(
      {
        message:
          "If an account exists for this email, a reset OTP has been sent.",
      },
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
