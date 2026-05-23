"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  Banknote,
  ShoppingCart,
  RefreshCw,
  Package,
  CheckCircle2,
} from "lucide-react";

const tk = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });

const pct = (n) =>
  (isNaN(n) || !isFinite(n) ? "0" : Number(n).toFixed(1)) + "%";

const NOW = new Date();

function KPI({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-0.5 text-2xl font-black">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(String(NOW.getFullYear()));
  const [tenure, setTenure] = useState("6");
  const [activeTab, setActiveTab] = useState("monthly");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/inventory/reports/monthly?year=${year}`
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load report.");
      }

      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const months = data?.months || [];
  const totals = data?.totals || {};
  const interest = data?.interestScenarios || [];
  const maxProfit = Math.max(...months.map((m) => m.profit), 1);

  const filteredInterest = interest
    .filter((product) =>
      product.scenarios.some((scenario) => scenario.tenure === parseInt(tenure))
    )
    .map((product) => ({
      ...product,
      scenario10: product.scenarios.find(
        (scenario) =>
          scenario.rate === 10 && scenario.tenure === parseInt(tenure)
      ),
      scenario20: product.scenarios.find(
        (scenario) =>
          scenario.rate === 20 && scenario.tenure === parseInt(tenure)
      ),
    }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/inventory-sales">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              </Link>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-black">Reports</h1>
                <p className="text-xs text-slate-500">
                  Monthly breakdown + interest profit analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-8 w-24 text-sm">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex gap-1 border-b dark:border-slate-700">
            {[
              ["monthly", "Monthly Report"],
              ["interest", "Interest Profit"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === value
                    ? "border-violet-600 text-violet-700 dark:text-violet-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {activeTab === "monthly" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <KPI
                    label="Total Revenue"
                    value={tk(totals.revenue)}
                    icon={Banknote}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                  />

                  <KPI
                    label="Total Buy Cost"
                    value={tk(totals.cost)}
                    icon={Package}
                    color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                  />

                  <KPI
                    label="Total Profit"
                    value={tk(totals.profit)}
                    icon={TrendingUp}
                    color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    sub={`Margin: ${pct(totals.profitMargin)}`}
                  />

                  <KPI
                    label="Avg Monthly Profit"
                    value={tk(totals.avgMonthlyProfit)}
                    icon={BarChart3}
                    color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
                    sub={`${totals.monthCount || 0} months`}
                  />
                </div>

                {months.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900">
                    <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-300" />

                    <p className="text-sm text-slate-500">
                      No sales data for {year}. Record some sales first.
                    </p>

                    <Link href="/dashboard/inventory-sales">
                      <Button
                        size="sm"
                        className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Record Sales
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                      <p className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                        Monthly Profit — {year}
                      </p>

                      <div className="space-y-3">
                        {months.map((month) => (
                          <div
                            key={`${month.year}-${month.month}`}
                            className="flex items-center gap-3"
                          >
                            <div className="w-20 flex-shrink-0 text-right text-xs font-semibold text-slate-500">
                              {month.monthName?.slice(0, 3)} {month.year}
                            </div>

                            <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                              <div
                                className="flex h-full items-center rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-2 transition-all duration-500"
                                style={{
                                  width: `${Math.max(
                                    4,
                                    (month.profit / maxProfit) * 100
                                  )}%`,
                                }}
                              >
                                {month.profit > maxProfit * 0.15 && (
                                  <span className="text-[10px] font-bold text-white">
                                    {tk(month.profit)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="w-24 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {tk(month.profit)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-800/60">
                              <TableHead>Month</TableHead>
                              <TableHead className="text-right">
                                Units Sold
                              </TableHead>
                              <TableHead className="text-right">
                                Revenue
                              </TableHead>
                              <TableHead className="text-right">
                                Buy Cost
                              </TableHead>
                              <TableHead className="text-right">
                                Profit
                              </TableHead>
                              <TableHead className="text-right">
                                Margin
                              </TableHead>
                              <TableHead style={{ width: "180px" }}>
                                Profit Bar
                              </TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {months.map((month) => (
                              <TableRow key={`${month.year}-${month.month}`}>
                                <TableCell className="font-semibold">
                                  {month.monthName} {month.year}
                                </TableCell>

                                <TableCell className="text-right">
                                  {month.units}
                                </TableCell>

                                <TableCell className="text-right font-medium">
                                  {tk(month.revenue)}
                                </TableCell>

                                <TableCell className="text-right text-amber-600 dark:text-amber-400">
                                  {tk(month.cost)}
                                </TableCell>

                                <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                  {tk(month.profit)}
                                </TableCell>

                                <TableCell className="text-right">
                                  {pct(month.profitMargin)}
                                </TableCell>

                                <TableCell>
                                  <Progress
                                    value={
                                      maxProfit > 0
                                        ? (month.profit / maxProfit) * 100
                                        : 0
                                    }
                                    className="h-2"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}

                            <TableRow className="bg-slate-50 font-bold dark:bg-slate-800/60">
                              <TableCell>TOTAL</TableCell>
                              <TableCell className="text-right">
                                {totals.units}
                              </TableCell>
                              <TableCell className="text-right">
                                {tk(totals.revenue)}
                              </TableCell>
                              <TableCell className="text-right text-amber-600">
                                {tk(totals.cost)}
                              </TableCell>
                              <TableCell className="text-right text-base text-emerald-600 dark:text-emerald-400">
                                {tk(totals.profit)}
                              </TableCell>
                              <TableCell className="text-right">
                                {pct(totals.profitMargin)}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {months.map((month) => (
                        <div
                          key={`card-${month.year}-${month.month}`}
                          className="rounded-2xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-bold">
                              {month.monthName} {month.year}
                            </p>

                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                              {tk(month.profit)}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-sm">
                            {[
                              [
                                "Revenue",
                                tk(month.revenue),
                                "text-blue-600 dark:text-blue-400",
                              ],
                              [
                                "Buy Cost",
                                tk(month.cost),
                                "text-amber-600 dark:text-amber-400",
                              ],
                              [
                                "Units",
                                month.units + " units",
                                "text-slate-700 dark:text-slate-300",
                              ],
                              [
                                "Transactions",
                                month.sales?.length || "—",
                                "text-slate-700",
                              ],
                              [
                                "Profit Margin",
                                pct(month.profitMargin),
                                "text-emerald-600 dark:text-emerald-400",
                              ],
                            ].map(([label, value, color]) => (
                              <div key={label}>
                                <p className="text-[10px] text-slate-400">
                                  {label}
                                </p>
                                <p className={`text-sm font-bold ${color}`}>
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "interest" && (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                  <p className="mb-1 text-sm font-bold">
                    EMI Interest Profit Calculator
                  </p>

                  <p className="mb-4 text-xs text-slate-500">
                    If you sell on EMI at 10% or 20% annual interest — how much
                    extra profit do you earn per product compared to direct cash
                    sale?
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Loan Tenure:
                    </p>

                    <div className="flex gap-2">
                      {["3", "6"].map((item) => (
                        <button
                          key={item}
                          onClick={() => setTenure(item)}
                          className={`rounded-lg border px-4 py-1.5 text-sm font-bold transition-all ${
                            tenure === item
                              ? "border-violet-500 bg-violet-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {item} Months
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredInterest.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900">
                    <TrendingUp className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500">
                      No sales data. Record sales first to see interest profit
                      analysis.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Cash Sale",
                          sub: "Direct sell (no interest)",
                          color:
                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        },
                        {
                          label: "10% Interest",
                          sub: `${tenure}-month EMI plan`,
                          color:
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                        },
                        {
                          label: "20% Interest",
                          sub: `${tenure}-month EMI plan`,
                          color:
                            "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                        },
                      ].map(({ label, sub, color }) => (
                        <div
                          key={label}
                          className={`rounded-xl p-3 text-center ${color}`}
                        >
                          <p className="text-sm font-bold">{label}</p>
                          <p className="text-[10px] opacity-70">{sub}</p>
                        </div>
                      ))}
                    </div>

                    {filteredInterest.map((product) => {
                      const baseProfitPerUnit =
                        product.unitsSold > 0
                          ? product.baseProfit / product.unitsSold
                          : 0;

                      const extra10 = product.scenario10
                        ? product.scenario10.profitPerUnit - baseProfitPerUnit
                        : 0;

                      const extra20 = product.scenario20
                        ? product.scenario20.profitPerUnit - baseProfitPerUnit
                        : 0;

                      return (
                        <div
                          key={product.productId}
                          className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                            <div>
                              <p className="text-sm font-bold">
                                {product.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {product.unitsSold} units sold · Buy:{" "}
                                {tk(product.buyPrice)} · Sell:{" "}
                                {tk(product.sellPrice)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] text-slate-400">
                                Total base profit
                              </p>

                              <p className="font-black text-emerald-600 dark:text-emerald-400">
                                {tk(product.baseProfit)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 divide-x dark:divide-slate-700">
                            <div className="p-4">
                              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Cash Sale
                              </p>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">
                                    Sell Price
                                  </span>
                                  <span className="font-medium">
                                    {tk(product.sellPrice)}
                                  </span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-slate-500">
                                    Buy Cost
                                  </span>
                                  <span className="text-amber-600">
                                    {tk(product.buyPrice)}
                                  </span>
                                </div>

                                <div className="flex justify-between border-t pt-1 dark:border-slate-700">
                                  <span className="font-semibold">
                                    Profit/unit
                                  </span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {tk(baseProfitPerUnit)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {product.scenario10 && (
                              <div className="bg-emerald-50/40 p-4 dark:bg-emerald-950/10">
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                  10% p.a. · {tenure}M
                                </p>

                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      EMI/month
                                    </span>
                                    <span className="font-medium">
                                      {tk(product.scenario10.emi)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Customer pays
                                    </span>
                                    <span className="font-medium">
                                      {tk(product.scenario10.totalPay)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Interest earned
                                    </span>
                                    <span className="font-semibold text-emerald-600">
                                      +{tk(product.scenario10.interest)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between border-t pt-1 dark:border-slate-700">
                                    <span className="font-semibold">
                                      Profit/unit
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                      {tk(product.scenario10.profitPerUnit)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Extra vs cash
                                    </span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                      +{tk(extra10)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {product.scenario20 && (
                              <div className="bg-blue-50/40 p-4 dark:bg-blue-950/10">
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                  20% p.a. · {tenure}M
                                </p>

                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      EMI/month
                                    </span>
                                    <span className="font-medium">
                                      {tk(product.scenario20.emi)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Customer pays
                                    </span>
                                    <span className="font-medium">
                                      {tk(product.scenario20.totalPay)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Interest earned
                                    </span>
                                    <span className="font-semibold text-blue-600">
                                      +{tk(product.scenario20.interest)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between border-t pt-1 dark:border-slate-700">
                                    <span className="font-semibold">
                                      Profit/unit
                                    </span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                      {tk(product.scenario20.profitPerUnit)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Extra vs cash
                                    </span>
                                    <span className="font-bold text-blue-700 dark:text-blue-300">
                                      +{tk(extra20)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              If ALL {product.unitsSold} sold units were on EMI
                            </p>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-[10px] text-slate-400">
                                  Cash Total
                                </p>
                                <p className="font-bold text-slate-700 dark:text-slate-300">
                                  {tk(product.baseProfit)}
                                </p>
                              </div>

                              {product.scenario10 && (
                                <div>
                                  <p className="text-[10px] text-slate-400">
                                    10% Total
                                  </p>
                                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {tk(
                                      product.scenario10.profitPerUnit *
                                        product.unitsSold
                                    )}
                                  </p>
                                </div>
                              )}

                              {product.scenario20 && (
                                <div>
                                  <p className="text-[10px] text-slate-400">
                                    20% Total
                                  </p>
                                  <p className="font-bold text-blue-600 dark:text-blue-400">
                                    {tk(
                                      product.scenario20.profitPerUnit *
                                        product.unitsSold
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Overall Profit Summary (all products)
                      </p>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b dark:border-slate-700">
                              <th className="py-2 text-left text-xs font-semibold text-slate-500">
                                Scenario
                              </th>
                              <th className="py-2 text-right text-xs font-semibold text-slate-500">
                                Total Profit
                              </th>
                              <th className="py-2 text-right text-xs font-semibold text-slate-500">
                                Extra Interest
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr className="border-b dark:border-slate-700">
                              <td className="py-2.5 font-medium">
                                Cash Sale (direct)
                              </td>
                              <td className="text-right font-bold text-slate-700 dark:text-slate-300">
                                {tk(totals.profit)}
                              </td>
                              <td className="text-right text-slate-400">—</td>
                            </tr>

                            <tr className="border-b dark:border-slate-700">
                              <td className="py-2.5 font-medium">
                                10% EMI · {tenure}M
                              </td>
                              <td className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                {tk(
                                  filteredInterest.reduce(
                                    (sum, product) =>
                                      sum +
                                      (product.scenario10?.profitPerUnit || 0) *
                                        product.unitsSold,
                                    0
                                  )
                                )}
                              </td>
                              <td className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                +
                                {tk(
                                  filteredInterest.reduce((sum, product) => {
                                    if (!product.scenario10) return sum;

                                    const base =
                                      product.unitsSold > 0
                                        ? product.baseProfit / product.unitsSold
                                        : 0;

                                    return (
                                      sum +
                                      (product.scenario10.profitPerUnit - base) *
                                        product.unitsSold
                                    );
                                  }, 0)
                                )}
                              </td>
                            </tr>

                            <tr>
                              <td className="py-2.5 font-medium">
                                20% EMI · {tenure}M
                              </td>
                              <td className="text-right font-bold text-blue-600 dark:text-blue-400">
                                {tk(
                                  filteredInterest.reduce(
                                    (sum, product) =>
                                      sum +
                                      (product.scenario20?.profitPerUnit || 0) *
                                        product.unitsSold,
                                    0
                                  )
                                )}
                              </td>
                              <td className="text-right font-semibold text-blue-600 dark:text-blue-400">
                                +
                                {tk(
                                  filteredInterest.reduce((sum, product) => {
                                    if (!product.scenario20) return sum;

                                    const base =
                                      product.unitsSold > 0
                                        ? product.baseProfit / product.unitsSold
                                        : 0;

                                    return (
                                      sum +
                                      (product.scenario20.profitPerUnit - base) *
                                        product.unitsSold
                                    );
                                  }, 0)
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}