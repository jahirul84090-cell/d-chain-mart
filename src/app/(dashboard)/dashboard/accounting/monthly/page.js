/**
 * File: app/admin/accounting/monthly/page.jsx
 */

"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Loader2,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-bold">{value}</h3>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountingMonthlyPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMonthly() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/accounting/monthly?year=${year}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load monthly report.");
        return;
      }

      setMonthly(data.monthly || []);
      setSummary(data.summary || {});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonthly();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Monthly Accounting
            </h1>
            <p className="text-sm text-muted-foreground">
              Yearly month-by-month sales, collection, expense and profit.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-32"
            />

            <Button onClick={loadMonthly} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Load
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Collection"
            value={money(summary.totalCollection)}
            icon={Wallet}
          />
          <StatCard
            title="Gross Profit"
            value={money(summary.grossProfit)}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Expense"
            value={money(summary.totalExpense)}
            icon={TrendingDown}
          />
          <StatCard
            title="Net Profit"
            value={money(summary.netProfit)}
            icon={BarChart3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Direct Sales</p>
              <h3 className="mt-2 text-2xl font-bold">
                {money(summary.directSales)}
              </h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Loan Sales</p>
              <h3 className="mt-2 text-2xl font-bold">
                {money(summary.loanSales)}
              </h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">EMI Collected</p>
              <h3 className="mt-2 text-2xl font-bold">
                {money(summary.emiCollected)}
              </h3>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Monthly Report - {year}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Direct Sales</TableHead>
                    <TableHead>Loan Sales</TableHead>
                    <TableHead>Down Payment</TableHead>
                    <TableHead>EMI</TableHead>
                    <TableHead>Total Collection</TableHead>
                    <TableHead>Gross Profit</TableHead>
                    <TableHead>Expense</TableHead>
                    <TableHead>Net Profit</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : monthly.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No monthly data found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthly.map((item) => (
                      <TableRow key={item.monthNumber}>
                        <TableCell className="font-semibold">
                          {item.month}
                        </TableCell>
                        <TableCell>{money(item.directSales)}</TableCell>
                        <TableCell>{money(item.loanSales)}</TableCell>
                        <TableCell>
                          {money(item.downPaymentCollected)}
                        </TableCell>
                        <TableCell>{money(item.emiCollected)}</TableCell>
                        <TableCell className="font-semibold">
                          {money(item.totalCollection)}
                        </TableCell>
                        <TableCell>{money(item.grossProfit)}</TableCell>
                        <TableCell>{money(item.totalExpense)}</TableCell>
                        <TableCell className="font-bold">
                          {money(item.netProfit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}