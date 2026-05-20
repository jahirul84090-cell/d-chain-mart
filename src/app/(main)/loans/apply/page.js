/**
 * File: app/loans/apply/page.jsx
 *
 * Loan Application Wizard — Production Level
 *
 * Loan Plans:
 *   • 3-Month Plan — 10% annual interest (cheaper, faster payoff)
 *   • 6-Month Plan — 20% annual interest (lower monthly EMI, longer)
 *
 * Down Payment:
 *   Any positive amount strictly less than product price.
 *   No minimum percentage — full freedom.
 *
 * Steps:
 *   1. Product Review      — auto-loaded from ?slug=
 *   2. Loan Configurator   — plan selector + free down payment slider/input
 *   3. Personal & Nominee  — applicant + guarantor info
 *   4. Document Upload     — NID front/back, selfie, nominee photo via ImageKit
 *   5. Review & Submit     — full summary with plan comparison
 */

"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link  from "next/link";

import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Textarea }  from "@/components/ui/textarea";
import { Badge }     from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress }  from "@/components/ui/progress";
import { Slider }    from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Package, CreditCard, User, IdCard, FileText, CheckCircle2, ChevronLeft,
  ChevronRight, BadgeCheck, Loader2, AlertCircle, Info, ShieldCheck, Clock,
  TrendingUp, Banknote, Calendar, ReceiptText, Upload, X, Camera, MapPin,
  Phone, UserCheck, CheckCheck, ImageIcon, Zap, Star, ArrowRight,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Product",   icon: Package    },
  { id: 2, label: "Loan Plan", icon: CreditCard },
  { id: 3, label: "Personal",  icon: User       },
  { id: 4, label: "Documents", icon: IdCard     },
  { id: 5, label: "Review",    icon: FileText   },
];

// Two hard-coded loan plans
const LOAN_PLANS = [
  {
    months:      3,
    annualRate:  10,
    label:       "3-Month Plan",
    shortLabel:  "3M",
    badge:       "Best Value",
    badgeCls:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon:        Zap,
    accent:      "border-emerald-400 dark:border-emerald-600",
    headerCls:   "from-emerald-500 to-teal-600",
    textCls:     "text-emerald-600 dark:text-emerald-400",
    bgCls:       "bg-emerald-50 dark:bg-emerald-950/20",
    ringCls:     "ring-emerald-400 dark:ring-emerald-600",
    description: "Pay off quickly with the lowest interest rate.",
    pros:        ["Lowest 10% annual interest", "Debt-free in 3 months", "Minimal total cost"],
  },
  {
    months:      6,
    annualRate:  20,
    label:       "6-Month Plan",
    shortLabel:  "6M",
    badge:       "Flexible",
    badgeCls:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    icon:        Star,
    accent:      "border-blue-400 dark:border-blue-600",
    headerCls:   "from-blue-500 to-indigo-600",
    textCls:     "text-blue-600 dark:text-blue-400",
    bgCls:       "bg-blue-50 dark:bg-blue-950/20",
    ringCls:     "ring-blue-400 dark:ring-blue-600",
    description: "Lower monthly payments spread over 6 months.",
    pros:        ["Lower monthly EMI", "More breathing room", "6-month flexibility"],
  },
];

const JOB_TYPES = [
  "Government Employee", "Private Employee", "Business Owner",
  "Freelancer", "Teacher", "Doctor", "Engineer", "Retired", "Other",
];

const RELATION_TYPES = [
  "Father", "Mother", "Spouse", "Brother", "Sister",
  "Son", "Daughter", "Uncle", "Aunt", "Friend", "Other",
];

const DOC_SLOTS = [
  { key: "nid_front",     label: "NID Front",       hint: "Front side of your National ID Card", icon: IdCard,    color: "blue"   },
  { key: "nid_back",      label: "NID Back",        hint: "Back side of your National ID Card",  icon: IdCard,    color: "indigo" },
  { key: "selfie",        label: "Selfie with NID", hint: "Hold your NID beside your face",       icon: Camera,    color: "violet" },
  { key: "nominee_photo", label: "Nominee Photo",   hint: "Clear portrait photo of your nominee", icon: UserCheck, color: "rose"   },
];

const MAX_BYTES    = 1 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (n) => `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
const f2   = (n) => parseFloat(parseFloat(n).toFixed(2));
const fmtBytes = (b) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(2)} MB`;

