"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, User, Mail, LockKeyhole } from "lucide-react"; // Added icons for inputs
import { toast } from "react-toastify";
import Link from "next/link";

// Logo component (optional, but good practice for branding)
const Logo = () => (
  <div className="flex items-center justify-center space-x-2 pb-2">
    {/* Placeholder for a sophisticated SVG or image logo */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 text-primary" // Using text-primary
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 18.9c-3.15-1.29-5.46-4.57-6-8.24V6.44l6-2.67 6 2.67v5.22c-.54 3.67-2.85 6.95-6 8.24zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">
      A P P L I C A T I O N
    </span>
  </div>
);

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (error) {
      toast.error(error);
      // Clear error after showing toast
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      // Clear success after showing toast
      setSuccess("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const handleCredentialsSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsCredentialsLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      setIsCredentialsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      setIsCredentialsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsCredentialsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsCredentialsLoading(false);
      return;
    }

    try {
      // NOTE: Replace this mock fetch with your actual API endpoint for sign-up
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsCredentialsLoading(false);
        return;
      }

      setSuccess("Account created! Check your email for OTP verification.");
      router.push(`/auth/otpverify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsCredentialsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setSuccess("");
    setIsGoogleLoading(true);
    try {
      // Assuming Google sign-up will eventually redirect to /dashboard
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Failed to initiate Google sign-up. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-xl transition-shadow duration-300">
        <CardHeader className="text-center space-y-2 p-8 pb-4">
          <Logo />
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Get started by creating your account with your details.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-8 pt-0">
          <form onSubmit={handleCredentialsSignUp} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <User className="h-4 w-4 text-gray-400" />
                Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  // Using focus:ring-primary and focus:border-primary
                  className="border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary rounded-lg pl-10"
                  required
                  aria-label="Full name"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  // Using focus:ring-primary and focus:border-primary
                  className="border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary rounded-lg pl-10"
                  required
                  aria-label="Email address"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <LockKeyhole className="h-4 w-4 text-gray-400" />
                Password
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  // Using focus:ring-primary and focus:border-primary
                  className="border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary rounded-lg pl-10"
                  required
                  aria-label="Password"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <LockKeyhole className="h-4 w-4 text-gray-400" />
                Confirm Password
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  // Using focus:ring-primary and focus:border-primary
                  className="border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary rounded-lg pl-10"
                  required
                  aria-label="Confirm password"
                />
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <p className="text-red-500 text-sm text-center font-medium">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-500 text-sm text-center font-medium">
                {success}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              // Using bg-primary and hover:bg-primary/90
              className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-md flex justify-center items-center gap-2"
              disabled={isCredentialsLoading || isGoogleLoading}
              aria-label="Sign up with email and password"
            >
              {isCredentialsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          {/* OR Separator */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
              OR
            </span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Google Sign-up Button */}
          <Button
            variant="outline"
            className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-3 rounded-lg transition-colors duration-200 shadow-sm"
            onClick={handleGoogleSignUp}
            disabled={isCredentialsLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.31 1.08-3.71 1.08-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.67 7.67 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.67 1 4.01 3.33 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </>
            )}
          </Button>

          {/* Sign In & Forgot Password Links */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-2 pt-2">
            <p>
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                // Using text-primary
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p>
              Forgot your password?{" "}
              <Link
                href="/auth/reset-password"
                // Using text-primary
                className="font-semibold text-primary hover:underline"
              >
                Reset it
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
