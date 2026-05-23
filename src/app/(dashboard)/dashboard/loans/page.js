/**
 * Page: /admin/loans
 * Admin Loan Management Dashboard — Fully Responsive
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { format, formatDistanceToNow, isPast } from "date-fns";

import { Button }        from "@/components/ui/button";
import { Input }         from "@/components/ui/input";
import { Label }         from "@/components/ui/label";
import { Textarea }      from "@/components/ui/textarea";
import { Badge }         from "@/components/ui/badge";
import { Separator }     from "@/components/ui/separator";
import { Progress }      from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea }    from "@/components/ui/scroll-area";
import { Switch }        from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Search, RefreshCw, ChevronLeft, ChevronRight, Eye,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp, CreditCard,
  FileText, Plus, Loader2, Mail, Banknote, AlertCircle, CheckCheck,
  CircleDashed, ArrowUpRight, MoreHorizontal, CalendarDays, Pencil,
  RotateCcw, BadgeX, Receipt, Info, Activity, Minus, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt     = (n) => `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? format(new Date(d), "dd MMM yyyy") : "—";
const fmtDT   = (d) => d ? format(new Date(d), "dd MMM yyyy, hh:mm a") : "—";
const fmtAgo  = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : "—";

function addMonthsManual(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const STATUS_META = {
  PENDING:              { label: "Pending",           bg: "bg-amber-50 dark:bg-amber-950/40",     text: "text-amber-700 dark:text-amber-300",     border: "border-amber-200 dark:border-amber-800",     dot: "bg-amber-500",   icon: CircleDashed },
  REVIEWING:            { label: "Reviewing",         bg: "bg-blue-50 dark:bg-blue-950/40",       text: "text-blue-700 dark:text-blue-300",       border: "border-blue-200 dark:border-blue-800",       dot: "bg-blue-500",    icon: Eye },
  APPROVED:             { label: "Approved",          bg: "bg-green-50 dark:bg-green-950/40",     text: "text-green-700 dark:text-green-300",     border: "border-green-200 dark:border-green-800",     dot: "bg-green-500",   icon: CheckCircle2 },
  DOWN_PAYMENT_PENDING: { label: "Down Pmt.",         bg: "bg-orange-50 dark:bg-orange-950/40",   text: "text-orange-700 dark:text-orange-300",   border: "border-orange-200 dark:border-orange-800",   dot: "bg-orange-500",  icon: Banknote },
  ACTIVE:               { label: "Active",            bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", icon: TrendingUp },
  COMPLETED:            { label: "Completed",         bg: "bg-slate-50 dark:bg-slate-800/60",     text: "text-slate-600 dark:text-slate-300",     border: "border-slate-200 dark:border-slate-700",     dot: "bg-slate-400",   icon: CheckCheck },
  REJECTED:             { label: "Rejected",          bg: "bg-red-50 dark:bg-red-950/40",         text: "text-red-700 dark:text-red-300",         border: "border-red-200 dark:border-red-800",         dot: "bg-red-500",     icon: XCircle },
  CANCELLED:            { label: "Cancelled",         bg: "bg-gray-50 dark:bg-gray-800/60",       text: "text-gray-600 dark:text-gray-400",       border: "border-gray-200 dark:border-gray-700",       dot: "bg-gray-400",    icon: XCircle },
};

const INST_META = {
  UNPAID:  { label: "Unpaid",  cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  PARTIAL: { label: "Partial", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" },
  PAID:    { label: "Paid",    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
  WAIVED:  { label: "Waived",  cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" },
};

// ─── Small components ─────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.bg} ${m.text} ${m.border}`}>
      <Icon className="w-3 h-3 shrink-0" />{m.label}
    </span>
  );
}

function InstBadge({ status }) {
  const m = INST_META[status] || INST_META.UNPAID;
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.cls}`}>{m.label}</span>;
}

function KPICard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-card border rounded-2xl p-4 flex gap-3 items-start hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-1 truncate">{label}</p>
        <p className="text-xl font-black tracking-tight leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function OverpaymentPreview({ pmtAmount, unpaidInsts }) {
  const amt = parseFloat(pmtAmount) || 0;
  if (!amt || !unpaidInsts.length) return null;
  const firstDue = unpaidInsts[0];
  const totalDue = (firstDue.amount || 0) + (firstDue.lateFee || 0) - (firstDue.paidAmount || 0);
  const overflow = parseFloat((amt - totalDue).toFixed(2));
  if (overflow <= 0.01) return null;
  let budget = amt;
  let instsCovered = 0;
  for (const inst of unpaidInsts) {
    if (budget <= 0.005) break;
    const due = inst.amount + inst.lateFee - inst.paidAmount;
    if (due <= 0) continue;
    budget -= Math.min(budget, due);
    instsCovered++;
  }
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 flex items-start gap-2">
      <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
      <div className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
        <strong>{fmt(overflow)}</strong> overpayment will automatically carry forward.
        {instsCovered > 1 && <span> This covers <strong>{instsCovered} installments</strong>.</span>}
      </div>
    </div>
  );
}

// ── Mobile loan card ───────────────────────────────────────────────────────────
function LoanCard({ l, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const paid    = (l.installments || []).filter((i) => i.status === "PAID").length;
  const overdue = (l.installments || []).filter((i) => i.status === "OVERDUE").length;
  const total   = (l.installments || []).length;
  const pct     = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-[#111318] border rounded-2xl overflow-hidden">
      {/* Always-visible summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-muted-foreground">
          {l.user?.image
            ? <Image src={l.user.image} alt="" width={36} height={36} className="object-cover w-full h-full" />
            : (l.user?.name || "U")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{l.user?.name || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{l.user?.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusPill status={l.status} />
              {expanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span>Loan <span className="font-bold text-foreground">{fmt(l.loanAmount)}</span></span>
            <span>EMI <span className="font-bold text-blue-600 dark:text-blue-400">{fmt(l.monthlyEmi)}</span></span>
            <span>{l.tenureMonths}m</span>
            {overdue > 0 && (
              <span className="text-red-500 font-semibold">{overdue} overdue</span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t dark:border-slate-700 px-4 pb-4">
          {/* Product */}
          <div className="flex items-center gap-2 mt-3">
            {l.product?.mainImage && (
              <div className="w-8 h-8 rounded-lg overflow-hidden border shrink-0">
                <Image src={l.product.mainImage} alt="" width={32} height={32} className="object-cover w-full h-full" />
              </div>
            )}
            <p className="text-sm font-semibold truncate">{l.product?.name}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="bg-muted/40 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Collected</p>
              <p className={`font-bold ${(l.totalCollected || 0) > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                {fmt(l.totalCollected || 0)}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Applied</p>
              <p className="font-semibold">{fmtDate(l.appliedAt)}</p>
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                <span>{paid}/{total} installments paid</span>
                {overdue > 0 && <span className="text-red-500 font-semibold">{overdue} late</span>}
              </div>
              <Progress value={pct} className={`h-1.5 ${overdue > 0 ? "[&>div]:bg-red-500" : ""}`} />
            </div>
          )}

          {/* View details button */}
          <Button
            size="sm"
            className="mt-3 w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => { e.stopPropagation(); onOpen(l); }}
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLoansPage() {
  useSession();

  const [loans, setLoans]             = useState([]);
  const [pagination, setPagination]   = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [stats, setStats]             = useState({});
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage]               = useState(1);
  const searchTimer                   = useRef(null);

  const [loan, setLoan]               = useState(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState("overview");

  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");

  const [showApprove, setShowApprove]           = useState(false);
  const [approveNote, setApproveNote]           = useState("");
  const [approveStartDate, setApproveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [customRows, setCustomRows]             = useState([]);

  const [showReject, setShowReject]   = useState(false);
  const [rejectNote, setRejectNote]   = useState("");

  const [showPayment, setShowPayment] = useState(false);
  const [pmtType, setPmtType]         = useState("INSTALLMENT");
  const [pmtAmount, setPmtAmount]     = useState("");
  const [pmtInstId, setPmtInstId]     = useState("AUTO");
  const [pmtMethod, setPmtMethod]     = useState("none");
  const [pmtTxn, setPmtTxn]           = useState("");
  const [pmtRef, setPmtRef]           = useState("");
  const [pmtNote, setPmtNote]         = useState("");

  const [showInstAction, setShowInstAction]     = useState(false);
  const [targetInst, setTargetInst]             = useState(null);
  const [instAction, setInstAction]             = useState("");
  const [instActionDate, setInstActionDate]     = useState("");
  const [instActionAmount, setInstActionAmount] = useState("");
  const [instActionFee, setInstActionFee]       = useState("");
  const [instActionReason, setInstActionReason] = useState("");

  const unpaidInsts = useMemo(
    () => (loan?.installments ?? []).filter((i) => !["PAID", "WAIVED"].includes(i.status)),
    [loan]
  );
  const totalCollected = useMemo(
    () => (loan?.payments ?? []).filter((p) => p.status === "SUCCESS").reduce((a, p) => a + p.amount, 0),
    [loan]
  );
  const totalOutstanding = useMemo(
    () => (loan?.installments ?? []).reduce((a, i) => a + (i.remainingAmount || 0), 0),
    [loan]
  );

  const canApprove = loan && ["PENDING", "REVIEWING"].includes(loan.status);
  const canReject  = loan && !["REJECTED", "CANCELLED", "COMPLETED"].includes(loan.status);
  const canPay     = loan && ["DOWN_PAYMENT_PENDING", "ACTIVE"].includes(loan.status);

  const totalApps          = Object.entries(stats).filter(([k]) => k !== "_global").reduce((a, [, s]) => a + (s.count || 0), 0);
  const activeCount        = stats["ACTIVE"]?.count || 0;
  const completedCount     = stats["COMPLETED"]?.count || 0;
  const pendingCount       = (stats["PENDING"]?.count || 0) + (stats["REVIEWING"]?.count || 0);
  const totalDisbursed     = stats._global?.totalDisbursed || 0;
  const totalCollectedGlobal = stats._global?.totalCollected || 0;

  const fetchList = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const p = new URLSearchParams({
        page: String(page), limit: "20", status: statusFilter,
        ...(search && { search }),
      });
      const res  = await fetch(`/api/admin/loans?${p}`);
      const data = await res.json();
      setLoans(data.loans || []);
      setPagination(data.pagination || {});
      setStats(data.stats || {});
    } catch (e) {
      console.error("[AdminLoans] fetchList:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  const openDetail = async (l) => {
    setDrawerOpen(true);
    setActiveTab("overview");
    setDetailLoading(true);
    setLoan(null);
    setErr("");
    try {
      const res  = await fetch(`/api/admin/loans/${l.id}`);
      const data = await res.json();
      setLoan(data.loan || null);
    } catch (e) {
      console.error("[AdminLoans] openDetail:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!loan) return;
    try {
      const res  = await fetch(`/api/admin/loans/${loan.id}`);
      const data = await res.json();
      setLoan(data.loan || null);
    } catch (e) {
      console.error("[AdminLoans] refreshDetail:", e);
    }
  };

  const buildCustomRows = useCallback(() => {
    if (!loan) return;
    const start = new Date(approveStartDate || new Date());
    const rows  = Array.from({ length: loan.tenureMonths }, (_, i) => {
      const d = addMonthsManual(start, i);
      d.setDate(d.getDate() + (loan.firstEmiDelayDays || 30));
      return { dueDate: format(d, "yyyy-MM-dd"), amount: loan.monthlyEmi.toFixed(2) };
    });
    setCustomRows(rows);
  }, [loan, approveStartDate]);

  useEffect(() => {
    if (useCustomSchedule && loan) buildCustomRows();
  }, [useCustomSchedule, buildCustomRows, loan]);

  const handleApprove = async () => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/admin/loans/${loan.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNote: approveNote,
          loanStartDate: approveStartDate,
          ...(useCustomSchedule && customRows.length > 0 && { customSchedule: customRows }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed.");
      setShowApprove(false);
      await refreshDetail();
      fetchList(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) { setErr("Rejection reason is required."); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/admin/loans/${loan.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: rejectNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed.");
      setShowReject(false);
      await refreshDetail();
      fetchList(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePayment = async () => {
    if (!pmtAmount || parseFloat(pmtAmount) <= 0) { setErr("Please enter a valid amount."); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/admin/loans/${loan.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType: pmtType,
          amount: parseFloat(pmtAmount),
          installmentId: pmtInstId === "AUTO" ? undefined : pmtInstId,
          paymentMethod: pmtMethod === "none" ? undefined : pmtMethod,
          transactionNumber: pmtTxn || undefined,
          referenceNumber: pmtRef || undefined,
          note: pmtNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed.");
      setShowPayment(false);
      setPmtAmount(""); setPmtTxn(""); setPmtRef(""); setPmtNote(""); setPmtInstId("AUTO");
      await refreshDetail();
      fetchList(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openInstAction = (inst, action) => {
    setTargetInst(inst);
    setInstAction(action);
    setInstActionDate(format(new Date(inst.dueDate), "yyyy-MM-dd"));
    setInstActionAmount(String(inst.amount));
    setInstActionFee("");
    setInstActionReason("");
    setErr("");
    setShowInstAction(true);
  };

  const handleInstAction = async () => {
    if (!targetInst || !loan) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/admin/loans/${loan.id}/installments/${targetInst.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: instAction,
          reason: instActionReason || undefined,
          ...(instAction === "reschedule"    && { newDueDate: instActionDate }),
          ...(instAction === "adjust_amount" && { newAmount: parseFloat(instActionAmount) }),
          ...(instAction === "add_late_fee"  && { lateFee: parseFloat(instActionFee || loan.lateFee) }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      setShowInstAction(false);
      await refreshDetail();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0d0f12]">

        {/* ── Top Bar ── */}
        <div className="bg-white dark:bg-[#111318] border-b sticky top-0 z-30">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="font-bold text-sm sm:text-base">Loan Management</h1>
              <span className="hidden sm:inline text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                Admin
              </span>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => fetchList(true)}
              disabled={refreshing}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

          {/* ── KPIs: 2col mobile → 3col md → 5col xl ── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <KPICard label="Total Applications" value={totalApps}
              sub={`${pendingCount} pending`} icon={FileText}
              accent="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" />
            <KPICard label="Active Loans" value={activeCount}
              sub={`${completedCount} done`} icon={Activity}
              accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" />
            <KPICard label="Total Disbursed" value={fmt(totalDisbursed)}
              sub="Principal" icon={Banknote}
              accent="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300" />
            <KPICard label="Total Collected" value={fmt(totalCollectedGlobal)}
              sub="All payments" icon={CheckCircle2}
              accent="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" />
            <KPICard label="Needs Action" value={pendingCount}
              sub="Pending / reviewing" icon={AlertTriangle}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" />
          </div>

          {/* ── Status filter pills (horizontal scroll) ── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {["ALL", ...Object.keys(STATUS_META)].map((s) => {
              const meta = STATUS_META[s];
              const cnt  = s === "ALL" ? totalApps : (stats[s]?.count || 0);
              return (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/40"
                  }`}>
                  {s !== "ALL" && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />}
                  {s === "ALL" ? "All" : meta.label}
                  <span className="opacity-60">({cnt})</span>
                </button>
              );
            })}
          </div>

          {/* ── Table / Cards container ── */}
          <div className="bg-white dark:bg-[#111318] border rounded-2xl overflow-hidden shadow-sm">

            {/* Search + meta row */}
            <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2 sm:px-5">
              <div className="relative flex-1 min-w-0 max-w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search name, email, NID…"
                  value={search} onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 h-8 text-sm" />
              </div>
              <p className="text-xs text-muted-foreground ml-auto shrink-0">
                {pagination.total > 0
                  ? `${pagination.total} · p${pagination.page}/${pagination.totalPages}`
                  : "No records"}
              </p>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            ) : loans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
                <CreditCard className="w-10 h-10 opacity-20" />
                <p className="text-sm">No applications found</p>
              </div>
            ) : (
              <>
                {/* ── Mobile: loan cards (hidden md+) ── */}
                <div className="md:hidden divide-y dark:divide-slate-800">
                  {loans.map((l) => (
                    <div key={l.id} className="p-3">
                      <LoanCard l={l} onOpen={openDetail} />
                    </div>
                  ))}
                </div>

                {/* ── Desktop: table (hidden below md) ── */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/30">
                        <TableHead className="pl-5 text-xs">Applicant</TableHead>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs text-right">Loan</TableHead>
                        <TableHead className="text-xs text-right">EMI</TableHead>
                        <TableHead className="text-xs text-right">Collected</TableHead>
                        <TableHead className="text-xs text-center">Tenure</TableHead>
                        <TableHead className="text-xs">Progress</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Applied</TableHead>
                        <TableHead className="text-xs text-right pr-5">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.map((l) => {
                        const paid    = (l.installments || []).filter((i) => i.status === "PAID").length;
                        const overdue = (l.installments || []).filter((i) => i.status === "OVERDUE").length;
                        const total   = (l.installments || []).length;
                        const pct     = total > 0 ? Math.round((paid / total) * 100) : 0;
                        return (
                          <TableRow key={l.id} className="group cursor-pointer" onClick={() => openDetail(l)}>
                            <TableCell className="pl-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-muted-foreground">
                                  {l.user?.image
                                    ? <Image src={l.user.image} alt="" width={32} height={32} className="object-cover w-full h-full" />
                                    : (l.user?.name || "U")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate max-w-28">{l.user?.name || "—"}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-28">{l.user?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {l.product?.mainImage && (
                                  <div className="w-7 h-7 rounded overflow-hidden border shrink-0">
                                    <Image src={l.product.mainImage} alt="" width={28} height={28} className="object-cover w-full h-full" />
                                  </div>
                                )}
                                <span className="text-sm truncate max-w-32">{l.product?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm">{fmt(l.loanAmount)}</TableCell>
                            <TableCell className="text-right text-sm font-semibold text-blue-600 dark:text-blue-400">{fmt(l.monthlyEmi)}</TableCell>
                            <TableCell className="text-right">
                              <span className={`text-sm font-semibold ${(l.totalCollected || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                {fmt(l.totalCollected || 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-xs font-medium bg-muted rounded px-1.5 py-0.5">{l.tenureMonths}m</span>
                            </TableCell>
                            <TableCell>
                              {total > 0 ? (
                                <div className="min-w-20">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-muted-foreground">{paid}/{total}</span>
                                    {overdue > 0 && <span className="text-[10px] text-red-500 font-semibold">{overdue} late</span>}
                                  </div>
                                  <Progress value={pct} className={`h-1.5 ${overdue > 0 ? "[&>div]:bg-red-500" : ""}`} />
                                </div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell><StatusPill status={l.status} /></TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(l.appliedAt)}</span>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); openDetail(l); }}>
                                <Eye className="w-3.5 h-3.5" />Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between sm:px-5">
                <p className="text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Showing </span>
                  {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total)}
                  <span className="hidden sm:inline"> of {pagination.total}</span>
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            DETAIL DRAWER
        ══════════════════════════════════════════════════════════════════ */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-[680px] lg:max-w-[720px] p-0 flex flex-col bg-[#f8f9fb] dark:bg-[#0d0f12]" side="right">
            {detailLoading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !loan ? (
              <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
                Failed to load loan details.
              </div>
            ) : (
              <>
                {/* Drawer header */}
                <div className="bg-white dark:bg-[#111318] border-b px-4 pt-4 pb-4 shrink-0 sm:px-6 sm:pt-5">
                  <SheetHeader className="space-y-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <SheetTitle className="text-base font-black truncate">
                          Loan #{loan.id.slice(-8).toUpperCase()}
                        </SheetTitle>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <StatusPill status={loan.status} />
                          <span className="text-xs text-muted-foreground">{fmtAgo(loan.appliedAt)}</span>
                        </div>
                      </div>

                      {/* Action buttons — stack on very narrow, row on sm+ */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {canApprove && (
                          <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5"
                            onClick={() => { setErr(""); setUseCustomSchedule(false); setApproveNote(""); setShowApprove(true); }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Approve</span>
                          </Button>
                        )}
                        {canReject && (
                          <Button size="sm" variant="destructive" className="h-8 gap-1.5 text-xs px-2.5"
                            onClick={() => { setErr(""); setRejectNote(""); setShowReject(true); }}>
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Reject</span>
                          </Button>
                        )}
                        {canPay && (
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs px-2.5"
                            onClick={() => {
                              setErr(""); setPmtType("INSTALLMENT"); setPmtAmount("");
                              setPmtInstId("AUTO"); setPmtMethod("none"); setPmtTxn("");
                              setPmtRef(""); setPmtNote("");
                              setShowPayment(true);
                            }}>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Payment</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Financial snapshot — 3 col */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {[
                        ["Loan Amount", fmt(loan.loanAmount),  "text-foreground"],
                        ["Monthly EMI", fmt(loan.monthlyEmi),  "text-blue-600 dark:text-blue-400"],
                        ["Outstanding", fmt(totalOutstanding), totalOutstanding > 0 ? "text-orange-600" : "text-emerald-600"],
                      ].map(([l, v, cls]) => (
                        <div key={l} className="bg-muted/40 rounded-lg px-2 py-2 sm:px-3">
                          <p className="text-[10px] text-muted-foreground leading-none mb-1 truncate">{l}</p>
                          <p className={`text-xs font-black sm:text-sm ${cls}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </SheetHeader>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                  <div className="bg-white dark:bg-[#111318] border-b px-4 shrink-0 sm:px-6">
                    {/* Tabs scroll horizontally on mobile */}
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <TabsList className="h-10 bg-transparent p-0 gap-4 sm:gap-5 rounded-none border-0 flex whitespace-nowrap w-max sm:w-auto">
                        {[
                          { v: "overview",  label: "Overview" },
                          { v: "schedule",  label: `Schedule (${loan.installments?.length || 0})` },
                          { v: "payments",  label: `Payments (${loan.payments?.length || 0})` },
                          { v: "documents", label: `Docs (${loan.documents?.length || 0})` },
                        ].map((t) => (
                          <TabsTrigger key={t.v} value={t.v}
                            className="relative h-10 px-0 text-xs font-semibold rounded-none border-0 bg-transparent shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary">
                            {t.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">

                    {/* ── Overview ── */}
                    <TabsContent value="overview" className="mt-0 p-4 sm:p-5 space-y-4">

                      {/* Applicant */}
                      <div className="bg-white dark:bg-[#111318] rounded-xl border p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Applicant</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {loan.user?.image
                              ? <Image src={loan.user.image} alt="" width={40} height={40} className="object-cover w-full h-full" />
                              : (loan.user?.name || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{loan.user?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 shrink-0" />{loan.user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            ["NID",           loan.nidNumber || "—"],
                            ["Job Type",      loan.jobType || "—"],
                            ["Monthly Income",loan.monthlyIncome ? fmt(loan.monthlyIncome) : "—"],
                            ["Member Since",  fmtDate(loan.user?.createdAt)],
                          ].map(([k, v]) => (
                            <div key={k} className="bg-muted/40 rounded-lg px-3 py-2">
                              <p className="text-[10px] text-muted-foreground mb-0.5">{k}</p>
                              <p className="text-xs font-semibold">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Product */}
                      <div className="bg-white dark:bg-[#111318] rounded-xl border p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product</p>
                        <div className="flex items-center gap-3">
                          {loan.product?.mainImage && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border shrink-0">
                              <Image src={loan.product.mainImage} alt="" width={48} height={48} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{loan.product?.name}</p>
                            {loan.product?.category?.name && (
                              <Badge variant="secondary" className="text-[10px] mt-0.5">{loan.product.category.name}</Badge>
                            )}
                            <p className="text-base font-black text-primary mt-1">{fmt(loan.productPrice)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Financials */}
                      <div className="bg-white dark:bg-[#111318] rounded-xl border p-4 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Financial Summary</p>
                        {[
                          ["Product Price",           fmt(loan.productPrice),                "",                                                                            ],
                          ["Down Payment Required",   fmt(loan.downPayment),                 "",                                                                            ],
                          ["Down Payment Paid",       fmt(loan.downPaymentPaid),             loan.downPaymentPaid >= loan.downPayment ? "text-emerald-600 font-bold" : "text-orange-600 font-bold"],
                          ["Loan Amount",             fmt(loan.loanAmount),                  "text-blue-600 font-bold",                                                     ],
                          ["Interest Rate",           `${loan.interestRate}% Flat`,          "",                                                                            ],
                          ["Tenure",                  `${loan.tenureMonths} months`,         "",                                                                            ],
                          ["Monthly EMI",             fmt(loan.monthlyEmi),                  "font-bold",                                                                   ],
                          ["Total Payable",           fmt(loan.totalPayable),                "",                                                                            ],
                          ["Total Collected",         fmt(totalCollected),                   "text-emerald-600 font-semibold",                                              ],
                          ["Outstanding Balance",     fmt(totalOutstanding),                 totalOutstanding > 0 ? "text-orange-600 font-semibold" : "text-emerald-600 font-semibold"],
                          ["Late Fee / Installment",  fmt(loan.lateFee),                     "",                                                                            ],
                          ["Grace Period",            `${loan.gracePeriodDays} days`,        "",                                                                            ],
                        ].map(([k, v, cls]) => (
                          <div key={k} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                            <span className="text-muted-foreground text-xs sm:text-sm">{k}</span>
                            <span className={cls || "font-medium"}>{v}</span>
                          </div>
                        ))}

                        {loan.status === "DOWN_PAYMENT_PENDING" && loan.downPayment > 0 && (
                          <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="font-medium text-orange-700 dark:text-orange-300">Down Payment Progress</span>
                              <span>{fmt(loan.downPaymentPaid)} / {fmt(loan.downPayment)}</span>
                            </div>
                            <Progress value={Math.min(100, (loan.downPaymentPaid / loan.downPayment) * 100)} className="h-2" />
                          </div>
                        )}
                        {(loan.installments?.length || 0) > 0 && (
                          <div className="pt-1">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="font-medium">Installment Progress</span>
                              <span>
                                {(loan.installments || []).filter((i) => i.status === "PAID").length} / {loan.installments.length} paid
                              </span>
                            </div>
                            <Progress
                              value={Math.round(
                                ((loan.installments || []).filter((i) => i.status === "PAID").length / loan.installments.length) * 100
                              )}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="bg-white dark:bg-[#111318] rounded-xl border p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Timeline</p>
                        <div className="relative pl-4">
                          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
                          {[
                            ["Applied",       loan.appliedAt,     "bg-blue-500"],
                            ["Approved",      loan.approvedAt,    "bg-emerald-500"],
                            ["Loan Start",    loan.loanStartDate, "bg-indigo-500"],
                            ["First EMI Due", loan.firstDueDate,  "bg-amber-500"],
                            ["Rejected",      loan.rejectedAt,    "bg-red-500"],
                          ].filter(([, d]) => d).map(([label, date, dot]) => (
                            <div key={label} className="relative mb-3 last:mb-0">
                              <div className={`absolute -left-[11px] w-3 h-3 rounded-full border-2 border-background ${dot}`} />
                              <p className="text-xs text-muted-foreground">{label}</p>
                              <p className="text-xs font-semibold">{fmtDT(date)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {(loan.customerNote || loan.adminNote) && (
                        <div className="bg-white dark:bg-[#111318] rounded-xl border p-4 space-y-3">
                          {loan.customerNote && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Customer Note</p>
                              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 leading-relaxed">{loan.customerNote}</p>
                            </div>
                          )}
                          {loan.adminNote && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Admin Note</p>
                              <p className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 leading-relaxed">{loan.adminNote}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* ── Schedule ── */}
                    <TabsContent value="schedule" className="mt-0 p-4 sm:p-5">
                      {!(loan.installments?.length) ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-medium">No schedule yet</p>
                          <p className="text-xs mt-1">Approve the loan to generate the schedule.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2 mb-4">
                            {[
                              ["Paid",    (loan.installments).filter((i) => i.status === "PAID").length,    "text-emerald-600"],
                              ["Partial", (loan.installments).filter((i) => i.status === "PARTIAL").length, "text-blue-600"],
                              ["Overdue", (loan.installments).filter((i) => i.status === "OVERDUE").length, "text-red-600"],
                              ["Upcoming",(loan.installments).filter((i) => i.status === "UNPAID").length,  "text-muted-foreground"],
                            ].map(([l, v, cls]) => (
                              <div key={l} className="bg-white dark:bg-[#111318] border rounded-lg px-2 py-2 text-center sm:px-3">
                                <p className={`text-lg font-black ${cls}`}>{v}</p>
                                <p className="text-[10px] text-muted-foreground">{l}</p>
                              </div>
                            ))}
                          </div>

                          {loan.installments.map((inst) => {
                            const isOverdue       = !["PAID","WAIVED"].includes(inst.status) && isPast(new Date(inst.dueDate));
                            const effectiveStatus = (isOverdue && inst.status !== "OVERDUE") ? "OVERDUE" : inst.status;
                            const paidPct         = (inst.amount + inst.lateFee) > 0
                              ? Math.min(100, (inst.paidAmount / (inst.amount + inst.lateFee)) * 100) : 0;
                            const canEdit         = !["PAID","WAIVED"].includes(inst.status);

                            return (
                              <div key={inst.id}
                                className={`bg-white dark:bg-[#111318] border rounded-xl p-3 sm:p-3.5 transition-all ${
                                  effectiveStatus === "OVERDUE" ? "border-red-200 dark:border-red-800" :
                                  inst.status === "PAID"   ? "border-emerald-200 dark:border-emerald-800 opacity-70" :
                                  inst.status === "WAIVED" ? "border-purple-200 dark:border-purple-800 opacity-70" : ""
                                }`}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                    inst.status === "PAID"        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                                    effectiveStatus === "OVERDUE" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                                    inst.status === "WAIVED"      ? "bg-purple-100 text-purple-700" :
                                    inst.status === "PARTIAL"     ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                                    "bg-muted text-muted-foreground"
                                  }`}>
                                    {inst.installmentNo}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold">{fmtDate(inst.dueDate)}</span>
                                        {inst.isDateChanged && (
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded cursor-help">
                                                Rescheduled
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              <p className="text-xs">Original: {fmtDate(inst.originalDueDate)}</p>
                                              {inst.dateChangedReason && <p className="text-xs">{inst.dateChangedReason}</p>}
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <InstBadge status={effectiveStatus} />
                                        {canEdit && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="text-xs w-46">
                                              <DropdownMenuItem onClick={() => openInstAction(inst, "reschedule")}>
                                                <CalendarDays className="w-3.5 h-3.5 mr-2" />Reschedule Date
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => openInstAction(inst, "adjust_amount")}>
                                                <Pencil className="w-3.5 h-3.5 mr-2" />Adjust Amount
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => openInstAction(inst, "add_late_fee")}>
                                                <Plus className="w-3.5 h-3.5 mr-2" />Add Late Fee
                                              </DropdownMenuItem>
                                              {inst.lateFee > 0 && (
                                                <DropdownMenuItem onClick={() => openInstAction(inst, "remove_late_fee")}>
                                                  <Minus className="w-3.5 h-3.5 mr-2" />Remove Late Fee
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-purple-600 dark:text-purple-400"
                                                onClick={() => openInstAction(inst, "waive")}>
                                                <BadgeX className="w-3.5 h-3.5 mr-2" />Waive Installment
                                              </DropdownMenuItem>
                                              <DropdownMenuItem className="text-destructive"
                                                onClick={() => openInstAction(inst, "reset")}>
                                                <RotateCcw className="w-3.5 h-3.5 mr-2" />Reset to Unpaid
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between mt-1.5 text-xs gap-y-1">
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
                                        <span>Due: <span className="font-semibold text-foreground">{fmt(inst.amount)}</span></span>
                                        {inst.lateFee > 0 && (
                                          <span className="text-red-500">+{fmt(inst.lateFee)} fee</span>
                                        )}
                                        <span>Paid: <span className={`font-semibold ${inst.paidAmount > 0 ? "text-emerald-600" : ""}`}>{fmt(inst.paidAmount)}</span></span>
                                      </div>
                                      {!["PAID","WAIVED"].includes(inst.status) && (
                                        <span className="font-bold text-orange-600 dark:text-orange-400">{fmt(inst.remainingAmount)} left</span>
                                      )}
                                    </div>

                                    {inst.status === "PARTIAL" && (
                                      <Progress value={paidPct} className="h-1 mt-2" />
                                    )}
                                    {inst.note && (
                                      <p className="text-[10px] text-muted-foreground mt-1.5 italic bg-muted/40 px-2 py-1 rounded">
                                        {inst.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* ── Payments ── */}
                    <TabsContent value="payments" className="mt-0 p-4 sm:p-5">
                      {!(loan.payments?.length) ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No payments recorded yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-white dark:bg-[#111318] border rounded-xl px-4 py-3 flex justify-between items-center mb-3">
                            <span className="text-sm font-semibold">Total Collected</span>
                            <span className="text-lg font-black text-emerald-600">{fmt(totalCollected)}</span>
                          </div>
                          {loan.payments.map((p) => (
                            <div key={p.id} className="bg-white dark:bg-[#111318] border rounded-xl p-3 sm:p-3.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold">{fmt(p.amount)}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                    {p.paymentType.replace(/_/g, " ")}
                                    {p.installment && ` · Inst. #${p.installment.installmentNo}`}
                                    {p.paymentMethod && ` · ${p.paymentMethod}`}
                                  </p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                  p.status === "SUCCESS"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    : "bg-red-100 text-red-700"
                                }`}>{p.status}</span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-x-4 text-[10px] text-muted-foreground">
                                {p.transactionNumber && <span className="truncate">Txn: {p.transactionNumber}</span>}
                                {p.referenceNumber   && <span className="truncate">Ref: {p.referenceNumber}</span>}
                                {p.receivedBy        && <span className="truncate">By: {p.receivedBy}</span>}
                                <span>{fmtDT(p.paidAt || p.createdAt)}</span>
                              </div>
                              {p.note && (
                                <p className="text-[10px] italic text-muted-foreground mt-1.5 border-t pt-1.5">{p.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* ── Documents ── */}
                    <TabsContent value="documents" className="mt-0 p-4 sm:p-5">
                      {!(loan.documents?.length) ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No documents uploaded.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {loan.documents.map((doc) => (
                            <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer"
                              className="group bg-white dark:bg-[#111318] border rounded-xl p-4 flex flex-col items-center gap-2.5 hover:border-primary/50 hover:shadow-md transition-all">
                              <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-semibold leading-tight">{doc.type.replace(/_/g, " ")}</p>
                                {doc.title && <p className="text-[10px] text-muted-foreground mt-0.5">{doc.title}</p>}
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* ══════════════════════════════════════════════════════════════════
            APPROVE DIALOG
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={showApprove} onOpenChange={setShowApprove}>
          <DialogContent className="mx-4 w-full max-h-[90dvh] flex flex-col rounded-2xl sm:mx-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />Approve Loan
              </DialogTitle>
              <DialogDescription className="text-xs">
                Approving generates an installment schedule. Status → <strong>Down Payment Pending</strong>.
              </DialogDescription>
            </DialogHeader>
            {loan && (
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-4 pr-1">
                  <div className="bg-muted/40 rounded-xl p-3.5 grid grid-cols-2 gap-2">
                    {[
                      ["Applicant",     loan.user?.name || "—"],
                      ["Product Price", fmt(loan.productPrice)],
                      ["Loan Amount",   fmt(loan.loanAmount)],
                      ["Monthly EMI",   fmt(loan.monthlyEmi)],
                      ["Tenure",        `${loan.tenureMonths} months`],
                      ["Interest",      `${loan.interestRate}%`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-muted-foreground">{k}</p>
                        <p className="text-xs font-semibold">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Loan Start Date</Label>
                    <Input type="date" value={approveStartDate}
                      onChange={(e) => setApproveStartDate(e.target.value)} className="h-8 text-sm" />
                    <p className="text-[10px] text-muted-foreground">
                      First EMI due {loan.firstEmiDelayDays} days after this date.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold">Custom Schedule</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Manually edit each installment</p>
                    </div>
                    <Switch checked={useCustomSchedule} onCheckedChange={setUseCustomSchedule} />
                  </div>

                  {useCustomSchedule && customRows.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground">Edit Schedule</p>
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                        {customRows.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-[20px_1fr_1fr] gap-2 items-center">
                            <span className="text-[10px] text-muted-foreground font-bold text-right">{idx + 1}</span>
                            <Input type="date" value={row.dueDate} className="h-7 text-xs"
                              onChange={(e) => {
                                const r = [...customRows]; r[idx] = { ...r[idx], dueDate: e.target.value }; setCustomRows(r);
                              }} />
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">৳</span>
                              <Input type="number" value={row.amount} className="h-7 text-xs pl-5"
                                onChange={(e) => {
                                  const r = [...customRows]; r[idx] = { ...r[idx], amount: e.target.value }; setCustomRows(r);
                                }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                        <span>Scheduled: {fmt(customRows.reduce((a, r) => a + parseFloat(r.amount || 0), 0))}</span>
                        <span>Loan: {fmt(loan.loanAmount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs">Admin Note (optional)</Label>
                    <Textarea value={approveNote} onChange={(e) => setApproveNote(e.target.value)}
                      placeholder="Internal note…" rows={2} className="text-xs resize-none" />
                  </div>
                  {err && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <AlertDescription className="text-xs">{err}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            )}
            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setShowApprove(false)}>Cancel</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={handleApprove} disabled={busy}>
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════
            REJECT DIALOG
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={showReject} onOpenChange={setShowReject}>
          <DialogContent className="mx-4 w-full rounded-2xl sm:mx-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <XCircle className="w-4 h-4 text-destructive" />Reject Application
              </DialogTitle>
              <DialogDescription className="text-xs">
                Provide a clear reason. Saved as the admin note on this loan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Rejection Reason <span className="text-destructive">*</span></Label>
                <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Insufficient income, unverifiable NID…"
                  rows={3} className="text-xs resize-none" />
              </div>
              {err && (
                <Alert variant="destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">{err}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setShowReject(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={busy || !rejectNote.trim()}>
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════
            PAYMENT DIALOG
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="mx-4 w-full max-h-[90dvh] overflow-y-auto rounded-2xl sm:mx-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Banknote className="w-4 h-4 text-primary" />Record Payment
              </DialogTitle>
              <DialogDescription className="text-xs">
                {pmtType === "INSTALLMENT"
                  ? "Excess payment automatically carries forward."
                  : "Record a payment received from the customer."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Type</Label>
                  <Select value={pmtType} onValueChange={setPmtType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOWN_PAYMENT">Down Payment</SelectItem>
                      <SelectItem value="INSTALLMENT">Installment</SelectItem>
                      <SelectItem value="LATE_FEE">Late Fee Only</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (৳)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
                    <Input type="number" inputMode="numeric" value={pmtAmount}
                      onChange={(e) => setPmtAmount(e.target.value)}
                      placeholder="0" className="pl-6 h-8 text-sm" min={0} />
                  </div>
                </div>
              </div>

              {["INSTALLMENT","LATE_FEE"].includes(pmtType) && unpaidInsts.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Apply to Installment
                    <span className="ml-1 text-[10px] text-muted-foreground">(auto = first unpaid)</span>
                  </Label>
                  <Select value={pmtInstId} onValueChange={setPmtInstId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Auto — first unpaid" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">Auto — first unpaid</SelectItem>
                      {unpaidInsts.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          #{i.installmentNo} · {fmtDate(i.dueDate)} · {fmt(i.remainingAmount)}
                          {i.lateFee > 0 && ` +${fmt(i.lateFee)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {pmtType === "INSTALLMENT" && (
                <OverpaymentPreview pmtAmount={pmtAmount} unpaidInsts={unpaidInsts} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Method</Label>
                  <Select value={pmtMethod} onValueChange={setPmtMethod}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Select method</SelectItem>
                      {["bKash","Nagad","Rocket","Bank Transfer","Cash","Card","Cheque","Other"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Transaction No.</Label>
                  <Input value={pmtTxn} onChange={(e) => setPmtTxn(e.target.value)}
                    placeholder="TXN123…" className="h-8 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reference No. (optional)</Label>
                <Input value={pmtRef} onChange={(e) => setPmtRef(e.target.value)}
                  placeholder="Bank ref / receipt number" className="h-8 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Note (optional)</Label>
                <Textarea value={pmtNote} onChange={(e) => setPmtNote(e.target.value)}
                  placeholder="Additional notes…" rows={2} className="text-xs resize-none" />
              </div>

              {err && (
                <Alert variant="destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">{err}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setShowPayment(false)}>Cancel</Button>
              <Button size="sm" onClick={handlePayment}
                disabled={busy || !pmtAmount || parseFloat(pmtAmount) <= 0}>
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════
            INSTALLMENT ACTION DIALOG
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={showInstAction} onOpenChange={setShowInstAction}>
          <DialogContent className="mx-4 w-full rounded-2xl sm:mx-auto sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center gap-2">
                {instAction === "reschedule"      && <><CalendarDays className="w-4 h-4 text-amber-600"    />Reschedule</>}
                {instAction === "waive"           && <><BadgeX       className="w-4 h-4 text-purple-600"  />Waive Installment</>}
                {instAction === "adjust_amount"   && <><Pencil       className="w-4 h-4 text-blue-600"    />Adjust Amount</>}
                {instAction === "add_late_fee"    && <><AlertTriangle className="w-4 h-4 text-orange-600" />Add Late Fee</>}
                {instAction === "remove_late_fee" && <><Minus        className="w-4 h-4 text-green-600"   />Remove Late Fee</>}
                {instAction === "reset"           && <><RotateCcw    className="w-4 h-4 text-destructive" />Reset to Unpaid</>}
              </DialogTitle>
              {targetInst && (
                <DialogDescription className="text-xs">
                  Installment #{targetInst.installmentNo} · {fmtDate(targetInst.dueDate)} · {fmt(targetInst.amount)}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-3">
              {instAction === "reschedule" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">New Due Date</Label>
                  <Input type="date" value={instActionDate}
                    onChange={(e) => setInstActionDate(e.target.value)} className="h-8 text-sm" />
                </div>
              )}
              {instAction === "adjust_amount" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">New Amount (৳)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
                    <Input type="number" inputMode="numeric" value={instActionAmount}
                      onChange={(e) => setInstActionAmount(e.target.value)} className="pl-6 h-8 text-sm" />
                  </div>
                </div>
              )}
              {instAction === "add_late_fee" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Late Fee (৳)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
                    <Input type="number" inputMode="numeric" value={instActionFee}
                      onChange={(e) => setInstActionFee(e.target.value)}
                      placeholder={`Default: ${loan?.lateFee || 0}`} className="pl-6 h-8 text-sm" />
                  </div>
                </div>
              )}
              {instAction === "waive" && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-700 dark:text-purple-300">
                  Marks as <strong>Waived</strong> — no payment required; counts toward completion.
                </div>
              )}
              {instAction === "reset" && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                  All payment data for this installment will be cleared (paid → 0, status → Unpaid).
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Reason / Note</Label>
                <Input value={instActionReason} onChange={(e) => setInstActionReason(e.target.value)}
                  placeholder="e.g. Customer request, system correction…" className="h-8 text-xs" />
              </div>

              {err && (
                <Alert variant="destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">{err}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setShowInstAction(false)}>Cancel</Button>
              <Button size="sm" onClick={handleInstAction} disabled={busy}
                className={
                  instAction === "waive" ? "bg-purple-600 hover:bg-purple-700 text-white" :
                  instAction === "reset" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
                }>
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}