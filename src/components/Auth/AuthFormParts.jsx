"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only allow same-site relative paths, so auth pages cannot be used to
// redirect users to another website.
export function safeCallbackUrl(value) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function AuthField({ id, label, hint, action, ...inputProps }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <Input id={id} className="h-11" {...inputProps} />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function PasswordField({ id, label, hint, action, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <div className="relative">
        <Input id={id} type={visible ? "text" : "password"} className="h-11 pr-11" {...inputProps} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-gray-600"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function FormAlert({ type = "error", children }) {
  if (!children) return null;
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex gap-2.5 rounded-lg border p-3 text-sm ${
        isError ? "border-red-100 bg-red-50 text-red-700" : "border-green-100 bg-green-50 text-green-700"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function SubmitButton({ loading, loadingText, children, ...props }) {
  return (
    <Button type="submit" className="h-11 w-full gap-2 font-semibold" disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {loading ? loadingText : children}
    </Button>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase text-gray-400">
      <span className="h-px flex-1 bg-gray-200" />
      or
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

export function GoogleButton({ loading, disabled, onClick, children = "Continue with Google" }) {
  return (
    <Button type="button" variant="outline" className="h-11 w-full gap-3" onClick={onClick} disabled={loading || disabled}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.31 1.08-3.71 1.08-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.67 7.67 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.67 1 4.01 3.33 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      {loading ? "Redirecting to Google…" : children}
    </Button>
  );
}

// Counts down once per second; returns [secondsLeft, start(seconds)].
export function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}
