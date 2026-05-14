"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Authentication Error
        </h1>
        <p className="text-red-500 text-sm">
          {error === "GoogleSignInFailed"
            ? "Google sign-in failed. Please try again."
            : error || "An unexpected error occurred"}
        </p>
        <Link
          href="/auth/login"
          className="text-blue-500 block text-center mt-4"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
