import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/sendOtpEmail";
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
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
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

    await sendOtpEmail({ email, name: user.name, otpCode: otp.otpCode });

    await prisma.user.update({
      where: { email },
      data: otp,
    });

    return NextResponse.json(
      { message: "A new OTP has been sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend-otp API: Error", {
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Could not send OTP. Please try again." },
      { status: 500 }
    );
  }
}
