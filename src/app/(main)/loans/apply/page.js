/**
 * File: app/loans/apply/page.jsx
 *
 * Loan Application Wizard — Production Level
 *
 * Step 1 — Product:       Auto-loaded from ?slug= query param, read-only review
 * Step 2 — Loan Terms:    Down payment slider (min%–95%) + tenure card selector
 *                         Live EMI metrics + collapsible amortization schedule
 * Step 3 — Personal Info: NID, income, job type, optional note
 *                         Income-to-EMI health indicator
 * Step 4 — Review:        Full summary, disclaimer, submit
 *
 * Validation mirrors server-side rules (loan-utils.js):
 *  - Down payment: minPct% ≤ dp < 95% of price, must leave loan > 0
 *  - NID: exactly 10 or 17 digits
 *  - Income must be > 0
 *  - Job type required
 */

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link  from "next/link";

import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Textarea }  from "@/components/ui/textarea";
import { Badge }     from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress }  from "@/components/ui/progress";
import { Slider }    from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ShieldCheck, CreditCard, AlertCircle, ChevronRight, ChevronLeft,
  CheckCircle2, Info, Loader2, Package, User, FileText, TrendingUp,
  Calendar, Banknote, Percent, BadgeCheck, Clock,
  ChevronDown, ChevronUp, ReceiptText,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Product",    icon: Package    },
  { id: 2, label: "Loan Terms", icon: CreditCard },
  { id: 3, label: "Personal",   icon: User       },
  { id: 4, label: "Review",     icon: FileText   },
];

const JOB_TYPES = [
  "Government Employee", "Private Employee", "Business Owner",
  "Freelancer", "Teacher", "Doctor", "Engineer", "Retired", "Other",
];

const TENURE_OPTIONS = [
  { months: 3,  label: "3M"  },
  { months: 6,  label: "6M"  },
  { months: 9,  label: "9M"  },
  { months: 12, label: "1Y"  },
  { months: 18, label: "18M" },
  { months: 24, label: "2Y"  },
  { months: 36, label: "3Y"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

function calcEmi(principal, annualPct, months) {
  if (!principal || !months) return 0;
  const mr = annualPct / 100 / 12;
  if (mr === 0) return principal / months;
  return (principal * mr * Math.pow(1 + mr, months)) /
    (Math.pow(1 + mr, months) - 1);
}

function buildSchedule(principal, annualPct, months) {
  const mr  = annualPct / 100 / 12;
  const emi = calcEmi(principal, annualPct, months);
  let   bal = principal;
  const rows = [];
  const first = new Date();
  first.setDate(first.getDate() + 30);

  for (let i = 1; i <= months; i++) {
    const interest  = bal * mr;
    const princ     = emi - interest;
    bal             = Math.max(0, bal - princ);
    const d         = new Date(first);
    d.setMonth(d.getMonth() + (i - 1));
    rows.push({ no: i, date: d, emi, princ, interest, bal });
  }
  return rows;
}

// ─── Small components ─────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((s, idx) => {
        const Icon      = s.icon;
        const completed = current > s.id;
        const active    = current === s.id;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : active
                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40"
                  : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800"
              }`}>
                {completed
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <Icon className="h-3.5 w-3.5" />}
                {active && (
                  <span className="absolute -inset-1.5 animate-ping rounded-full bg-blue-400 opacity-20" />
                )}
              </div>
              <span className={`hidden text-[10px] font-semibold sm:block ${
                active    ? "text-blue-600 dark:text-blue-400"
                : completed ? "text-emerald-600 dark:text-emerald-400"
                           : "text-slate-400"
              }`}>{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-2 h-px w-8 transition-all duration-500 sm:w-14 ${
                current > s.id ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricTile({ label, value, sub, colorCls, icon: Icon }) {
  return (
    <div className={`rounded-xl border p-3.5 ${colorCls}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 truncate">{label}</p>
          <p className="mt-0.5 text-lg font-black leading-none">{value}</p>
          {sub && <p className="mt-1 text-[10px] opacity-55 leading-tight">{sub}</p>}
        </div>
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 opacity-35 mt-0.5" />}
      </div>
    </div>
  );
}

function ScheduleTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50 dark:bg-slate-800/60">
              {["#", "Due Date", "EMI", "Principal", "Interest", "Balance"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.no} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/30"}`}>
                <td className="px-3 py-2 font-semibold text-slate-400">{r.no}</td>
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.date.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="px-3 py-2 font-bold text-blue-600 dark:text-blue-400">{fmt(Math.round(r.emi))}</td>
                <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400">{fmt(Math.round(r.princ))}</td>
                <td className="px-3 py-2 text-amber-600 dark:text-amber-400">{fmt(Math.round(r.interest))}</td>
                <td className="px-3 py-2 font-medium">{fmt(Math.round(r.bal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplyLoanPage() {
  const searchParams = useSearchParams();
  const productSlug  = searchParams.get("slug") || "";

  // ── Wizard ──
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState(null);

  // ── Data ──
  const [product,        setProduct]        = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [settingsReady,  setSettingsReady]  = useState(false);
  const [loanSettings,   setLoanSettings]   = useState({ minDownPaymentPct: 30, defaultInterest: 10 });

  // ── Loan terms ──
  const [dpPct,         setDpPct]         = useState(30); // down payment as % of price
  const [tenureMonths,  setTenureMonths]  = useState(12);

  // ── Personal ──
  const [nidNumber,     setNidNumber]     = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [jobType,       setJobType]       = useState("");
  const [customerNote,  setCustomerNote]  = useState("");

  // ── UI ──
  const [showSchedule, setShowSchedule]   = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────

  const price      = product ? Number(product.price || 0) : 0;
  const minPct     = loanSettings.minDownPaymentPct;
  const maxPct     = 95;
  const downPayment  = price > 0 ? Math.round((price * dpPct) / 100) : 0;
  const loanAmount   = Math.max(0, price - downPayment);
  const rate         = loanSettings.defaultInterest;
  const emi          = useMemo(() => calcEmi(loanAmount, rate, tenureMonths), [loanAmount, rate, tenureMonths]);
  const totalPayable = emi * tenureMonths + downPayment;
  const totalInterest = Math.max(0, totalPayable - price);
  const schedule     = useMemo(() => loanAmount > 0 ? buildSchedule(loanAmount, rate, tenureMonths) : [], [loanAmount, rate, tenureMonths]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/loans/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings) {
          const min = Number(d.settings.minDownPaymentPct || 30);
          setLoanSettings({ minDownPaymentPct: min, defaultInterest: Number(d.settings.defaultInterest || 10) });
          setDpPct(min);
        }
      })
      .catch(() => {})
      .finally(() => setSettingsReady(true));
  }, []);

  useEffect(() => {
    if (!settingsReady || !productSlug) return;
    setProductLoading(true);
    fetch(`/api/admin/product/slug/${productSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product) setProduct(d.product);
        else setError(d?.message || "Product not found.");
      })
      .catch(() => setError("Failed to load product."))
      .finally(() => setProductLoading(false));
  }, [productSlug, settingsReady]);

  // Keep slider in valid range when settings arrive
  useEffect(() => {
    setDpPct((p) => Math.max(minPct, Math.min(maxPct, p)));
  }, [minPct]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = useCallback(() => {
    setError("");
    if (step === 1) {
      if (!product) return setError("Product not loaded."), false;
      if (Number(product.stockAmount || 0) <= 0) return setError("This product is out of stock."), false;
    }
    if (step === 2) {
      if (dpPct < minPct)         return setError(`Minimum down payment is ${minPct}%.`), false;
      if (dpPct > maxPct)         return setError(`Maximum down payment is ${maxPct}%.`), false;
      if (downPayment >= price)   return setError("Down payment must be less than product price."), false;
      if (loanAmount  <= 0)       return setError("Loan amount must be greater than zero."), false;
    }
    if (step === 3) {
      if (!nidNumber.trim())                              return setError("NID number is required."), false;
      if (!/^\d{10}$|^\d{17}$/.test(nidNumber.trim()))   return setError("NID must be exactly 10 or 17 digits."), false;
      if (!monthlyIncome || Number(monthlyIncome) <= 0)   return setError("Monthly income is required."), false;
      if (!jobType)                                       return setError("Please select your employment type."), false;
    }
    return true;
  }, [step, product, dpPct, minPct, maxPct, downPayment, price, loanAmount, nidNumber, monthlyIncome, jobType]);

  const nextStep = () => { if (validate()) setStep((s) => s + 1); };
  const prevStep = () => { setError(""); setStep((s) => s - 1); };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/loans/apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id, downPayment, tenureMonths,
          nidNumber: nidNumber.trim(), monthlyIncome: Number(monthlyIncome),
          jobType, customerNote: customerNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data?.error || "Submission failed.");
      setSubmittedLoan(data.loan);
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Income-to-EMI ratio ───────────────────────────────────────────────────

  const income        = Number(monthlyIncome) || 0;
  const emiRatio      = income > 0 && emi > 0 ? emi / income : 0;
  const emiRatioLabel = emiRatio > 0.5 ? "Very High — may affect approval" : emiRatio > 0.35 ? "Moderate — acceptable" : emiRatio > 0 ? "Healthy — good standing" : "";
  const emiRatioCls   = emiRatio > 0.5 ? "text-red-500" : emiRatio > 0.35 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS
  // ─────────────────────────────────────────────────────────────────────────

  if (success && submittedLoan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-10 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <BadgeCheck className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-2xl font-black">Application Submitted!</h2>
            <p className="mt-1.5 text-sm text-emerald-100">
              We'll review and contact you within 24–48 hours.
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-4 p-6">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 space-y-2 text-sm">
              {[
                ["Application ID",  `#${submittedLoan.id?.slice(-8).toUpperCase()}`],
                ["Product",          submittedLoan.productName],
                ["Product Price",    fmt(submittedLoan.productPrice)],
                ["Down Payment",     fmt(submittedLoan.downPayment)],
                ["Loan Amount",      fmt(submittedLoan.loanAmount)],
                ["Monthly EMI",      fmt(Math.round(submittedLoan.monthlyEmi))],
                ["Tenure",           `${submittedLoan.tenureMonths} months`],
                ["Total Payable",    fmt(submittedLoan.totalPayable)],
                ["Status",           "Pending Review"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{k}</span>
                  <span className="font-semibold text-right max-w-[55%] truncate">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800 dark:bg-amber-950/30">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Upon approval, down payment of <strong>{fmt(submittedLoan.downPayment)}</strong> must be paid within <strong>48 hours</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/dashboard/loans">View My Applications</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WIZARD
  // ─────────────────────────────────────────────────────────────────────────

  const initLoading = !settingsReady || productLoading;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400">
              <CreditCard className="h-3 w-3" />EMI Loan Application
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Buy Now, Pay Later
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Flexible installments · No hidden charges · Instant decision
            </p>
          </div>

          {/* Step indicator */}
          <StepIndicator current={step} />

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* ──────────────────────────────────────────────────────────────
              STEP 1 — PRODUCT
          ────────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

              {/* Card header */}
              <div className="flex items-center gap-3 border-b bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">Selected Product</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Auto-loaded from product page</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {initLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-14">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-400">Loading product…</p>
                  </div>
                ) : !product ? (
                  <div className="space-y-3">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Product not found. Please apply from the product page.</AlertDescription>
                    </Alert>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Product card */}
                    <div className="flex items-start gap-4 rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 dark:border-slate-700 dark:from-slate-800/40 dark:to-slate-800/20">
                      {product.mainImage && (
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border shadow-sm">
                          <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold leading-snug text-slate-900 dark:text-white line-clamp-2">{product.name}</p>
                        {product.category?.name && (
                          <Badge variant="secondary" className="mt-1.5 text-[10px]">{product.category.name}</Badge>
                        )}
                        <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">{fmt(price)}</p>
                        {Number(product.stockAmount || 0) <= 0 && (
                          <p className="mt-1 text-xs font-semibold text-red-500">⚠ Out of stock</p>
                        )}
                      </div>
                    </div>

                    {/* 3-column stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Min. Down",  value: `${minPct}%`,            icon: Percent    },
                        { label: "Interest",   value: `${rate}% p.a.`,         icon: TrendingUp },
                        { label: "Max Tenure", value: "36 months",             icon: Calendar   },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex flex-col items-center rounded-xl border bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/40">
                          <Icon className="mb-1.5 h-4 w-4 text-slate-400" />
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                        Min down payment <strong>{minPct}% = {fmt(Math.ceil(price * minPct / 100))}</strong>.
                        Max <strong>95% = {fmt(Math.floor(price * maxPct / 100))}</strong>.
                        For full payment, purchase directly without a loan.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────
              STEP 2 — LOAN TERMS
          ────────────────────────────────────────────────────────────── */}
          {step === 2 && product && (
            <div className="space-y-4">

              {/* Product mini recap */}
              <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {product.mainImage && (
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border">
                    <Image src={product.mainImage} alt="" fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    Price: <span className="font-bold text-blue-600 dark:text-blue-400">{fmt(price)}</span>
                  </p>
                </div>
              </div>

              {/* Configurator */}
              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

                <div className="flex items-center gap-3 border-b bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Configure Your Loan</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Slide to customize — updates instantly</p>
                  </div>
                </div>

                <div className="p-6 space-y-7">

                  {/* ── Down Payment Slider ── */}
                  <div className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <Label className="text-sm font-bold">Down Payment</Label>
                        <p className="mt-0.5 text-xs text-slate-400">{minPct}% – {maxPct}% of product price</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-black leading-none text-blue-600 dark:text-blue-400">{fmt(downPayment)}</p>
                        <p className="text-xs font-semibold text-slate-400">{dpPct.toFixed(1)}% of price</p>
                      </div>
                    </div>

                    {/* Slider */}
                    <Slider
                      min={minPct}
                      max={maxPct}
                      step={0.5}
                      value={[dpPct]}
                      onValueChange={([v]) => setDpPct(parseFloat(v.toFixed(1)))}
                      className="w-full"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Min {minPct}% ({fmt(Math.ceil(price * minPct / 100))})</span>
                      <span>Max {maxPct}% ({fmt(Math.floor(price * maxPct / 100))})</span>
                    </div>

                    {/* Manual input fallback */}
                    <div>
                      <Label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Or type exact amount
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
                        <Input
                          type="number"
                          value={downPayment}
                          min={Math.ceil(price * minPct / 100)}
                          max={Math.floor(price * maxPct / 100)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (price > 0) {
                              const pct = Math.min(maxPct, Math.max(minPct, (val / price) * 100));
                              setDpPct(parseFloat(pct.toFixed(1)));
                            }
                          }}
                          className="pl-7 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Visual split bar */}
                    <div className="space-y-1.5">
                      <div className="flex h-4 overflow-hidden rounded-full shadow-inner">
                        <div
                          className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-[9px] font-bold text-white transition-all duration-300"
                          style={{ width: `${dpPct}%` }}
                        >
                          {dpPct >= 20 && `${dpPct.toFixed(0)}%`}
                        </div>
                        <div
                          className="flex items-center justify-center bg-slate-200 text-[9px] font-semibold text-slate-500 transition-all duration-300 dark:bg-slate-700 dark:text-slate-400"
                          style={{ width: `${100 - dpPct}%` }}
                        >
                          {(100 - dpPct) >= 20 && `${(100 - dpPct).toFixed(0)}%`}
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-blue-600 dark:text-blue-400">Your down: {fmt(downPayment)}</span>
                        <span className="text-slate-500 dark:text-slate-400">Loan: {fmt(loanAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ── Tenure Selector ── */}
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <Label className="text-sm font-bold">Loan Tenure</Label>
                        <p className="mt-0.5 text-xs text-slate-400">How long to repay</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black leading-none text-indigo-600 dark:text-indigo-400">
                          {tenureMonths}m
                        </p>
                        <p className="text-xs text-slate-400">
                          {tenureMonths >= 12
                            ? `${tenureMonths % 12 === 0 ? tenureMonths / 12 : (tenureMonths / 12).toFixed(1)} yr`
                            : `${tenureMonths} months`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {TENURE_OPTIONS.map(({ months, label }) => {
                        const sel = tenureMonths === months;
                        return (
                          <button
                            key={months}
                            type="button"
                            onClick={() => setTenureMonths(months)}
                            className={`flex flex-col items-center rounded-xl border py-3 px-1 text-center transition-all duration-200 ${
                              sel
                                ? "scale-105 border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40"
                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-600"
                            }`}
                          >
                            <span className="text-sm font-black">{label}</span>
                            <span className={`mt-0.5 text-[9px] leading-none ${sel ? "text-indigo-200" : "text-slate-400"}`}>
                              {months}mo
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* ── Live EMI Metrics ── */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Loan Breakdown</p>

                    <div className="grid grid-cols-2 gap-3">
                      <MetricTile
                        label="Monthly EMI"
                        value={fmt(Math.round(emi))}
                        sub={`for ${tenureMonths} months`}
                        colorCls="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/40 text-blue-700 dark:border-blue-900/40 dark:from-blue-950/40 dark:to-indigo-950/20 dark:text-blue-300"
                        icon={CreditCard}
                      />
                      <MetricTile
                        label="Loan Amount"
                        value={fmt(loanAmount)}
                        sub="principal borrowed"
                        colorCls="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                        icon={Banknote}
                      />
                      <MetricTile
                        label="Total Interest"
                        value={fmt(Math.round(totalInterest))}
                        sub={loanAmount > 0 ? `${((totalInterest / loanAmount) * 100).toFixed(1)}% of principal` : ""}
                        colorCls="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
                        icon={TrendingUp}
                      />
                      <MetricTile
                        label="Total Payable"
                        value={fmt(Math.round(totalPayable))}
                        sub="incl. down payment"
                        colorCls="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                        icon={ReceiptText}
                      />
                    </div>
                  </div>

                  {/* ── Amortization Schedule Toggle ── */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSchedule((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2 text-xs">
                        <ReceiptText className="h-4 w-4 text-slate-400" />
                        Repayment Schedule — {tenureMonths} installments
                      </span>
                      {showSchedule
                        ? <ChevronUp className="h-4 w-4 text-slate-400" />
                        : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>

                    {showSchedule && schedule.length > 0 && (
                      <div className="mt-3">
                        <ScheduleTable rows={schedule} />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────
              STEP 3 — PERSONAL INFO
          ────────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

              <div className="flex items-center gap-3 border-b bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">Personal Information</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Used for eligibility verification only</p>
                </div>
              </div>

              <div className="p-6 space-y-5">

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* NID */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      NID Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="10 or 17 digits"
                      maxLength={17}
                      className="font-mono tracking-widest"
                    />
                    <p className={`text-[10px] font-semibold ${
                      nidNumber.length === 10 || nidNumber.length === 17
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400"
                    }`}>
                      {nidNumber.length}/17 digits
                      {(nidNumber.length === 10 || nidNumber.length === 17) && " ✓ valid length"}
                    </p>
                  </div>

                  {/* Income */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Monthly Income (৳) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <Input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        className="pl-7 font-semibold"
                        placeholder="e.g. 25000"
                        min={0}
                      />
                    </div>
                    {emiRatio > 0 && (
                      <p className={`text-[10px] font-semibold ${emiRatioCls}`}>
                        EMI is {(emiRatio * 100).toFixed(0)}% of income — {emiRatioLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Job Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Employment Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Additional Note
                    <span className="ml-1 font-normal text-slate-400">(optional)</span>
                  </Label>
                  <Textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Anything you'd like us to know…"
                    rows={3}
                    maxLength={500}
                    className="resize-none text-sm"
                  />
                  <p className="text-right text-[10px] text-slate-400">{customerNote.length}/500</p>
                </div>

                {/* Security notice */}
                <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                    Your information is encrypted and stored securely. It is used only for loan eligibility assessment and will never be shared with third parties.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────
              STEP 4 — REVIEW & SUBMIT
          ────────────────────────────────────────────────────────────── */}
          {step === 4 && product && (
            <div className="space-y-4">

              {/* Hero EMI banner */}
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Your EMI Plan</p>
                <p className="mt-1 text-4xl font-black">
                  {fmt(Math.round(emi))}
                  <span className="ml-1.5 text-lg font-medium text-blue-200">/month</span>
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                  {[
                    ["Down Payment", fmt(downPayment)],
                    ["Loan Amount",  fmt(loanAmount)],
                    ["Tenure",       `${tenureMonths} months`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] font-medium text-blue-300">{k}</p>
                      <p className="mt-0.5 text-sm font-bold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail review card */}
              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

                <div className="flex items-center gap-3 border-b bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Review & Confirm</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verify all details before submitting</p>
                  </div>
                </div>

                <div className="divide-y dark:divide-slate-700/60 px-6">

                  {/* Product section */}
                  <div className="py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</p>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                      {product.mainImage && (
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border">
                          <Image src={product.mainImage} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="text-base font-black text-blue-600 dark:text-blue-400">{fmt(price)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial section */}
                  <div className="py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Loan Details</p>
                    <div className="space-y-0 divide-y dark:divide-slate-700/40">
                      {[
                        ["Product Price",   fmt(price),                     ""],
                        ["Down Payment",    fmt(downPayment),               "font-bold text-blue-600 dark:text-blue-400"],
                        ["Loan Amount",     fmt(loanAmount),                "font-bold"],
                        ["Interest Rate",   `${rate}% per annum`,          ""],
                        ["Loan Tenure",     `${tenureMonths} months`,       ""],
                        ["Monthly EMI",     fmt(Math.round(emi)),           "font-bold text-blue-600 dark:text-blue-400"],
                        ["Total Interest",  fmt(Math.round(totalInterest)), "text-amber-600 dark:text-amber-400"],
                        ["Total Payable",   fmt(Math.round(totalPayable)),  "font-bold"],
                      ].map(([k, v, cls]) => (
                        <div key={k} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-slate-500 dark:text-slate-400">{k}</span>
                          <span className={cls || "font-medium"}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personal section */}
                  <div className="py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Personal Info</p>
                    <div className="space-y-0 divide-y dark:divide-slate-700/40">
                      {[
                        ["NID Number",     nidNumber],
                        ["Monthly Income", fmt(Number(monthlyIncome))],
                        ["Job Type",       jobType],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-slate-500 dark:text-slate-400">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {customerNote && (
                    <div className="py-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Note</p>
                      <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-500 dark:bg-slate-800/40">{customerNote}</p>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="py-4">
                    <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 dark:border-amber-900/30 dark:bg-amber-950/10">
                      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                        By submitting, you agree to our loan terms. Upon approval, your down payment of{" "}
                        <strong>{fmt(downPayment)}</strong> must be paid within <strong>48 hours</strong>.
                        Failure to do so will automatically cancel the application.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between gap-3 pb-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />Back
            </Button>

            {step < STEPS.length ? (
              <Button
                onClick={nextStep}
                disabled={initLoading}
                className="gap-2 bg-blue-600 px-6 hover:bg-blue-700"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
                  : <><BadgeCheck className="h-4 w-4" />Submit Application</>}
              </Button>
            )}
          </div>

          <p className="pb-2 text-center text-xs text-slate-400">Step {step} of {STEPS.length}</p>
        </div>
      </div>
    </TooltipProvider>
  );
}