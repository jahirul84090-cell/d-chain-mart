/**
 * File: app/admin/accounting/reports/page.jsx
 */

"use client";

import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  CreditCard,
  FileDown,
  Package,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  {
    title: "Daily Report",
    desc: "Daily sales, collection, expenses and net profit.",
    href: "/admin/accounting/daily",
    icon: CalendarDays,
  },
  {
    title: "Monthly Report",
    desc: "Month-by-month sales, EMI collection and profit.",
    href: "/admin/accounting/monthly",
    icon: BarChart3,
  },
  {
    title: "Product Report",
    desc: "Product-wise revenue, stock value and profit.",
    href: "/admin/accounting/products",
    icon: Package,
  },
  {
    title: "Loan Report",
    desc: "Loan sales, collection, outstanding and expected profit.",
    href: "/admin/accounting/loans",
    icon: CreditCard,
  },
  {
    title: "Expense Report",
    desc: "All business expenses with date and category filters.",
    href: "/admin/accounting/expenses",
    icon: ReceiptText,
  },
  {
    title: "Stock Ledger",
    desc: "Stock in, stock out, damage, return and adjustments.",
    href: "/admin/accounting/stock",
    icon: Boxes,
  },
];

export default function AccountingReportsPage() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Accounting Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Open sales, loans, stock, expenses and profit reports.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/admin/accounting">
              <Wallet className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <Card key={report.href} className="transition hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {report.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="min-h-10 text-sm text-muted-foreground">
                    {report.desc}
                  </p>

                  <div className="mt-5 flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={report.href}>Open Report</Link>
                    </Button>

                    <Button asChild variant="outline" size="icon">
                      <Link href={report.href}>
                        <FileDown className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}