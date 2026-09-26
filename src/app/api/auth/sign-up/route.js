import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/sendOtpEmail";
import { newOtpFields } from "@/lib/otp";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email Already Registared,Try another" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = newOtpFields();

    // Send OTP email first
    await sendOtpEmail({ email, name, otpCode: otp.otpCode });

    // Create user only after email is sent
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "USER",
        ...otp,
      },
    });

    return NextResponse.json(
      {
        message:
          "User created successfully. Please check your email for a 6-digit OTP to verify.",
        action: "signup",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign-up API: Error", {
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 }
    );
  }
}
