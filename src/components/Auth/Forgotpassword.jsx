"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import AuthCard from "./AuthCard";
import { AuthField, EMAIL_RE, FormAlert, SubmitButton } from "./AuthFormParts";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState(useSearchParams().get("email") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError("Please enter a valid email address.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      // 429 means a code was sent less than a minute ago: carry on to the
      // code screen rather than blocking the customer.
      if (!res.ok && res.status !== 429) {
        setError(data.error || "We couldn't send the code. Please try again.");
        setLoading(false);
        return;
      }
      toast.success("If an account exists for this email, we've sent a 6-digit code.");
      router.push(`/auth/reset-password?email=${encodeURIComponent(value)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a code to reset it."
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
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <SubmitButton loading={loading} loadingText="Sending code…">
          Send reset code
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
