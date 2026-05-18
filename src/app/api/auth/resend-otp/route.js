import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/sendOtpEmail";

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

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await sendOtpEmail({ email, name: user.name, otpCode });

    await prisma.user.update({
      where: { email },
      data: { otpCode, otpExpiresAt },
    });

    console.log("Resend-otp API: OTP resent", {
      email,
      otpCode,
      timestamp: new Date().toISOString(),
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
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
