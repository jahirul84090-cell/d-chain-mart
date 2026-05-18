"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useState, useEffect } from "react";
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

<<<<<<< HEAD
=======
// shadcn/ui components
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
<<<<<<< HEAD

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { Progress } from "@/components/ui/progress";

=======
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<<<<<<< HEAD
=======
// icons
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
import {
  ShieldCheck,
  CreditCard,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  Loader2,
  Package,
  User,
  FileText,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Product", icon: Package },
  { id: 2, label: "Loan Terms", icon: CreditCard },
  { id: 3, label: "Personal Info", icon: User },
  { id: 4, label: "Review", icon: FileText },
];

const JOB_TYPES = [
  "Government Employee",
  "Private Employee",
  "Business Owner",
  "Freelancer",
  "Teacher",
  "Doctor",
  "Engineer",
  "Retired",
  "Other",
];

const TENURE_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

function formatCurrency(amount) {
  return `৳${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function StepIndicator({ currentStep }) {
  return (
    <div className="mb-8 flex w-full items-center justify-center">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
<<<<<<< HEAD

        const isCompleted = currentStep > step.id;

=======
        const isCompleted = currentStep > step.id;
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? "border-green-600 bg-green-600 text-white"
                    : isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              <span
                className={`hidden text-xs font-medium sm:block ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-green-600"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 transition-all duration-300 sm:w-20 ${
                  currentStep > step.id ? "bg-green-600" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EMISummaryCard({ productPrice, downPayment, tenure, interestRate }) {
  const loanAmount = Math.max(
    Number(productPrice || 0) - Number(downPayment || 0),
    0,
  );
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
  const monthlyRate = Number(interestRate || 0) / 100 / 12;

  let emi = 0;

  if (loanAmount > 0 && tenure > 0) {
    if (monthlyRate === 0) {
      emi = loanAmount / tenure;
    } else {
      emi =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1);
    }
  }

  const totalPayable = emi * tenure + Number(downPayment || 0);
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
  const totalInterest = Math.max(totalPayable - Number(productPrice || 0), 0);

  return (
    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-semibold text-primary">EMI Breakdown</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Monthly EMI</p>
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
          <p className="text-lg font-bold text-primary">
            {formatCurrency(Math.round(emi))}
          </p>
        </div>

        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Loan Amount</p>
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
          <p className="text-lg font-bold">{formatCurrency(loanAmount)}</p>
        </div>

        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Total Interest</p>
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
          <p className="text-lg font-bold text-amber-600">
            {formatCurrency(Math.round(totalInterest))}
          </p>
        </div>

        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Total Payable</p>
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
          <p className="text-lg font-bold">
            {formatCurrency(Math.round(totalPayable))}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ApplyLoanPage() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
<<<<<<< HEAD

  const [loading, setLoading] = useState(false);

  const [productLoading, setProductLoading] = useState(false);

  const [settingsLoading, setSettingsLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const [submittedLoan, setSubmittedLoan] = useState(null);

  const [product, setProduct] = useState(null);

  const productSlug = searchParams.get("slug") || "";

  const [downPayment, setDownPayment] = useState("");

  const [tenure, setTenure] = useState("12");

=======
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState(null);

  const [product, setProduct] = useState(null);
  const [productId, setProductId] = useState(
    searchParams.get("productId") || "",
  );
  const [productSearch, setProductSearch] = useState("");

  const [downPayment, setDownPayment] = useState("");
  const [tenure, setTenure] = useState("12");
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
  const [loanSettings, setLoanSettings] = useState({
    minDownPaymentPct: 30,
    defaultInterest: 10,
  });

  const [nidNumber, setNidNumber] = useState("");
<<<<<<< HEAD

  const [monthlyIncome, setMonthlyIncome] = useState("");

  const [jobType, setJobType] = useState("");

=======
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [jobType, setJobType] = useState("");
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
  const [customerNote, setCustomerNote] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/loans/settings");
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        const data = await res.json();

        if (data?.settings) {
          setLoanSettings({
            minDownPaymentPct: Number(data.settings.minDownPaymentPct || 30),
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
            defaultInterest: Number(data.settings.defaultInterest || 10),
          });
        }
      } catch {
<<<<<<< HEAD
=======
        // fallback settings already set
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
      } finally {
        setSettingsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    if (settingsLoading) return;

    if (!productSlug) {
      setError("Missing product slug. Please apply from product page.");

      return;
    }

    fetchProduct(productSlug);
  }, [productSlug, settingsLoading]);

  async function fetchProduct(slug) {
    setProductLoading(true);

    setError("");

    try {
      const res = await fetch(`/api/admin/product/slug/${slug}`);

=======
    if (!productId || settingsLoading) return;
    fetchProduct(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, settingsLoading]);

  async function fetchProduct(id) {
    setProductLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${id}`);
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
      const data = await res.json();

      if (!res.ok || !data?.product) {
        setError(data?.message || "Product not found.");
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return;
      }

      const selectedProduct = data.product;
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
      const minDP =
        (Number(selectedProduct.price || 0) * loanSettings.minDownPaymentPct) /
        100;

      setProduct(selectedProduct);
<<<<<<< HEAD

=======
      setProductId(selectedProduct.id);
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
      setDownPayment(String(Math.ceil(minDP)));
    } catch {
      setError("Failed to fetch product.");
    } finally {
      setProductLoading(false);
    }
  }

<<<<<<< HEAD
=======
  async function handleProductSearch(e) {
    e.preventDefault();

    if (!productSearch.trim()) {
      setError("Please enter product name.");
      return;
    }

    setProductLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(productSearch)}&limit=1`,
      );

      const data = await res.json();

      if (!res.ok || !data?.products?.length) {
        setError(data?.message || "No product found with that name.");
        return;
      }

      const selectedProduct = data.products[0];
      const minDP =
        (Number(selectedProduct.price || 0) * loanSettings.minDownPaymentPct) /
        100;

      setProduct(selectedProduct);
      setProductId(selectedProduct.id);
      setDownPayment(String(Math.ceil(minDP)));
    } catch {
      setError("Search failed.");
    } finally {
      setProductLoading(false);
    }
  }

