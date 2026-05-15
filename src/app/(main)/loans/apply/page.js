"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// icons
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
        const isCompleted = currentStep > step.id;
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
  const totalInterest = Math.max(totalPayable - Number(productPrice || 0), 0);

  return (
    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-semibold text-primary">EMI Breakdown</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Monthly EMI</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(Math.round(emi))}
          </p>
        </div>

        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Loan Amount</p>
          <p className="text-lg font-bold">{formatCurrency(loanAmount)}</p>
        </div>

        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Total Interest</p>
          <p className="text-lg font-bold text-amber-600">
            {formatCurrency(Math.round(totalInterest))}
          </p>
        </div>

        <div className="rounded-lg bg-background p-3 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Total Payable</p>
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
  const [loanSettings, setLoanSettings] = useState({
    minDownPaymentPct: 30,
    defaultInterest: 10,
  });

  const [nidNumber, setNidNumber] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [jobType, setJobType] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/loans/settings");
        const data = await res.json();

        if (data?.settings) {
          setLoanSettings({
            minDownPaymentPct: Number(data.settings.minDownPaymentPct || 30),
            defaultInterest: Number(data.settings.defaultInterest || 10),
          });
        }
      } catch {
        // fallback settings already set
      } finally {
        setSettingsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!productId || settingsLoading) return;
    fetchProduct(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, settingsLoading]);

  async function fetchProduct(id) {
    setProductLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();

      if (!res.ok || !data?.product) {
        setError(data?.message || "Product not found.");
        return;
      }

      const selectedProduct = data.product;
      const minDP =
        (Number(selectedProduct.price || 0) * loanSettings.minDownPaymentPct) /
        100;

      setProduct(selectedProduct);
      setProductId(selectedProduct.id);
      setDownPayment(String(Math.ceil(minDP)));
    } catch {
      setError("Failed to fetch product.");
    } finally {
      setProductLoading(false);
    }
  }

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

  function validateStep() {
    setError("");

    if (step === 1) {
      if (!product) {
        setError("Please select a product.");
        return false;
      }

      if (Number(product.stockAmount || 0) <= 0) {
        setError("This product is currently out of stock.");
        return false;
      }
    }

    if (step === 2) {
      const dp = Number(downPayment);
      const price = Number(product?.price || 0);
      const minDP = (price * loanSettings.minDownPaymentPct) / 100;

      if (!dp || dp <= 0) {
        setError("Please enter a valid down payment amount.");
        return false;
      }

      if (dp < minDP) {
        setError(
          `Minimum down payment is ${loanSettings.minDownPaymentPct}% = ${formatCurrency(
            Math.ceil(minDP),
          )}`,
        );
        return false;
      }

      if (dp >= price) {
        setError("Down payment must be less than product price.");
        return false;
      }

      if (!tenure) {
        setError("Please select loan tenure.");
        return false;
      }
    }

    if (step === 3) {
      if (!nidNumber.trim()) {
        setError("NID number is required.");
        return false;
      }

      if (!monthlyIncome || Number(monthlyIncome) <= 0) {
        setError("Please enter your monthly income.");
        return false;
      }

      if (!jobType) {
        setError("Please select your job type.");
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
    setStep((current) => current - 1);
  }

  async function handleSubmit() {
    if (!validateStep()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/loans/apply", {
        method: "POST",
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
          customerNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || data?.error || "Something went wrong.");
        return;
      }

      setSubmittedLoan(data.loan);
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold">Application Submitted!</h2>
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
            <p className="text-sm text-muted-foreground">
              Buy now, pay in easy monthly installments
            </p>
          </div>

          <StepIndicator currentStep={step} />

          <Progress value={(step / STEPS.length) * 100} className="h-1.5" />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" /> Select Product
                  </CardTitle>
                  <CardDescription>
                    Choose the product you want to purchase on installment
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
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
                  )}

                  {product && (
                    <div className="space-y-3 rounded-xl border p-4">
                      <div className="flex items-start gap-4">
                        {product.mainImage && (
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border">
                            <Image
                              src={product.mainImage}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold leading-tight">
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
                      </Button>
                    </div>
                  )}

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
                    </span>
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && product && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                        ৳
                      </span>

                      <Input
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
                      <div className="space-y-1">
                        <Progress
                          value={Math.min(dpPct, 100)}
                          className="h-2"
                        />
                        <p className="text-right text-xs text-muted-foreground">
                          {dpPct.toFixed(1)}% of product price
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Loan Tenure{" "}
                      <span className="font-normal text-muted-foreground">
                        (months)
                      </span>
                    </Label>

                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {TENURE_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTenure(String(item))}
                          className={`rounded-lg border px-1 py-2 text-sm font-medium transition-all ${
                            tenure === String(item)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {item}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {dpNum > 0 && dpNum < Number(product.price) && tenure && (
                    <EMISummaryCard
                      productPrice={Number(product.price)}
                      downPayment={dpNum}
                      tenure={Number(tenure)}
                      interestRate={loanSettings.defaultInterest}
                    />
                  )}
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" /> Personal Information
                  </CardTitle>
                  <CardDescription>
                    Help us verify your identity and assess eligibility
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nid">NID Number *</Label>
                      <Input
                        id="nid"
                        placeholder="10 or 17 digit NID"
                        value={nidNumber}
                        onChange={(e) => setNidNumber(e.target.value)}
                        maxLength={17}
                      />
                    </div>

                    <div className="space-y-2">
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Type *</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your employment type" />
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
                  </div>

                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Your personal information is stored securely and used only
                      for loan eligibility assessment.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </>
            )}

            {step === 4 && product && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                </CardContent>
              </>
            )}
          </Card>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || loading}
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
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