function calcEmi(principal, annualPct, months) {
  if (!principal || !months) return 0;
  const mr = annualPct / 100 / 12;
  if (mr === 0) return principal / months;
  return (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
}

function buildSchedule(principal, annualPct, months, firstDueDate) {
  const mr = annualPct / 100 / 12;
  const emi = calcEmi(principal, annualPct, months);
  let bal = principal;
  return Array.from({ length: months }, (_, i) => {
    const interest = f2(bal * mr);
    const princ    = f2(emi - interest);
    bal = f2(Math.max(0, bal - princ));
    const d = new Date(firstDueDate);
    d.setMonth(d.getMonth() + i);
    return { no: i + 1, date: d, emi: f2(emi), princ, interest, bal };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((s, idx) => {
        const Icon = s.icon, done = current > s.id, active = current === s.id;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                done   ? "border-emerald-500 bg-emerald-500 text-white"
                : active ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40"
                         : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800"
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                {active && <span className="absolute -inset-1.5 animate-ping rounded-full bg-blue-400 opacity-20" />}
              </div>
              <span className={`hidden text-[10px] font-semibold sm:block ${
                active ? "text-blue-600 dark:text-blue-400" : done ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
              }`}>{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-1 h-px w-5 transition-all duration-500 sm:w-9 ${current > s.id ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ icon: Icon, iconCls, title, sub, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconCls}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold">{title}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function MetricTile({ label, value, sub, cls, icon: Icon }) {
  return (
    <div className={`rounded-xl border p-3.5 ${cls}`}>
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p>
          <p className="mt-0.5 text-lg font-black leading-none">{value}</p>
          {sub && <p className="mt-1 text-[10px] opacity-55">{sub}</p>}
        </div>
        {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-35" />}
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
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.no} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/30"}`}>
                <td className="px-3 py-2.5 font-semibold text-slate-400">{r.no}</td>
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">{r.date.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="px-3 py-2.5 font-bold text-blue-600 dark:text-blue-400">{fmt(Math.round(r.emi))}</td>
                <td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400">{fmt(Math.round(r.princ))}</td>
                <td className="px-3 py-2.5 text-amber-600 dark:text-amber-400">{fmt(Math.round(r.interest))}</td>
                <td className="px-3 py-2.5 font-medium">{fmt(Math.round(r.bal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DocSlot component ────────────────────────────────────────────────────────

function DocSlot({ slot, uploaded, onUpload, onRemove }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");
  const [pct,  setPct]  = useState(0);
  const Icon = slot.icon;
  const done = !!uploaded?.url;

  const COLORS = {
    blue:   { border: "border-blue-200 dark:border-blue-800",    head: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-600 dark:text-blue-400",    icon: "bg-blue-100 dark:bg-blue-900/40"    },
    indigo: { border: "border-indigo-200 dark:border-indigo-800",head: "bg-indigo-50 dark:bg-indigo-950/30",text: "text-indigo-600 dark:text-indigo-400",icon: "bg-indigo-100 dark:bg-indigo-900/40" },
    violet: { border: "border-violet-200 dark:border-violet-800",head: "bg-violet-50 dark:bg-violet-950/30",text: "text-violet-600 dark:text-violet-400",icon: "bg-violet-100 dark:bg-violet-900/40" },
    rose:   { border: "border-rose-200 dark:border-rose-800",    head: "bg-rose-50 dark:bg-rose-950/30",    text: "text-rose-600 dark:text-rose-400",    icon: "bg-rose-100 dark:bg-rose-900/40"    },
  };
  const c = COLORS[slot.color] || COLORS.blue;

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setPct(0);

    if (!ALLOWED_MIME.includes(file.type)) { setErr("Only JPG or PNG images are accepted."); e.target.value = ""; return; }
    if (file.size > MAX_BYTES) { setErr(`File too large (${fmtBytes(file.size)}). Max 1 MB.`); e.target.value = ""; return; }

    setBusy(true);
    const ticker = setInterval(() => setPct((p) => Math.min(p + 12, 85)), 150);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", slot.key);
      const res  = await fetch("/api/loans/upload", { method: "POST", body: form });
      const data = await res.json();
      clearInterval(ticker); setPct(100);
      if (!res.ok) { setErr(data.error || "Upload failed. Please try again."); return; }
      onUpload(slot.key, { url: data.url, fileId: data.fileId, preview: URL.createObjectURL(file) });
    } catch { setErr("Network error. Please try again."); }
    finally { clearInterval(ticker); setBusy(false); e.target.value = ""; }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border-2 transition-all duration-200 ${done ? "border-emerald-400 dark:border-emerald-600" : `${c.border} border-dashed`}`}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={pick} disabled={busy} />

      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${done ? "bg-emerald-50 dark:bg-emerald-950/20" : c.head}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${done ? "bg-emerald-100 dark:bg-emerald-900/40" : c.icon}`}>
            <Icon className={`h-3.5 w-3.5 ${done ? "text-emerald-600 dark:text-emerald-400" : c.text}`} />
          </div>
          <span className={`text-[11px] font-bold ${done ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>{slot.label}</span>
        </div>
        {done && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCheck className="h-3 w-3" />Done
          </span>
        )}
      </div>

      {/* Body */}
      <div className="bg-white p-3 space-y-2.5 dark:bg-slate-900">
        {done && uploaded?.preview ? (
          <div className="relative">
            <div className="relative h-32 w-full overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-800">
              <Image src={uploaded.preview} alt={slot.label} fill className="object-cover" />
            </div>
            <button type="button"
              onClick={() => { setErr(""); setPct(0); onRemove(slot.key); }}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div onClick={() => !busy && inputRef.current?.click()}
            className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border bg-slate-50 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800 ${busy ? "cursor-wait opacity-60" : ""}`}>
            {busy
              ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              : <><Upload className={`h-5 w-5 ${c.text}`} /><p className="text-xs font-semibold text-slate-400">Click to upload</p></>}
          </div>
        )}

        {busy && (
          <div className="space-y-1">
            <Progress value={pct} className="h-1.5" />
            <p className="text-center text-[10px] text-slate-400">Uploading {pct}%…</p>
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-slate-400">{slot.hint}</p>

        <div className="flex flex-wrap gap-1">
          {["JPG / PNG", "Max 1 MB"].map((t) => (
            <span key={t} className="rounded-full border bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800">{t}</span>
          ))}
        </div>

        {err && (
          <div className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 dark:border-red-800 dark:bg-red-950/30">
            <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
            <p className="text-[11px] text-red-600 dark:text-red-400">{err}</p>
          </div>
        )}

        <Button type="button" variant="outline" size="sm" className="w-full h-7 text-xs"
          onClick={() => inputRef.current?.click()} disabled={busy}>
          <Upload className="mr-1.5 h-3 w-3" />{done ? "Re-upload" : "Select Photo"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplyLoanPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";

  // ── Wizard ──
  const [step,      setStep]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // ── Product & settings ──
  const [product,       setProduct]       = useState(null);
  const [productBusy,   setProductBusy]   = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [sysSettings,   setSysSettings]   = useState({ firstEmiDelayDays: 30, gracePeriodDays: 3, lateFee: 100 });

  // ── Step 2: Loan configurator ──
  const [selectedPlan, setSelectedPlan] = useState(LOAN_PLANS[0]); // default 3M
  const [downPayment,  setDownPayment]  = useState("");             // free amount
  const [showSchedule, setShowSchedule] = useState(false);

  // ── Step 3: Personal info ──
  const [applicantName,    setApplicantName]    = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [nidNumber,        setNidNumber]        = useState("");
  const [monthlyIncome,    setMonthlyIncome]    = useState("");
  const [jobType,          setJobType]          = useState("");
  const [customerNote,     setCustomerNote]     = useState("");
  // Nominee
  const [nomineeName,     setNomineeName]     = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");
  const [nomineePhone,    setNomineePhone]    = useState("");
  const [nomineeAddress,  setNomineeAddress]  = useState("");

  // ── Step 4: Documents ──
  const [docs, setDocs] = useState({});

  // ── Derived ──
  const price      = product ? Number(product.price || 0) : 0;
  const dp         = parseFloat(downPayment) || 0;
  const loanAmount = Math.max(0, f2(price - dp));
  const plan       = selectedPlan;
  const emi        = useMemo(() => calcEmi(loanAmount, plan.annualRate, plan.months), [loanAmount, plan]);
  const totalPayable  = f2(emi * plan.months + dp);
  const totalInterest = Math.max(0, f2(totalPayable - price));
  const dpPct         = price > 0 ? f2((dp / price) * 100) : 0;
  const income        = Number(monthlyIncome) || 0;
  const emiRatio      = income > 0 && emi > 0 ? emi / income : 0;
  const allDocs       = DOC_SLOTS.every((s) => docs[s.key]?.url);
  const docsCount     = DOC_SLOTS.filter((s) => docs[s.key]?.url).length;

  // First due date preview
  const firstDueDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + sysSettings.firstEmiDelayDays);
    return d;
  }, [sysSettings.firstEmiDelayDays]);

  const schedule = useMemo(
    () => loanAmount > 0 ? buildSchedule(loanAmount, plan.annualRate, plan.months, firstDueDate) : [],
    [loanAmount, plan, firstDueDate]
  );

  // ── Effects ──
  useEffect(() => {
    fetch("/api/loans/settings").then((r) => r.json()).then((d) => {
      if (d?.settings) setSysSettings({ firstEmiDelayDays: d.settings.firstEmiDelayDays, gracePeriodDays: d.settings.gracePeriodDays, lateFee: d.settings.lateFee });
    }).catch(() => {}).finally(() => setSettingsReady(true));
  }, []);

  useEffect(() => {
    if (!settingsReady || !slug) return;
    setProductBusy(true);
    fetch(`/api/admin/product/slug/${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d?.product) setProduct(d.product); else setError(d?.message || "Product not found."); })
      .catch(() => setError("Failed to load product."))
      .finally(() => setProductBusy(false));
  }, [slug, settingsReady]);

  const handleDocUpload = useCallback((key, data) => setDocs((p) => ({ ...p, [key]: data })), []);
  const handleDocRemove = useCallback((key) => setDocs((p) => { const n = { ...p }; delete n[key]; return n; }), []);

  // ── Validation ──
  const validate = useCallback(() => {
    setError("");
    if (step === 1) {
      if (!product) return setError("Product not loaded."), false;
      if (Number(product.stockAmount || 0) <= 0) return setError("This product is out of stock."), false;
    }
    if (step === 2) {
      if (!downPayment || dp <= 0) return setError("Please enter your down payment amount."), false;
      if (dp >= price) return setError("Down payment must be less than the product price."), false;
      if (loanAmount <= 0) return setError("Loan amount must be greater than zero."), false;
    }
    if (step === 3) {
      if (!applicantName.trim() || applicantName.trim().length < 3) return setError("Full name must be at least 3 characters."), false;
      if (!applicantAddress.trim() || applicantAddress.trim().length < 10) return setError("Address must be at least 10 characters."), false;
      if (!nidNumber.trim()) return setError("NID number is required."), false;
      if (!/^\d{10}$|^\d{17}$/.test(nidNumber.trim())) return setError("NID must be exactly 10 or 17 digits."), false;
      if (!monthlyIncome || Number(monthlyIncome) <= 0) return setError("Monthly income is required."), false;
      if (!jobType) return setError("Please select employment type."), false;
      if (!nomineeName.trim() || nomineeName.trim().length < 3) return setError("Nominee name must be at least 3 characters."), false;
      if (!nomineeRelation) return setError("Nominee relation is required."), false;
      if (!nomineePhone.trim() || !/^01[3-9]\d{8}$/.test(nomineePhone.trim())) return setError("Nominee phone must be a valid BD number (01XXXXXXXXX)."), false;
      if (!nomineeAddress.trim() || nomineeAddress.trim().length < 10) return setError("Nominee address must be at least 10 characters."), false;
    }
    if (step === 4) {
      const missing = DOC_SLOTS.filter((s) => !docs[s.key]?.url).map((s) => s.label);
      if (missing.length) return setError(`Please upload: ${missing.join(", ")}.`), false;
    }
    return true;
  }, [step, product, dp, price, loanAmount, downPayment, applicantName, applicantAddress, nidNumber, monthlyIncome, jobType, nomineeName, nomineeRelation, nomineePhone, nomineeAddress, docs]);

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const prev = () => { setError(""); setStep((s) => s - 1); };

  // ── Submit ──
  const submit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/loans/apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          downPayment: dp,
          tenureMonths: plan.months,
          nidNumber: nidNumber.trim(),
          monthlyIncome: Number(monthlyIncome),
          jobType,
          customerNote: customerNote.trim() || undefined,
          applicantName: applicantName.trim(),
          applicantAddress: applicantAddress.trim(),
          nomineeName: nomineeName.trim(),
          nomineeRelation,
          nomineePhone: nomineePhone.trim(),
          nomineeAddress: nomineeAddress.trim(),
          documents: DOC_SLOTS.map((s) => ({
            type: s.key, url: docs[s.key].url,
            fileId: docs[s.key].fileId || "", title: s.label,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data?.error || "Submission failed.");
      setSubmitted(data.loan); setSuccess(true);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const initBusy = !settingsReady || productBusy;

  // ── Comparison: both plans at current dp ──
  const planComparison = useMemo(() => {
    if (!loanAmount) return null;
    return LOAN_PLANS.map((p) => {
      const e = calcEmi(loanAmount, p.annualRate, p.months);
      const tp = f2(e * p.months + dp);
      return { ...p, emi: f2(e), totalPayable: tp, totalInterest: f2(Math.max(0, tp - price)) };
    });
  }, [loanAmount, dp, price]);

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  if (success && submitted) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className={`bg-gradient-to-br ${selectedPlan.headerCls} px-8 py-10 text-center text-white`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <BadgeCheck className="h-9 w-9 text-white" />
          </div>
          <h2 className="text-2xl font-black">Application Submitted!</h2>
          <p className="mt-1.5 text-sm opacity-80">We'll review and contact you within 24–48 hours.</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 space-y-2 text-sm">
            {[
              ["Application ID",  `#${submitted.id?.slice(-8).toUpperCase()}`],
              ["Product",          submitted.productName],
              ["Product Price",    fmt(submitted.productPrice)],
              ["Down Payment",     fmt(submitted.downPayment)],
              ["Loan Amount",      fmt(submitted.loanAmount)],
              ["Plan",             `${submitted.tenureMonths}-Month @ ${submitted.interestRate}% p.a.`],
              ["Monthly EMI",      fmt(Math.round(submitted.monthlyEmi))],
              ["Total Payable",    fmt(submitted.totalPayable)],
              ["Status",           "Pending Review"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b pb-1.5 last:border-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400">{k}</span>
                <span className="max-w-[55%] truncate text-right font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800 dark:bg-amber-950/30">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              Upon approval, your down payment of <strong>{fmt(submitted.downPayment)}</strong> must be paid within <strong>48 hours</strong> to activate the loan.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className={`w-full bg-gradient-to-r ${selectedPlan.headerCls} text-white border-0`}>
              <Link href="/dashboard/loans">View My Applications</Link>
            </Button>
            <Button variant="outline" asChild className="w-full"><Link href="/">Back to Home</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // WIZARD
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400">
              <CreditCard className="h-3 w-3" />EMI Loan Application
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Buy Now, Pay Later</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose 3 or 6 months · Any down payment · Quick approval</p>
          </div>

          <StepBar current={step} />

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 1 — PRODUCT REVIEW
          ══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <SectionCard icon={Package} iconCls="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" title="Selected Product" sub="Review the product you're financing">
              {initBusy ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-slate-400">Loading product…</p>
                </div>
              ) : !product ? (
                <div className="space-y-3">
                  <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Product not found. Please apply from the product page.</AlertDescription></Alert>
                  <Button variant="outline" asChild className="w-full"><Link href="/">Browse Products</Link></Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Product card */}
                  <div className="flex items-start gap-4 rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 dark:border-slate-700 dark:from-slate-800/40 dark:to-slate-800/20">
                    {product.mainImage && (
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border shadow-sm">
                        <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-bold leading-snug">{product.name}</p>
                      {product.category?.name && <Badge variant="secondary" className="mt-1.5 text-[10px]">{product.category.name}</Badge>}
                      <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">{fmt(price)}</p>
                      {Number(product.stockAmount || 0) <= 0 && <p className="mt-1 text-xs font-semibold text-red-500">⚠ Out of stock</p>}
                    </div>
                  </div>

                  {/* Plan overview cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {LOAN_PLANS.map((p) => {
                      const Icon = p.icon;
                      return (
                        <div key={p.months} className={`rounded-xl border-2 p-4 ${p.accent} bg-white dark:bg-slate-900`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${p.bgCls}`}>
                              <Icon className={`h-3.5 w-3.5 ${p.textCls}`} />
                            </div>
                            <span className="text-sm font-bold">{p.label}</span>
                          </div>
                          <p className={`text-2xl font-black ${p.textCls}`}>{p.annualRate}%</p>
                          <p className="text-xs text-slate-500 mt-0.5">annual interest</p>
                          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${p.badgeCls}`}>{p.badge}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                      Pay any amount as down payment — no minimum required. You'll upload NID photos and a nominee photo in step 4.
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 2 — LOAN CONFIGURATOR
          ══════════════════════════════════════════════════════════════ */}
          {step === 2 && product && (
            <div className="space-y-4">
              {/* Product mini-bar */}
              <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {product.mainImage && <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border"><Image src={product.mainImage} alt="" fill className="object-cover" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">Price: <span className="font-bold text-blue-600 dark:text-blue-400">{fmt(price)}</span></p>
                </div>
              </div>

              {/* Plan selector */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Choose Your Plan</p>
                <div className="grid grid-cols-2 gap-3">
                  {LOAN_PLANS.map((p) => {
                    const Icon = p.icon;
                    const sel  = selectedPlan.months === p.months;
                    const previewEmi = loanAmount > 0 ? calcEmi(loanAmount, p.annualRate, p.months) : 0;
                    return (
                      <button key={p.months} type="button" onClick={() => setSelectedPlan(p)}
                        className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                          sel ? `${p.accent} ring-2 ${p.ringCls} ring-offset-2 shadow-lg` : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 hover:border-slate-300"
                        }`}>
                        {sel && (
                          <div className={`absolute right-0 top-0 px-2 py-1 text-[9px] font-black text-white bg-gradient-to-r ${p.headerCls}`}>
                            SELECTED
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${p.bgCls}`}>
                            <Icon className={`h-4 w-4 ${p.textCls}`} />
                          </div>
                          <div>
                            <p className="text-sm font-black">{p.label}</p>
                            <span className={`text-[10px] font-bold ${p.badgeCls} rounded-full px-1.5 py-0.5`}>{p.badge}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Interest rate</span>
                            <span className={`font-bold ${p.textCls}`}>{p.annualRate}% p.a.</span>
                          </div>
                          {loanAmount > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Monthly EMI</span>
                              <span className={`font-black ${p.textCls}`}>{fmt(Math.round(previewEmi))}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Duration</span>
                            <span className="font-semibold">{p.months} months</span>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1">
                          {p.pros.map((pro) => (
                            <li key={pro} className="flex items-start gap-1.5 text-[10px] text-slate-500">
                              <CheckCircle2 className={`mt-0.5 h-3 w-3 flex-shrink-0 ${p.textCls}`} />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Down payment — free input */}
              <SectionCard icon={Banknote} iconCls="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" title="Down Payment" sub="Pay any amount — no minimum required">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <Label className="text-sm font-bold">Enter Down Payment</Label>
                        <p className="mt-0.5 text-xs text-slate-400">Any amount from ৳1 to {fmt(price - 1)}</p>
                      </div>
                      <div className="text-right">
                        {dp > 0 && <p className="text-xs font-semibold text-slate-400">{dpPct.toFixed(1)}% of price</p>}
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">৳</span>
                      <Input
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className="h-14 pl-8 text-xl font-black tracking-tight"
                        placeholder="0"
                        min={1}
                        max={price - 1}
                      />
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-400">Quick select</p>
                      <div className="flex flex-wrap gap-2">
                        {[10, 20, 30, 50, 70].map((pct) => {
                          const amt = Math.round(price * pct / 100);
                          const active = dp === amt;
                          return (
                            <button key={pct} type="button"
                              onClick={() => setDownPayment(String(amt))}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                                active
                                  ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}>
                              {pct}% <span className="opacity-70">({fmt(amt)})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Visual split bar */}
                  {dp > 0 && dp < price && (
                    <div className="space-y-1.5">
                      <div className="flex h-5 overflow-hidden rounded-full shadow-inner">
                        <div
                          className="flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 text-[9px] font-black text-white transition-all duration-300"
                          style={{ width: `${Math.min(100, dpPct)}%` }}>
                          {dpPct >= 12 && `${dpPct.toFixed(0)}%`}
                        </div>
                        <div
                          className="flex items-center justify-center bg-slate-200 text-[9px] font-bold text-slate-500 transition-all duration-300 dark:bg-slate-700 dark:text-slate-400"
                          style={{ width: `${Math.max(0, 100 - dpPct)}%` }}>
                          {(100 - dpPct) >= 12 && `${(100 - dpPct).toFixed(0)}%`}
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">Down: {fmt(dp)}</span>
                        <span className="text-slate-500">Loan: {fmt(loanAmount)}</span>
                      </div>
                    </div>
                  )}

                  {/* Live EMI metrics */}
                  {dp > 0 && dp < price && loanAmount > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {plan.label} · {plan.annualRate}% p.a.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricTile label="Monthly EMI" value={fmt(Math.round(emi))} sub={`for ${plan.months} months`} icon={CreditCard}
                            cls={`${plan.bgCls} border ${plan.accent} ${plan.textCls}`} />
                          <MetricTile label="Loan Amount" value={fmt(loanAmount)} sub="principal" icon={Banknote}
                            cls="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300" />
                          <MetricTile label="Total Interest" value={fmt(Math.round(totalInterest))} sub={`${((totalInterest / loanAmount) * 100).toFixed(1)}% of loan`} icon={TrendingUp}
                            cls="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300" />
                          <MetricTile label="Total Payable" value={fmt(Math.round(totalPayable))} sub="incl. down payment" icon={ReceiptText}
                            cls="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300" />
                        </div>
                      </div>

                      {/* Plan comparison */}
                      {planComparison && (
                        <>
                          <Separator />
                          <div>
                            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan Comparison</p>
                            <div className="overflow-hidden rounded-xl border">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-slate-50 dark:bg-slate-800/60">
                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Plan</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Rate</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Monthly EMI</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Total Interest</th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Total Pay</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {planComparison.map((p) => {
                                    const sel = selectedPlan.months === p.months;
                                    return (
                                      <tr key={p.months} onClick={() => setSelectedPlan(LOAN_PLANS.find((x) => x.months === p.months))}
                                        className={`border-b last:border-0 cursor-pointer transition-colors ${sel ? `${p.bgCls}` : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
                                        <td className="px-3 py-2.5">
                                          <span className={`font-bold ${p.textCls}`}>{p.shortLabel}</span>
                                          {sel && <span className="ml-1.5 text-[9px] font-black text-white bg-gradient-to-r from-blue-500 to-indigo-500 px-1.5 py-0.5 rounded">SELECTED</span>}
                                        </td>
                                        <td className={`px-3 py-2.5 text-right font-bold ${p.textCls}`}>{p.annualRate}%</td>
                                        <td className={`px-3 py-2.5 text-right font-black ${p.textCls}`}>{fmt(Math.round(p.emi))}</td>
                                        <td className="px-3 py-2.5 text-right text-amber-600 dark:text-amber-400">{fmt(Math.round(p.totalInterest))}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold">{fmt(Math.round(p.totalPayable))}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <p className="mt-1.5 text-[10px] text-slate-400">Click a row to switch plan</p>
                          </div>
                        </>
                      )}

                      {/* Repayment schedule toggle */}
                      <div>
                        <button type="button" onClick={() => setShowSchedule((v) => !v)}
                          className="flex w-full items-center justify-between rounded-xl border bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800">
                          <span className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-slate-400" />Repayment Schedule ({plan.months} installments)</span>
                          {showSchedule
                            ? <ChevronRight className="h-4 w-4 rotate-90 text-slate-400 transition-transform" />
                            : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        </button>
                        {showSchedule && schedule.length > 0 && <div className="mt-3"><ScheduleTable rows={schedule} /></div>}
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 3 — PERSONAL + NOMINEE
          ══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Applicant */}
              <SectionCard icon={User} iconCls="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" title="Applicant Information" sub="Your personal details for verification">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name (as on NID) <span className="text-red-500">*</span></Label>
                    <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="e.g. Md. Jahirul Islam" className="font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current Address <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Textarea value={applicantAddress} onChange={(e) => setApplicantAddress(e.target.value)} placeholder="House, Road, Area, District" rows={2} className="resize-none pl-9 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">NID Number <span className="text-red-500">*</span></Label>
                      <Input value={nidNumber} onChange={(e) => setNidNumber(e.target.value.replace(/\D/g, ""))} placeholder="10 or 17 digits" maxLength={17} className="font-mono tracking-widest" />
                      <p className={`text-[10px] font-semibold ${nidNumber.length === 10 || nidNumber.length === 17 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        {nidNumber.length}/17{(nidNumber.length === 10 || nidNumber.length === 17) ? " ✓ valid" : ""}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Monthly Income (৳) <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                        <Input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="pl-7 font-semibold" placeholder="e.g. 25000" min={0} />
                      </div>
                      {emiRatio > 0 && (
                        <p className={`text-[10px] font-semibold ${emiRatio > 0.5 ? "text-red-500" : emiRatio > 0.35 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          EMI = {(emiRatio * 100).toFixed(0)}% of income — {emiRatio > 0.5 ? "Very High ⚠" : emiRatio > 0.35 ? "Moderate" : "Healthy ✓"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Employment Type <span className="text-red-500">*</span></Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Additional Note <span className="ml-1 font-normal text-slate-400">(optional)</span></Label>
                    <Textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="Anything you'd like us to know…" rows={2} maxLength={500} className="resize-none text-sm" />
                    <p className="text-right text-[10px] text-slate-400">{customerNote.length}/500</p>
                  </div>
                </div>
              </SectionCard>

              {/* Nominee */}
              <SectionCard icon={UserCheck} iconCls="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" title="Nominee / Guarantor" sub="Emergency contact if you are unreachable">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nominee Full Name <span className="text-red-500">*</span></Label>
                      <Input value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} placeholder="e.g. Fatema Begum" className="font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Relation <span className="text-red-500">*</span></Label>
                      <Select value={nomineeRelation} onValueChange={setNomineeRelation}>
                        <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                        <SelectContent>{RELATION_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nominee Phone <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input value={nomineePhone} onChange={(e) => setNomineePhone(e.target.value.replace(/\D/g, ""))} placeholder="01XXXXXXXXX" maxLength={11} className="pl-9 font-mono tracking-wider" />
                    </div>
                    {nomineePhone.length === 11 && (
                      <p className={`text-[10px] font-semibold ${/^01[3-9]\d{8}$/.test(nomineePhone) ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {/^01[3-9]\d{8}$/.test(nomineePhone) ? "✓ Valid BD number" : "✗ Invalid format"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nominee Address <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Textarea value={nomineeAddress} onChange={(e) => setNomineeAddress(e.target.value)} placeholder="House, Road, Area, District" rows={2} className="resize-none pl-9 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                      Nominee is only contacted if we cannot reach you. Their photo will be uploaded in the next step.
                    </p>
                  </div>
                </div>
              </SectionCard>

              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                  All personal information is encrypted and stored securely. Used only for loan eligibility assessment.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 4 — DOCUMENT UPLOAD
          ══════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <SectionCard icon={IdCard} iconCls="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" title="Upload Documents" sub="All 4 documents required for KYC verification">
              <div className="space-y-4">
                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Upload Progress</span>
                    <span className={allDocs ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}>{docsCount} / {DOC_SLOTS.length} uploaded</span>
                  </div>
                  <Progress value={(docsCount / DOC_SLOTS.length) * 100} className="h-2" />
                  {allDocs && (
                    <p className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ All documents uploaded — you're ready to proceed!
                    </p>
                  )}
                </div>

                {/* 2x2 grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {DOC_SLOTS.map((slot) => (
                    <DocSlot key={slot.key} slot={slot} uploaded={docs[slot.key]} onUpload={handleDocUpload} onRemove={handleDocRemove} />
                  ))}
                </div>

                {/* Tips */}
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <p className="mb-2.5 text-xs font-bold text-amber-700 dark:text-amber-300">📸 Photo Tips for Faster Approval</p>
                  <ul className="space-y-1 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                    <li>• All NID text must be clearly readable — avoid glare and shadows</li>
                    <li>• Selfie: face and NID both fully visible, good lighting</li>
                    <li>• Nominee photo: clear portrait or passport-size, face visible</li>
                    <li>• Each file: JPG or PNG format, maximum 1 MB per image</li>
                  </ul>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 5 — REVIEW & SUBMIT
          ══════════════════════════════════════════════════════════════ */}
          {step === 5 && product && (
            <div className="space-y-4">
              {/* Hero banner */}
              <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${plan.headerCls} p-6 text-white shadow-lg`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">{plan.label} · {plan.annualRate}% p.a.</p>
                    <p className="mt-1 text-4xl font-black">{fmt(Math.round(emi))}<span className="ml-1.5 text-lg font-medium opacity-75">/month</span></p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-black ${plan.badgeCls}`}>{plan.badge}</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3 border-t border-white/10 pt-4">
                  {[
                    ["Down Paid",  fmt(dp)],
                    ["Loan Amt",   fmt(loanAmount)],
                    ["Tenure",     `${plan.months}M`],
                    ["Total Pay",  fmt(Math.round(totalPayable))],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] font-medium opacity-60">{k}</p>
                      <p className="mt-0.5 text-sm font-bold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <SectionCard icon={FileText} iconCls="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" title="Review & Confirm" sub="Verify all details before submitting">
                <div className="divide-y dark:divide-slate-700/60">

                  {/* Product */}
                  <div className="pb-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</p>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                      {product.mainImage && <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border"><Image src={product.mainImage} alt="" fill className="object-cover" /></div>}
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{product.name}</p><p className="text-base font-black text-blue-600 dark:text-blue-400">{fmt(price)}</p></div>
                    </div>
                  </div>

                  {/* Loan */}
                  <div className="py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Loan Details</p>
                    <div className="divide-y dark:divide-slate-700/40">
                      {[
                        ["Product Price",   fmt(price),                    ""],
                        ["Down Payment",    fmt(dp),                       "font-bold text-blue-600 dark:text-blue-400"],
                        ["Loan Amount",     fmt(loanAmount),               "font-bold"],
                        ["Plan",            `${plan.label} · ${plan.annualRate}% p.a.`, `font-bold ${plan.textCls}`],
                        ["Monthly EMI",     fmt(Math.round(emi)),          `font-black ${plan.textCls}`],
                        ["Total Interest",  fmt(Math.round(totalInterest)),"text-amber-600 dark:text-amber-400"],
                        ["Total Payable",   fmt(Math.round(totalPayable)), "font-bold"],
                      ].map(([k, v, cls]) => (
                        <div key={k} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-slate-500 dark:text-slate-400">{k}</span>
                          <span className={cls || "font-medium"}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Applicant */}
                  <div className="py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Applicant</p>
                    <div className="divide-y dark:divide-slate-700/40">
                      {[["Name",applicantName],["Address",applicantAddress],["NID",nidNumber],["Income",fmt(Number(monthlyIncome))],["Job",jobType]].map(([k,v])=>(
                        <div key={k} className="flex items-start justify-between gap-4 py-2 text-sm">
                          <span className="flex-shrink-0 text-slate-500 dark:text-slate-400">{k}</span>
                          <span className="text-right font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nominee */}
                  <div className="py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nominee</p>
                    <div className="divide-y dark:divide-slate-700/40">
                      {[["Name",nomineeName],["Relation",nomineeRelation],["Phone",nomineePhone],["Address",nomineeAddress]].map(([k,v])=>(
                        <div key={k} className="flex items-start justify-between gap-4 py-2 text-sm">
                          <span className="flex-shrink-0 text-slate-500 dark:text-slate-400">{k}</span>
                          <span className="text-right font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Documents (4/4)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {DOC_SLOTS.map((slot) => {
                        const doc = docs[slot.key];
                        return (
                          <div key={slot.key} className="overflow-hidden rounded-xl border">
                            {doc?.preview
                              ? <div className="relative h-20 w-full bg-slate-100 dark:bg-slate-800"><Image src={doc.preview} alt={slot.label} fill className="object-cover" /></div>
                              : <div className="flex h-20 items-center justify-center bg-slate-100 dark:bg-slate-800"><ImageIcon className="h-5 w-5 text-slate-300" /></div>}
                            <div className="flex items-center gap-1 px-1.5 py-1">
                              <CheckCheck className="h-2.5 w-2.5 flex-shrink-0 text-emerald-500" />
                              <p className="truncate text-[9px] font-semibold text-slate-500">{slot.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {customerNote && (
                    <div className="py-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Note</p>
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/40">{customerNote}</p>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="pt-4">
                    <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 dark:border-amber-900/30 dark:bg-amber-950/10">
                      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                        By submitting, you agree to our loan terms. Upon approval, down payment of <strong>{fmt(dp)}</strong> must be paid within <strong>48 hours</strong> to activate the loan. Failure to pay will cancel the application.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 pb-6">
            <Button variant="outline" onClick={prev} disabled={step === 1 || loading} className="gap-2">
              <ChevronLeft className="h-4 w-4" />Back
            </Button>
            {step < STEPS.length ? (
              <Button onClick={next} disabled={initBusy} className="gap-2 bg-blue-600 px-6 hover:bg-blue-700">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={loading} className={`gap-2 bg-gradient-to-r ${plan.headerCls} px-8 text-white border-0 hover:opacity-90`}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <><BadgeCheck className="h-4 w-4" />Submit Application</>}
              </Button>
            )}
          </div>

          <p className="pb-2 text-center text-xs text-slate-400">Step {step} of {STEPS.length} · {STEPS[step - 1].label}</p>
        </div>
      </div>
    </TooltipProvider>
  );
}