>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
  function validateStep() {
    setError("");

    if (step === 1) {
<<<<<<< HEAD
      if (!productSlug) {
        setError("Missing product slug.");

        return false;
      }

      if (!product) {
        setError("Product not found.");

=======
      if (!product) {
        setError("Please select a product.");
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }

      if (Number(product.stockAmount || 0) <= 0) {
<<<<<<< HEAD
        setError("This product is out of stock.");

=======
        setError("This product is currently out of stock.");
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }
    }

    if (step === 2) {
      const dp = Number(downPayment);
<<<<<<< HEAD

      const price = Number(product?.price || 0);

      const minDP = (price * loanSettings.minDownPaymentPct) / 100;

      if (!dp || dp <= 0) {
        setError("Please enter valid down payment.");

=======
      const price = Number(product?.price || 0);
      const minDP = (price * loanSettings.minDownPaymentPct) / 100;

      if (!dp || dp <= 0) {
        setError("Please enter a valid down payment amount.");
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }

      if (dp < minDP) {
<<<<<<< HEAD
        setError(`Minimum down payment is ${formatCurrency(Math.ceil(minDP))}`);

=======
        setError(
          `Minimum down payment is ${loanSettings.minDownPaymentPct}% = ${formatCurrency(
            Math.ceil(minDP),
          )}`,
        );
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }

      if (dp >= price) {
        setError("Down payment must be less than product price.");
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }

      if (!tenure) {
        setError("Please select loan tenure.");
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }
    }

    if (step === 3) {
      if (!nidNumber.trim()) {
        setError("NID number is required.");
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }

      if (!monthlyIncome || Number(monthlyIncome) <= 0) {
<<<<<<< HEAD
        setError("Monthly income required.");

=======
        setError("Please enter your monthly income.");
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }

      if (!jobType) {
<<<<<<< HEAD
        setError("Please select job type.");

=======
        setError("Please select your job type.");
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    if (validateStep()) {
      setStep((current) => current + 1);
    }
  }

  function prevStep() {
    setError("");
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
    setStep((current) => current - 1);
  }

  async function handleSubmit() {
    if (!validateStep()) return;

    setLoading(true);
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
    setError("");

    try {
      const res = await fetch("/api/loans/apply", {
        method: "POST",
<<<<<<< HEAD

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          productId: product.id,

          downPayment: Number(downPayment),

          tenureMonths: Number(tenure),

          nidNumber,

          monthlyIncome: Number(monthlyIncome),

          jobType,

=======
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          downPayment: Number(downPayment),
          tenureMonths: Number(tenure),
          nidNumber,
          monthlyIncome: Number(monthlyIncome),
          jobType,
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
          customerNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || data?.error || "Something went wrong.");
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
        return;
      }

      setSubmittedLoan(data.loan);
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success && submittedLoan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-5 pb-6 pt-8 text-center">
            <div className="flex justify-center">
<<<<<<< HEAD
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
=======
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold">Application Submitted!</h2>
<<<<<<< HEAD

              <p className="mt-1 text-sm text-muted-foreground">
                We will review your application.
              </p>
            </div>

            <Button asChild>
              <Link href="/dashboard/loans">View My Applications</Link>
            </Button>
=======
              <p className="mt-1 text-sm text-muted-foreground">
                We will review your application and contact you soon.
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-muted p-4 text-left text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Product</span>
                <span className="text-right font-medium">
                  {product?.name ||
                    submittedLoan?.product?.name ||
                    "Selected Product"}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-muted-foreground">Down Payment</span>
                <span className="font-medium">
                  {formatCurrency(submittedLoan.downPayment)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly EMI</span>
                <span className="font-bold text-primary">
                  {formatCurrency(submittedLoan.monthlyEmi)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenure</span>
                <span className="font-medium">
                  {submittedLoan.tenureMonths} months
                </span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">Pending Review</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/dashboard/loans">View My Applications</Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
          </CardContent>
        </Card>
      </div>
    );
  }

  const minDP = product
    ? (Number(product.price || 0) * loanSettings.minDownPaymentPct) / 100
    : 0;

  const dpNum = Number(downPayment) || 0;

  const dpPct =
    product && Number(product.price || 0) > 0
      ? (dpNum / Number(product.price)) * 100
      : 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Apply for EMI Loan
            </h1>
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
            <p className="text-sm text-muted-foreground">
              Buy now, pay in easy monthly installments
            </p>
          </div>

          <StepIndicator currentStep={step} />

          <Progress value={(step / STEPS.length) * 100} className="h-1.5" />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
<<<<<<< HEAD

=======
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
<<<<<<< HEAD
                    <Package className="h-5 w-5" />
                    Selected Product
                  </CardTitle>

                  <CardDescription>
                    Product selected from product page
=======
                    <Package className="h-5 w-5" /> Select Product
                  </CardTitle>
                  <CardDescription>
                    Choose the product you want to purchase on installment
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
<<<<<<< HEAD
                  {productLoading && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {!productLoading && !product && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />

                      <AlertDescription>Product not found.</AlertDescription>
                    </Alert>
=======
                  {!product && (
                    <form onSubmit={handleProductSearch} className="flex gap-2">
                      <Input
                        placeholder="Search product by name..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        disabled={productLoading}
                      />

                      <Button type="submit" disabled={productLoading}>
                        {productLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Search"
                        )}
                      </Button>
                    </form>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                  )}

                  {product && (
                    <div className="space-y-3 rounded-xl border p-4">
                      <div className="flex items-start gap-4">
                        {product.mainImage && (
<<<<<<< HEAD
                          <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
=======
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border">
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                            <Image
                              src={product.mainImage}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

<<<<<<< HEAD
                        <div className="flex-1">
                          <p className="text-base font-semibold">
=======
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold leading-tight">
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                            {product.name}
                          </p>

                          {product.category && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {product.category.name}
                            </Badge>
                          )}

                          <p className="mt-2 text-2xl font-bold text-primary">
                            {formatCurrency(product.price)}
                          </p>
<<<<<<< HEAD
                        </div>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/product/${product.slug}`}>
                          Back to Product
                        </Link>
=======

                          {Number(product.stockAmount || 0) <= 0 && (
                            <p className="mt-1 text-xs text-red-500">
                              Out of stock
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProduct(null);
                          setProductId("");
                          setDownPayment("");
                          setError("");
                        }}
                      >
                        Change Product
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                      </Button>
                    </div>
                  )}

<<<<<<< HEAD
                  <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />

                    <span>
                      Minimum {loanSettings.minDownPaymentPct}% down payment
                      required.
=======
                  {!product && !productLoading && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Package className="mx-auto mb-2 h-10 w-10 opacity-40" />
                      <p className="text-sm">
                        Search for a product to get started
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      Minimum {loanSettings.minDownPaymentPct}% down payment
                      required. Interest rate: {loanSettings.defaultInterest}%
                      per annum.
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                    </span>
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && product && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
<<<<<<< HEAD
                    <CreditCard className="h-5 w-5" />
                    Loan Terms
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Down Payment</Label>
=======
                    <CreditCard className="h-5 w-5" /> Loan Terms
                  </CardTitle>
                  <CardDescription>
                    Set your down payment and repayment period
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    {product.mainImage && (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                        <Image
                          src={product.mainImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="font-bold text-primary">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="downPayment">
                        Down Payment{" "}
                        <span className="font-normal text-muted-foreground">
                          (min {loanSettings.minDownPaymentPct}%)
                        </span>
                      </Label>

                      <Tooltip>
                        <TooltipTrigger type="button">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Minimum: {formatCurrency(Math.ceil(minDP))}
                        </TooltipContent>
                      </Tooltip>
                    </div>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                        ৳
                      </span>

                      <Input
<<<<<<< HEAD
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className="pl-7"
                      />
                    </div>

                    {dpNum > 0 && (
=======
                        id="downPayment"
                        type="number"
                        placeholder={`Min: ${Math.ceil(minDP)}`}
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className="pl-7"
                        min={Math.ceil(minDP)}
                        max={Number(product.price) - 1}
                      />
                    </div>

                    {dpNum > 0 && Number(product.price) > 0 && (
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                      <div className="space-y-1">
                        <Progress
                          value={Math.min(dpPct, 100)}
                          className="h-2"
                        />
<<<<<<< HEAD

                        <p className="text-right text-xs text-muted-foreground">
                          {dpPct.toFixed(1)}%
=======
                        <p className="text-right text-xs text-muted-foreground">
                          {dpPct.toFixed(1)}% of product price
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label>Loan Tenure</Label>
=======
                    <Label>
                      Loan Tenure{" "}
                      <span className="font-normal text-muted-foreground">
                        (months)
                      </span>
                    </Label>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb

                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {TENURE_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTenure(String(item))}
                          className={`rounded-lg border px-1 py-2 text-sm font-medium transition-all ${
                            tenure === String(item)
                              ? "border-primary bg-primary text-primary-foreground"
<<<<<<< HEAD
                              : "border-border bg-background"
=======
                              : "border-border bg-background text-foreground hover:border-primary/50"
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                          }`}
                        >
                          {item}m
                        </button>
                      ))}
                    </div>
                  </div>

<<<<<<< HEAD
                  <EMISummaryCard
                    productPrice={Number(product.price)}
                    downPayment={dpNum}
                    tenure={Number(tenure)}
                    interestRate={loanSettings.defaultInterest}
                  />
=======
                  {dpNum > 0 && dpNum < Number(product.price) && tenure && (
                    <EMISummaryCard
                      productPrice={Number(product.price)}
                      downPayment={dpNum}
                      tenure={Number(tenure)}
                      interestRate={loanSettings.defaultInterest}
                    />
                  )}
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
<<<<<<< HEAD
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
=======
                    <User className="h-5 w-5" /> Personal Information
                  </CardTitle>
                  <CardDescription>
                    Help us verify your identity and assess eligibility
                  </CardDescription>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
<<<<<<< HEAD
                      <Label>NID Number</Label>

                      <Input
                        value={nidNumber}
                        onChange={(e) => setNidNumber(e.target.value)}
=======
                      <Label htmlFor="nid">NID Number *</Label>
                      <Input
                        id="nid"
                        placeholder="10 or 17 digit NID"
                        value={nidNumber}
                        onChange={(e) => setNidNumber(e.target.value)}
                        maxLength={17}
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                      />
                    </div>

                    <div className="space-y-2">
<<<<<<< HEAD
                      <Label>Monthly Income</Label>

                      <Input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                      />
=======
                      <Label htmlFor="income">Monthly Income (৳) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                          ৳
                        </span>

                        <Input
                          id="income"
                          type="number"
                          placeholder="e.g. 25000"
                          value={monthlyIncome}
                          onChange={(e) => setMonthlyIncome(e.target.value)}
                          className="pl-7"
                          min={0}
                        />
                      </div>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                    </div>
                  </div>

                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label>Job Type</Label>

                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
=======
                    <Label>Job Type *</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your employment type" />
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                      </SelectTrigger>

                      <SelectContent>
                        {JOB_TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label>Note</Label>

                    <Textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                    />
=======
                    <Label htmlFor="note">Additional Note (optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Any additional information you'd like to share..."
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      rows={3}
                      maxLength={500}
                    />

                    <p className="text-right text-xs text-muted-foreground">
                      {customerNote.length}/500
                    </p>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                  </div>

                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
<<<<<<< HEAD

                    <AlertDescription className="text-xs">
                      Your information is secure.
=======
                    <AlertDescription className="text-xs">
                      Your personal information is stored securely and used only
                      for loan eligibility assessment.
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </>
            )}

            {step === 4 && product && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
<<<<<<< HEAD
                    <FileText className="h-5 w-5" />
                    Review & Submit
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  <EMISummaryCard
                    productPrice={Number(product.price)}
                    downPayment={Number(downPayment)}
                    tenure={Number(tenure)}
                    interestRate={loanSettings.defaultInterest}
                  />

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Product</span>

                      <span className="font-medium">{product.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Down Payment</span>

                      <span className="font-medium">
                        {formatCurrency(Number(downPayment))}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Tenure</span>

                      <span className="font-medium">{tenure} months</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Income</span>

                      <span className="font-medium">
                        {formatCurrency(Number(monthlyIncome))}
                      </span>
                    </div>
                  </div>
=======
                    <FileText className="h-5 w-5" /> Review & Submit
                  </CardTitle>
                  <CardDescription>
                    Please review all details before submitting
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Product
                    </p>

                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                      {product.mainImage && (
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="font-bold text-primary">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Loan Terms
                    </p>

                    <EMISummaryCard
                      productPrice={Number(product.price)}
                      downPayment={Number(downPayment)}
                      tenure={Number(tenure)}
                      interestRate={loanSettings.defaultInterest}
                    />

                    <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                      <div className="col-span-2 flex justify-between border-b py-1">
                        <span className="text-muted-foreground">
                          Down Payment
                        </span>
                        <span className="font-medium">
                          {formatCurrency(Number(downPayment))}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-between border-b py-1">
                        <span className="text-muted-foreground">Tenure</span>
                        <span className="font-medium">{tenure} months</span>
                      </div>

                      <div className="col-span-2 flex justify-between py-1">
                        <span className="text-muted-foreground">
                          Interest Rate
                        </span>
                        <span className="font-medium">
                          {loanSettings.defaultInterest}% p.a.
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Personal Info
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b py-1">
                        <span className="text-muted-foreground">
                          NID Number
                        </span>
                        <span className="font-medium">{nidNumber}</span>
                      </div>

                      <div className="flex justify-between border-b py-1">
                        <span className="text-muted-foreground">
                          Monthly Income
                        </span>
                        <span className="font-medium">
                          {formatCurrency(Number(monthlyIncome))}
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Job Type</span>
                        <span className="font-medium">{jobType}</span>
                      </div>
                    </div>
                  </div>

                  {customerNote && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Note
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customerNote}
                        </p>
                      </div>
                    </>
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      By submitting, you agree to our loan terms and conditions.
                      Down payment must be paid within 48 hours of approval.
                    </AlertDescription>
                  </Alert>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
                </CardContent>
              </>
            )}
          </Card>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || loading}
<<<<<<< HEAD
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={nextStep}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            )}
=======
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>

            <div className="flex-1 sm:flex-none">
              {step < STEPS.length ? (
                <Button onClick={nextStep} className="w-full">
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
>>>>>>> 32c2020ccc18983ca8ff57281570246fbfd178bb
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
