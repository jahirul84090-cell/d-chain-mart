/**
 * File: app/admin/accounting/loans/page.jsx
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  AlertCircle,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCcw,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const todayDate = new Date().toISOString().slice(0, 10);

const firstDayOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
)
  .toISOString()
  .slice(0, 10);

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-2xl font-bold">{value}</h3>
          </div>

          <div className="rounded-xl bg-muted p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusColor = {
  PENDING: "secondary",
  REVIEWING: "secondary",
  APPROVED: "default",
  DOWN_PAYMENT_PENDING: "default",
  ACTIVE: "default",
  COMPLETED: "outline",
  REJECTED: "destructive",
  CANCELLED: "destructive",
};

export default function AccountingLoansPage() {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayDate);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLoans(page = 1) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", page);
      params.set("limit", 20);

      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q) params.set("q", q);
      if (status) params.set("status", status);

      const res = await fetch(
        `/api/admin/accounting/loans?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load loans.");
        return;
      }

      setLoans(data.loans || []);
      setSummary(data.summary || {});
      setPagination(data.pagination || {});
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoans();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Loan Accounting</h1>
          <p className="text-sm text-muted-foreground">
            Loan sales, collection, due and profit report.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Loan Sales"
            value={money(summary.productPrice)}
            icon={Wallet}
          />

          <StatCard
            title="Collected"
            value={money(summary.totalCollected)}
            icon={DollarSign}
          />

          <StatCard
            title="Outstanding"
            value={money(summary.outstanding)}
            icon={CreditCard}
          />

          <StatCard
            title="Expected Profit"
            value={money(summary.expectedProfit)}
            icon={TrendingUp}
          />
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-6">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />

            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            <Input
              placeholder="Search customer/product"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              className="h-10 rounded-md border bg-background px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="APPROVED">Approved</option>
              <option value="DOWN_PAYMENT_PENDING">
                Down Payment Pending
              </option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <Button
              className="md:col-span-2"
              onClick={() => loadLoans(1)}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Filter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Loan</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center"
                      >
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : loans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center"
                      >
                        No loans found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                              {loan.product?.mainImage ? (
                                <Image
                                  src={loan.product.mainImage}
                                  alt={loan.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : null}
                            </div>

                            <div>
                              <p className="font-medium">
                                {loan.product?.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {loan.customer?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {loan.customer?.email}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              statusColor[loan.status] || "outline"
                            }
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {money(loan.loanAmount)}
                        </TableCell>

                        <TableCell>
                          {money(loan.totalCollected)}
                        </TableCell>

                        <TableCell>
                          {money(loan.outstanding)}
                        </TableCell>

                        <TableCell className="font-bold">
                          {money(loan.expectedProfit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                Total {pagination.total || 0} loans
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={
                    loading || (pagination.page || 1) <= 1
                  }
                  onClick={() =>
                    loadLoans((pagination.page || 1) - 1)
                  }
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  disabled={
                    loading ||
                    (pagination.page || 1) >=
                      (pagination.totalPages || 1)
                  }
                  onClick={() =>
                    loadLoans((pagination.page || 1) + 1)
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}