/**
 * File: app/dashboard/loans/page.jsx
 *
 * User Loan Applications Dashboard
 * Shows all loans with status, progress, next EMI due, quick stats.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, formatDistanceToNow, isPast, isToday, differenceInDays } from "date-fns";
import { useSession } from "next-auth/react";

import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  CreditCard, Package, Loader2, AlertCircle, Plus, ChevronRight,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Banknote, Calendar,
  CircleDashed, XCircle, CheckCheck, Eye, RefreshCw,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt     = (n) => `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? format(new Date(d), "dd MMM yyyy") : "—";
const fmtAgo  = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : "—";

const STATUS_META = {
  PENDING:              { label: "Pending Review",      cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",      dot: "bg-amber-500",    icon: CircleDashed  },
  REVIEWING:            { label: "Under Review",         cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",          dot: "bg-blue-500",     icon: Eye           },
  APPROVED:             { label: "Approved",             cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",       dot: "bg-green-500",    icon: CheckCircle2  },
  DOWN_PAYMENT_PENDING: { label: "Down Payment Due",     cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",   dot: "bg-orange-500",   icon: Banknote      },
  ACTIVE:               { label: "Active",               cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",dot: "bg-emerald-500",  icon: TrendingUp    },
  COMPLETED:            { label: "Completed",            cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",          dot: "bg-slate-400",    icon: CheckCheck    },
  REJECTED:             { label: "Rejected",             cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",               dot: "bg-red-500",      icon: XCircle       },
  CANCELLED:            { label: "Cancelled",            cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",              dot: "bg-gray-400",     icon: XCircle       },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function NextDueBadge({ inst }) {
  if (!inst) return <span className="text-xs text-slate-400">—</span>;
  const due     = new Date(inst.dueDate);
  const overdue = inst.status === "OVERDUE" || isPast(due);
  const today   = isToday(due);
  const days    = differenceInDays(due, new Date());

  if (overdue || inst.status === "OVERDUE")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
        <AlertTriangle className="h-3 w-3" />Overdue · {fmtDate(inst.dueDate)}
      </span>
    );
  if (today)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <Clock className="h-3 w-3" />Due Today · {fmt(inst.remainingAmount)}
      </span>
    );
  if (days <= 7)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
        <Clock className="h-3 w-3" />Due in {days}d · {fmt(inst.remainingAmount)}
      </span>
    );
  return (
    <span className="text-[11px] text-slate-500">
      {fmtDate(inst.dueDate)} · {fmt(inst.remainingAmount)}
    </span>
  );
}

export default function UserLoansPage() {
  const { data: session, status: authStatus } = useSession();
  const [loans,     setLoans]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [refreshing,setRefreshing]= useState(false);
  const [filter,    setFilter]    = useState("ALL");

  const fetchLoans = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/user/loans");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load.");
      setLoans(data.loans || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authenticated") fetchLoans();
  }, [authStatus]);

  if (authStatus === "loading" || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );

  if (authStatus === "unauthenticated") return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="text-center space-y-3">
        <CreditCard className="mx-auto h-10 w-10 text-slate-300" />
        <p className="font-semibold">Sign in to view your loans</p>
        <Button asChild><Link href="/auth/signin">Sign In</Link></Button>
      </div>
    </div>
  );

  // ── Filter ──
  const FILTERS = [
    { key: "ALL",      label: "All" },
    { key: "ACTIVE",   label: "Active" },
    { key: "PENDING",  label: "Pending" },
    { key: "COMPLETED",label: "Completed" },
    { key: "REJECTED", label: "Rejected" },
  ];

  const filtered = filter === "ALL" ? loans : loans.filter((l) => {
    if (filter === "PENDING") return ["PENDING","REVIEWING","DOWN_PAYMENT_PENDING"].includes(l.status);
    return l.status === filter;
  });

  // ── Summary stats ──
  const active    = loans.filter((l) => l.status === "ACTIVE").length;
  const completed = loans.filter((l) => l.status === "COMPLETED").length;
  const overdue   = loans.filter((l) => l.overdueInstallments > 0).length;
  const totalOwed = loans.filter((l) => l.status === "ACTIVE").reduce((s, l) => s + l.totalOutstanding, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Header ── */}
      <div className="border-b bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight">My Loans</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {loans.length} application{loans.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchLoans(true)} disabled={refreshing} className="gap-2">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button asChild size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Link href="/allproducts"><Plus className="h-3.5 w-3.5" />New Loan</Link>
              </Button>
            </div>
          </div>

          {/* Stats row */}
          {loans.length > 0 && (
            <div className="mt-5 grid grid-cols-4 gap-3">
              {[
                { label: "Total",     value: loans.length,          icon: CreditCard,  cls: "text-blue-600 dark:text-blue-400"    },
                { label: "Active",    value: active,                 icon: TrendingUp,  cls: "text-emerald-600 dark:text-emerald-400" },
                { label: "Completed", value: completed,              icon: CheckCheck,  cls: "text-slate-600 dark:text-slate-400"  },
                { label: "Overdue",   value: overdue,                icon: AlertTriangle,cls: overdue > 0 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400" },
              ].map(({ label, value, icon: Icon, cls }) => (
                <div key={label} className="rounded-xl border bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800/40">
                  <Icon className={`mx-auto mb-1 h-4 w-4 ${cls}`} />
                  <p className={`text-xl font-black ${cls}`}>{value}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Outstanding alert */}
          {totalOwed > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-2.5">
                <Banknote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Outstanding Balance</span>
              </div>
              <span className="text-sm font-black text-blue-700 dark:text-blue-300">{fmt(totalOwed)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Filter tabs ── */}
        {loans.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => {
              const cnt = f.key === "ALL" ? loans.length
                : f.key === "PENDING" ? loans.filter((l) => ["PENDING","REVIEWING","DOWN_PAYMENT_PENDING"].includes(l.status)).length
                : loans.filter((l) => l.status === f.key).length;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === f.key
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                  {f.label} ({cnt})
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty state ── */}
        {loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">No Loan Applications Yet</p>
            <p className="mt-1.5 text-sm text-slate-400">Browse products and apply for an EMI loan to get started.</p>
            <Button asChild className="mt-6 gap-2 bg-blue-600 hover:bg-blue-700">
              <Link href="/allproducts"><Plus className="h-4 w-4" />Browse Products</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No loans match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((loan) => {
              const plan = loan.tenureMonths === 3 ? "3-Month Plan · 10% p.a." : loan.tenureMonths === 6 ? "6-Month Plan · 20% p.a." : `${loan.tenureMonths}-Month Plan`;
              const overdueInst = loan.overdueInstallments > 0;

              return (
                <Link key={loan.id} href={`/loans/details/${loan.id}`}
                  className={`group block overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-md dark:bg-slate-900 ${overdueInst ? "border-red-200 dark:border-red-800" : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"}`}>

                  {/* Overdue banner */}
                  {overdueInst && (
                    <div className="flex items-center gap-2 bg-red-500 px-4 py-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-white" />
                      <p className="text-xs font-bold text-white">
                        {loan.overdueInstallments} overdue installment{loan.overdueInstallments > 1 ? "s" : ""} — immediate payment required
                      </p>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Top row */}
                    <div className="flex items-start gap-3">
                      {loan.product?.mainImage && (
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border">
                          <Image src={loan.product.mainImage} alt="" fill className="object-cover" sizes="64px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{loan.product?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{plan}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={loan.status} />
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial row */}
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/40">
                        <p className="text-[10px] text-slate-400">Loan Amount</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{fmt(loan.loanAmount)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/40">
                        <p className="text-[10px] text-slate-400">Monthly EMI</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{fmt(loan.monthlyEmi)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/40">
                        <p className="text-[10px] text-slate-400">Outstanding</p>
                        <p className={`text-sm font-bold ${loan.totalOutstanding > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {fmt(loan.totalOutstanding)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar (for ACTIVE/COMPLETED) */}
                    {loan.totalInstallments > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-500">EMI Progress</span>
                          <span className={`font-bold ${overdueInst ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}>
                            {loan.paidInstallments}/{loan.totalInstallments} paid
                            {overdueInst && ` · ${loan.overdueInstallments} overdue`}
                          </span>
                        </div>
                        <Progress
                          value={loan.totalInstallments > 0 ? (loan.paidInstallments / loan.totalInstallments) * 100 : 0}
                          className={`h-2 ${overdueInst ? "[&>div]:bg-red-500" : ""}`}
                        />
                      </div>
                    )}

                    {/* Next due / status info */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        Applied {fmtAgo(loan.appliedAt)}
                      </div>
                      {loan.status === "ACTIVE" && loan.nextDueInstallment && (
                        <NextDueBadge inst={loan.nextDueInstallment} />
                      )}
                      {loan.status === "DOWN_PAYMENT_PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          <Banknote className="h-3 w-3" />Down payment: {fmt(loan.downPayment - loan.downPaymentPaid)} remaining
                        </span>
                      )}
                      {loan.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <CheckCheck className="h-3 w-3" />Fully Paid
                        </span>
                      )}
                      {["PENDING","REVIEWING"].includes(loan.status) && (
                        <span className="text-[11px] text-slate-400">Awaiting admin review</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}