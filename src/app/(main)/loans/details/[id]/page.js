/**
 * File: app/user/loans/[id]/page.js
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  ArrowLeft,
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  ImageIcon,
  Loader2,
  Package,
  ReceiptText,
} from "lucide-react";

const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;

const dateFmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const loanStatusVariant = {
  PENDING: "secondary",
  REVIEWING: "secondary",
  APPROVED: "default",
  DOWN_PAYMENT_PENDING: "destructive",
  ACTIVE: "default",
  COMPLETED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
};

const installmentClass = {
  UNPAID: "bg-slate-100 text-slate-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  WAIVED: "bg-purple-100 text-purple-700",
};

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold">{value || "—"}</span>
    </div>
  );
}

export default function UserLoanDetailsPage() {
  const params = useParams();
  const id = params?.id;

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadLoan() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/user/loans/${id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load loan.");
          return;
        }

        setLoan(data.loan);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadLoan();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading loan details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button asChild variant="outline" className="mt-4">
          <Link href="/loans/details">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loans
          </Link>
        </Button>
      </div>
    );
  }

  if (!loan) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="outline">
            <Link href="/loans/details">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>

          <Badge variant={loanStatusVariant[loan.status] || "outline"}>
            {loan.status}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {loan.product?.mainImage ? (
                <div className="relative h-28 w-28 overflow-hidden rounded-xl border bg-white">
                  <Image
                    src={loan.product.mainImage}
                    alt={loan.product.name}
                    fill
                    className="object-cover" sizes="96px" />
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-xl border bg-white">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-2xl font-bold">{loan.product?.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Application ID: #{String(loan.id).slice(-8).toUpperCase()}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-bold">{money(loan.productPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Loan</p>
                    <p className="font-bold">{money(loan.loanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EMI</p>
                    <p className="font-bold">{money(loan.monthlyEmi)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tenure</p>
                    <p className="font-bold">{loan.tenureMonths} months</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={loan.progressPct || 0} />
              <p className="mt-2 text-sm font-semibold">
                {loan.progressPct || 0}% completed
              </p>
              <p className="text-sm text-muted-foreground">
                {loan.paidInstallments} of {loan.totalInstallments} installments paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-5 w-5 text-blue-600" />
                Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{money(loan.totalCollected)}</p>
              <p className="text-sm text-muted-foreground">Total paid amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-orange-600" />
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{money(loan.totalOutstanding)}</p>
              <p className="text-sm text-muted-foreground">
                Overdue: {loan.overdueInstallments}
              </p>
            </CardContent>
          </Card>
        </div>

        {loan.nextDueInstallment && (
          <Alert>
            <CalendarDays className="h-4 w-4" />
            <AlertDescription>
              Next due: Installment #{loan.nextDueInstallment.installmentNo} —
              {money(loan.nextDueInstallment.remainingAmount)} due on{" "}
              {dateFmt(loan.nextDueInstallment.dueDate)}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Down Payment" value={money(loan.downPayment)} />
              <InfoRow label="Down Payment Paid" value={money(loan.downPaymentPaid)} />
              <InfoRow label="Loan Amount" value={money(loan.loanAmount)} />
              <InfoRow label="Interest Rate" value={`${loan.interestRate}%`} />
              <InfoRow label="Monthly EMI" value={money(loan.monthlyEmi)} />
              <InfoRow label="Total Payable" value={money(loan.totalPayable)} />
              <InfoRow label="Applied At" value={dateFmt(loan.appliedAt)} />
              <InfoRow label="First Due Date" value={dateFmt(loan.firstDueDate)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-blue-600" />
                Applicant Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Name" value={loan.applicantName} />
              <InfoRow label="Address" value={loan.applicantAddress} />
              <InfoRow label="NID" value={loan.nidNumber} />
              <InfoRow label="Monthly Income" value={money(loan.monthlyIncome)} />
              <InfoRow label="Job Type" value={loan.jobType} />
              <Separator className="my-3" />
              <InfoRow label="Nominee" value={loan.nomineeName} />
              <InfoRow label="Relation" value={loan.nomineeRelation} />
              <InfoRow label="Phone" value={loan.nomineePhone} />
              <InfoRow label="Address" value={loan.nomineeAddress} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="h-5 w-5 text-blue-600" />
              Installments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(loan.installments || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.installmentNo}</TableCell>
                      <TableCell>{dateFmt(item.dueDate)}</TableCell>
                      <TableCell>{money(item.amount)}</TableCell>
                      <TableCell>{money(item.paidAmount)}</TableCell>
                      <TableCell>{money(item.remainingAmount)}</TableCell>
                      <TableCell>{money(item.lateFee)}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            installmentClass[item.status] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-5 w-5 text-blue-600" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(loan.payments || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment found.</p>
              ) : (
                <div className="space-y-3">
                  {loan.payments.map((payment) => (
                    <div key={payment.id} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{payment.paymentType}</p>
                        <p className="font-bold">{money(payment.amount)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Paid At: {dateFmt(payment.paidAt)}
                      </p>
                      {payment.installment?.installmentNo && (
                        <p className="text-xs text-muted-foreground">
                          Installment #{payment.installment.installmentNo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(loan.documents || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No document found.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {loan.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-xl border bg-white"
                    >
                      <div className="relative h-32 w-full bg-slate-100">
                        <Image
                          src={doc.url}
                          alt={doc.title || doc.type}
                          fill
                          className="object-cover transition group-hover:scale-105" sizes="240px" unoptimized />
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-semibold">
                          {doc.title || doc.type}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}