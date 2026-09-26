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

// Notices shown after arriving from another auth step.
const NOTICES = {
  verified: "Your email is verified. Sign in to continue.",
  reset: "Your password has been changed. Sign in with your new password.",
};

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const notice = NOTICES[searchParams.get("status")];

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", { redirect: false, email: email.trim(), password });
      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Incorrect email or password." : result.error);
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const google = () => {
    setError("");
    setGoogleLoading(true);
    signIn("google", { callbackUrl }).catch(() => {
      setError("Couldn't start Google sign-in. Please try again.");
      setGoogleLoading(false);
    });
  };

  const needsVerification = error.startsWith("Email not verified");
  const signupHref = callbackUrl !== "/" ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signup";

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Sign in to track orders, manage your wishlist and EMI plans."
      footer={
        <>
          New to D Chin Mart?{" "}
          <Link href={signupHref} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {notice && !error && <FormAlert type="success">{notice}</FormAlert>}
        <FormAlert>
          {needsVerification ? (
            <>
              Your email isn&apos;t verified yet.{" "}
              <Link href={`/auth/otpverify?email=${encodeURIComponent(email.trim())}`} className="font-semibold underline">
                Verify it now
              </Link>
            </>
          ) : (
            error
          )}
        </FormAlert>

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          action={
            <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          }
        />
        <SubmitButton loading={loading} loadingText="Signing in…" disabled={googleLoading || !email || !password}>
          Sign in
        </SubmitButton>
      </form>

      <Divider />
      <GoogleButton loading={googleLoading} disabled={loading} onClick={google} />
    </AuthCard>
  );
}
