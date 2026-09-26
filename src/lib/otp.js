import { randomInt, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;

// Cryptographically secure 6-digit code.
export function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

export function newOtpFields() {
  return {
    otpCode: generateOtp(),
    otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
    otpAttempts: 0,
  };
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Checks a submitted OTP for a user and counts failed attempts.
 * After OTP_MAX_ATTEMPTS failures the code is invalidated and the user must
 * request a new one. Returns { ok: true } or { ok: false, error }.
 */
export async function checkOtp(user, otp) {
  if (!user.otpCode || !user.otpExpiresAt) {
    return { ok: false, error: "Invalid or expired OTP. Please request a new one." };
  }

  if (user.otpExpiresAt < new Date()) {
    return { ok: false, error: "OTP has expired. Please request a new one." };
  }

  if ((user.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Please request a new OTP." };
  }

  if (!safeEqual(user.otpCode, otp)) {
    const attempts = (user.otpAttempts ?? 0) + 1;
    await prisma.user.update({
      where: { id: user.id },
      data:
        attempts >= OTP_MAX_ATTEMPTS
          ? { otpAttempts: attempts, otpCode: null, otpExpiresAt: null }
          : { otpAttempts: attempts },
    });
    return {
      ok: false,
      error:
        attempts >= OTP_MAX_ATTEMPTS
          ? "Too many attempts. Please request a new OTP."
          : "Invalid OTP",
    };
  }

  return { ok: true };
}
