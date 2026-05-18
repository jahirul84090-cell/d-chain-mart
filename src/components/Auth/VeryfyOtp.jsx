"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, Mail, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

const Logo = () => (
  <div className="flex items-center justify-center space-x-2 pb-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 text-primary"
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

export default function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resendTimer, setResendTimer] = useState(0);
  const [isResendLoading, setIsResendLoading] = useState(false);

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError("");
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      setSuccess("");
    }
  }, [success]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      setIsLoading(false);
      return;
    }

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify OTP");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      setSuccess("Email verified successfully! Redirecting to sign-in...");
      router.push("/auth/login");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setIsResendLoading(true);

    if (!email) {
      setError("Email is required to resend OTP");
      setIsResendLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      setIsResendLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend OTP");
        setIsResendLoading(false);
        return;
      }

      setSuccess("A new OTP has been sent to your email.");
      setIsResendLoading(false);
      setResendTimer(60);
    } catch (err) {
      setError("An unexpected error occurred while resending OTP.");
      setIsResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-xl transition-shadow duration-300">
        <CardHeader className="text-center space-y-2 p-8 pb-4">
          <Logo />
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Enter the 6-digit verification code sent to the email below.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 focus:ring-primary focus:border-primary rounded-lg pl-10 cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="otp"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <KeyRound className="h-4 w-4 text-gray-400" />
                OTP Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary rounded-lg text-center tracking-widest pl-10"
                  required
                />
              </div>
            </div>

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

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-md flex justify-center items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
          </form>

          <Button
            variant="outline"
            className="mt-4 w-full border-gray-300 dark:border-gray-700 text-primary hover:bg-primary/10 transition-colors"
            onClick={handleResendOtp}
            disabled={isResendLoading || !email || resendTimer > 0}
          >
            {isResendLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending OTP...
              </>
            ) : resendTimer > 0 ? (
              `Resend OTP (${resendTimer}s)`
            ) : (
              "Resend OTP"
            )}
          </Button>

          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              Didn't receive the OTP? Check your spam folder or click "Resend
              OTP".
            </p>
            <p>
              Already verified?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
