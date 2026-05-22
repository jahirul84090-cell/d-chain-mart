/**
 * File: app/admin/accounting/settings/page.jsx
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const DEFAULT_FORM = {
  minDownPaymentPct: 0,
  defaultInterest: 10,
  defaultTenure: 12,
  firstEmiDelayDays: 30,
  gracePeriodDays: 3,
  lateFee: 100,
};

export default function AccountingSettingsPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/admin/accounting/settings", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load settings.");
        return;
      }

      setForm({
        minDownPaymentPct: data.settings?.minDownPaymentPct ?? 0,
        defaultInterest: data.settings?.defaultInterest ?? 10,
        defaultTenure: data.settings?.defaultTenure ?? 12,
        firstEmiDelayDays: data.settings?.firstEmiDelayDays ?? 30,
        gracePeriodDays: data.settings?.gracePeriodDays ?? 3,
        lateFee: data.settings?.lateFee ?? 100,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        minDownPaymentPct: Number(form.minDownPaymentPct),
        defaultInterest: Number(form.defaultInterest),
        defaultTenure: Number(form.defaultTenure),
        firstEmiDelayDays: Number(form.firstEmiDelayDays),
        gracePeriodDays: Number(form.gracePeriodDays),
        lateFee: Number(form.lateFee),
      };

      const res = await fetch("/api/admin/accounting/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save settings.");
        return;
      }

      setSuccess(data?.message || "Settings updated successfully.");

      setForm({
        minDownPaymentPct: data.settings?.minDownPaymentPct ?? 0,
        defaultInterest: data.settings?.defaultInterest ?? 10,
        defaultTenure: data.settings?.defaultTenure ?? 12,
        firstEmiDelayDays: data.settings?.firstEmiDelayDays ?? 30,
        gracePeriodDays: data.settings?.gracePeriodDays ?? 3,
        lateFee: data.settings?.lateFee ?? 100,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Settings className="h-6 w-6 text-primary" />
              Accounting Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage loan, EMI, down payment, grace period and late fee rules.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/accounting">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            <Button variant="outline" onClick={loadSettings} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Reload
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Active Loan Settings
              </span>

              <Badge variant="outline">Admin Only</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading settings...
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Minimum Down Payment %
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="95"
                      value={form.minDownPaymentPct}
                      onChange={(e) =>
                        updateField("minDownPaymentPct", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Use 0 if customer can pay any positive amount.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Default Interest %
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.defaultInterest}
                      onChange={(e) =>
                        updateField("defaultInterest", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Used when no custom plan interest is selected.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Default Tenure Months
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={form.defaultTenure}
                      onChange={(e) =>
                        updateField("defaultTenure", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Default repayment period in months.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      First EMI Delay Days
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={form.firstEmiDelayDays}
                      onChange={(e) =>
                        updateField("firstEmiDelayDays", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: 30 means first EMI starts after 30 days.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Grace Period Days
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={form.gracePeriodDays}
                      onChange={(e) =>
                        updateField("gracePeriodDays", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Days allowed after due date before strict overdue handling.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Late Fee</label>
                    <Input
                      type="number"
                      min="0"
                      value={form.lateFee}
                      onChange={(e) => updateField("lateFee", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default late fee amount for overdue installments.
                    </p>
                  </div>
                </div>

                <Separator />

                <Card className="border-dashed bg-muted/30">
                  <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Down Payment Rule
                      </p>
                      <p className="mt-1 font-bold">
                        {form.minDownPaymentPct}% minimum
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Default EMI Plan
                      </p>
                      <p className="mt-1 font-bold">
                        {form.defaultTenure} months / {form.defaultInterest}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Late Fee Rule
                      </p>
                      <p className="mt-1 font-bold">
                        ৳{Number(form.lateFee || 0).toLocaleString("en-BD")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setForm(DEFAULT_FORM)}
                    disabled={saving}
                  >
                    Reset Form
                  </Button>

                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-5 w-5 text-primary" />
              How These Settings Work
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              These settings are used when a customer applies for a loan and
              when admin approves the loan schedule.
            </p>
            <p>
              Existing loans will not automatically change. New settings apply
              to new loan applications or new approval calculations.
            </p>
            <p>
              For production safety, every update creates a new active setting
              and disables the old active setting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}