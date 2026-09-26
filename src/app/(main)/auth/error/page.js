"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import AuthCard from "@/components/Auth/AuthCard";

// Friendly text for NextAuth and app error codes (never show raw codes).
const MESSAGES = {
  GoogleSignInFailed: "Google sign-in didn't work. Please try again or sign in with email.",
  AccountSuspended: "This account has been suspended. Please contact support for help.",
  AccessDenied: "You don't have permission to sign in with this account.",
  OAuthAccountNotLinked:
    "This email is already registered. Sign in with the method you used before.",
  Verification: "This sign-in link has expired. Please try again.",
  MiddlewareError: "Something went wrong while checking your session. Please sign in again.",
};

export default function AuthError() {
  const error = useSearchParams().get("error");
  const message = MESSAGES[error] || "Something went wrong while signing you in. Please try again.";

  return (
    <AuthCard title="Couldn't sign you in">
      <div role="alert" className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>{message}</p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/auth/login"
          className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary/90"
        >
          Back to sign in
        </Link>
        <Link href="/contact" className="text-center text-sm font-medium text-primary hover:underline">
          Contact support
        </Link>
      </div>
    </AuthCard>
  );
}
