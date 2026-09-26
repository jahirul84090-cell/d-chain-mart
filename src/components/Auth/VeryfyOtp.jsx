"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import AuthCard from "./AuthCard";
import { AuthField, EMAIL_RE, FormAlert, SubmitButton, useCountdown } from "./AuthFormParts";

export default function VerifyOtpPage() {
  const router = useRouter();
  const emailFromUrl = useSearchParams().get("email") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, startCooldown] = useCountdown();

  const goToLogin = (value) => router.push(`/auth/login?status=verified&email=${encodeURIComponent(value)}`);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError("Please enter a valid email address.");
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit code from your email.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || data.error === "Email already verified") {
        toast.success("Email verified.");
        goToLogin(value);
        return;
      }
      setError(data.error === "User not found" ? "We couldn't find an account with this email." : data.error || "That code didn't work. Please try again.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError("Enter your email first so we know where to send the code.");
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error === "Email already verified") {
        toast.info("This email is already verified. Please sign in.");
        goToLogin(value);
        return;
      }
      if (!res.ok) setError(data.error || "We couldn't send a new code. Please try again.");
      else toast.success("We've sent a new code.");
      startCooldown(60);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        emailFromUrl ? (
          <>
            We sent a 6-digit code to <span className="font-medium text-gray-900">{emailFromUrl}</span>. It expires in 10
            minutes.
          </>
        ) : (
          "Enter your email and the 6-digit code we sent you."
        )
      }
      footer={
        <>
          Already verified?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormAlert>{error}</FormAlert>
        {!emailFromUrl && (
          <AuthField
            id="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        <AuthField
          id="otp"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          autoFocus
          className="h-12 text-center text-xl tracking-[0.5em]"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />
        <SubmitButton loading={loading} loadingText="Verifying…" disabled={otp.length !== 6}>
          Verify email
        </SubmitButton>
      </form>

      <div className="mt-5 text-center text-sm text-gray-600">
        Didn&apos;t get it? Check your spam folder or{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 font-semibold"
          onClick={resend}
          disabled={resending || cooldown > 0}
        >
          {resending ? "sending…" : cooldown > 0 ? `resend in ${cooldown}s` : "send a new code"}
        </Button>
      </div>
    </AuthCard>
  );
}
