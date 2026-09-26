"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import AuthCard from "./AuthCard";
import {
  AuthField,
  Divider,
  EMAIL_RE,
  FormAlert,
  GoogleButton,
  PasswordField,
  SubmitButton,
  safeCallbackUrl,
} from "./AuthFormParts";

export default function Signup() {
  const router = useRouter();
  const callbackUrl = safeCallbackUrl(useSearchParams().get("callbackUrl"));

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    const email = form.email.trim();
    if (name.length < 2) return setError("Please enter your full name.");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email address.");
    if (form.password.length < 8) return setError("Your password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("The passwords don't match.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "We couldn't create your account. Please try again.");
        setLoading(false);
        return;
      }
      toast.success("Account created. We've emailed you a 6-digit code.");
      router.push(`/auth/otpverify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const google = () => {
    setError("");
    setGoogleLoading(true);
    signIn("google", { callbackUrl }).catch(() => {
      setError("Couldn't start Google sign-up. Please try again.");
      setGoogleLoading(false);
    });
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Shop faster, track your orders and apply for EMI plans."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton loading={googleLoading} disabled={loading} onClick={google}>
        Sign up with Google
      </GoogleButton>
      <Divider />

      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormAlert>
          {error}
          {error.startsWith("An account with this email") && (
            <>
              {" "}
              <Link href={`/auth/login?email=${encodeURIComponent(form.email.trim())}`} className="font-semibold underline">
                Sign in
              </Link>
            </>
          )}
        </FormAlert>
        <AuthField id="name" label="Full name" autoComplete="name" value={form.name} onChange={set("name")} required />
        <AuthField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          required
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.password}
          onChange={set("password")}
          required
        />
        <PasswordField
          id="confirm"
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
          required
        />
        <SubmitButton loading={loading} loadingText="Creating account…" disabled={googleLoading}>
          Create account
        </SubmitButton>
        <p className="text-center text-xs text-gray-500">
          By creating an account you agree to our{" "}
          <Link href="/terms-and-conditions" className="underline hover:text-primary">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}
