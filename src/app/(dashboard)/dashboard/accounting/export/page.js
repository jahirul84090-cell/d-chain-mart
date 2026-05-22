/**
 * File: app/admin/accounting/export/page.jsx
 */

"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccountingExportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState("");

  function downloadFile(format) {
    setLoading(format);

    const url = `/api/admin/accounting/export?type=monthly&format=${format}&year=${year}`;
    window.location.href = url;

    setTimeout(() => {
      setLoading("");
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Export Accounting Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Download monthly accounting reports as Excel or PDF.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/admin/accounting">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            Currently export supports monthly report only. Product, loan,
            expense and stock exports can be added next.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Report Export</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Year</label>
              <Input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Button
                onClick={() => downloadFile("excel")}
                disabled={!!loading}
                className="h-16 justify-start"
              >
                {loading === "excel" ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-3 h-5 w-5" />
                )}
                Download Excel
              </Button>

              <Button
                onClick={() => downloadFile("pdf")}
                disabled={!!loading}
                variant="outline"
                className="h-16 justify-start"
              >
                {loading === "pdf" ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <FileText className="mr-3 h-5 w-5" />
                )}
                Download PDF
              </Button>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Download className="mt-0.5 h-4 w-4" />
                <p>
                  The file will download directly from the server after clicking
                  the export button.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}