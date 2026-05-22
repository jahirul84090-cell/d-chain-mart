/**
 * File: app/admin/accounting/page.jsx
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CreditCard,
  DollarSign,
  LineChart,
  Loader2,
  Package,
  ReceiptText,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;

const today = new Date();

const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  .toISOString()
  .slice(0, 10);

const todayDate = today.toISOString().slice(0, 10);

function StatCard({ title, value, sub, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-2xl font-bold">{value}</h3>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountingDashboardPage() {
  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayDate);

  const [dashboard, setDashboard] = useState(null);
  const [monthly, setMonthly] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = useMemo(() => new Date(to || todayDate).getFullYear(), [to]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [dashboardRes, monthlyRes] = await Promise.all([
        fetch(`/api/admin/accounting/dashboard?from=${from}&to=${to}`, {
          cache: "no-store",
        }),
        fetch(`/api/admin/accounting/monthly?year=${year}`, {
          cache: "no-store",
        }),
      ]);

      const dashboardData = await dashboardRes.json();
      const monthlyData = await monthlyRes.json();

      if (!dashboardRes.ok) {
        setError(dashboardData?.error || "Failed to load dashboard.");
        return;
      }

      if (!monthlyRes.ok) {
        setError(monthlyData?.error || "Failed to load monthly report.");
        return;
      }

      setDashboard(dashboardData);
      setMonthly(monthlyData);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const summary = dashboard?.summary || {};
  const counts = dashboard?.counts || {};
  const lowStockProducts = dashboard?.lowStockProducts || [];

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Accounting Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Sales, loan collection, stock value, expenses and profit overview.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/accounting/expenses">Expenses</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/accounting/products">Products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/accounting/loans">Loans</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/accounting/stock">Stock</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
            <div className="grid flex-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  From
                </label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  To
                </label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={loadData} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Collection"
                value={money(summary.totalCollection)}
                sub="Direct sales + loan payments"
                icon={Wallet}
              />
              <StatCard
                title="Direct Sales"
                value={money(summary.directSales)}
                sub={`${counts.directOrders || 0} paid orders`}
                icon={Banknote}
              />
              <StatCard
                title="Loan Sales"
                value={money(summary.loanSales)}
                sub={`${counts.loanApplications || 0} loan applications`}
                icon={CreditCard}
              />
              <StatCard
                title="EMI Collected"
                value={money(summary.emiCollected)}
                sub="Installment payments"
                icon={ReceiptText}
              />

              <StatCard
                title="Gross Profit"
                value={money(summary.grossProfit)}
                sub="Before expenses"
                icon={TrendingUp}
              />
              <StatCard
                title="Expenses"
                value={money(summary.totalExpense)}
                sub={`${counts.expenses || 0} expense entries`}
                icon={TrendingDown}
              />
              <StatCard
                title="Net Profit"
                value={money(summary.netProfit)}
                sub="Gross profit - expenses"
                icon={DollarSign}
              />
              <StatCard
                title="Stock Value"
                value={money(summary.stockValue)}
                sub={`${summary.totalProducts || 0} products`}
                icon={Package}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    Monthly Summary {year}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Collection</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Expense</TableHead>
                          <TableHead>Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(monthly?.monthly || []).map((item) => (
                          <TableRow key={item.month}>
                            <TableCell className="font-medium">
                              {item.month}
                            </TableCell>
                            <TableCell>{money(item.totalCollection)}</TableCell>
                            <TableCell>{money(item.grossProfit)}</TableCell>
                            <TableCell>{money(item.totalExpense)}</TableCell>
                            <TableCell className="font-bold">
                              {money(item.netProfit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Low Stock Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No low stock products.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {lowStockProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 rounded-xl border p-3"
                        >
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                            {product.mainImage ? (
                              <Image
                                src={product.mainImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package className="m-3 h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {product.stockAmount}
                            </p>
                          </div>

                          <Badge variant="destructive">
                            {product.stockAmount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Loan Collection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment</span>
                    <strong>{money(summary.downPaymentCollected)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EMI</span>
                    <strong>{money(summary.emiCollected)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Fee</span>
                    <strong>{money(summary.lateFeeCollected)}</strong>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profit Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direct Profit</span>
                    <strong>{money(summary.directProfit)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Profit</span>
                    <strong>{money(summary.expectedLoanProfit)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Profit</span>
                    <strong>{money(summary.grossProfit)}</strong>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4" />
                    Quick Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/accounting/products">Product Report</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/accounting/loans">Loan Report</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/accounting/expenses">Expense Report</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}