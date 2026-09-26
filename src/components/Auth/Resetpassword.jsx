"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import AuthCard from "./AuthCard";
import { AuthField, EMAIL_RE, FormAlert, PasswordField, SubmitButton, useCountdown } from "./AuthFormParts";

export default function Resetpassword() {
  const router = useRouter();
  const [form, setForm] = useState({ email: useSearchParams().get("email") || "", otp: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, startCooldown] = useCountdown();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const email = form.email.trim();
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email address.");
    if (!/^\d{6}$/.test(form.otp)) return setError("Enter the 6-digit code from your email.");
    if (form.password.length < 8) return setError("Your new password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("The passwords don't match.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: form.otp, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "We couldn't reset your password. Please try again.");
        setLoading(false);
        return;
      }
      toast.success("Password changed.");
      router.push(`/auth/login?status=reset&email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    const email = form.email.trim();
    if (!EMAIL_RE.test(email)) return setError("Enter your email first so we know where to send the code.");
    setResending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
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
      title="Reset your password"
      subtitle="Enter the 6-digit code we emailed you and choose a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormAlert>{error}</FormAlert>
        <AuthField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          required
        />
        <AuthField
          id="otp"
          label="Reset code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          className="h-11 text-center text-lg tracking-[0.4em]"
          value={form.otp}
          onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          required
          action={
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={resend}
              disabled={resending || cooldown > 0}
            >
              {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Button>
          }
        />
        <PasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.password}
          onChange={set("password")}
          required
        />
        <PasswordField
          id="confirm"
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
          required
        />
        <SubmitButton loading={loading} loadingText="Saving…" disabled={resending}>
          Reset password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
