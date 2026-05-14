"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCw, DollarSign } from "lucide-react";

export default function SSLFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { transactionId, status, reason, amount, currency, detailedParams } =
    useMemo(() => {
      const all = {};
      for (const key of searchParams.keys()) {
        all[key] = searchParams.get(key);
      }

      const tranId = all.tran_id || "N/A";
      const failStatus = all.status || "FAILED";
      const failReason =
        all.error ||
        all.failed_reason ||
        all.reason ||
        "No specific error message provided.";
      const payAmount = all.amount || "N/A";
      const payCurrency = all.currency || "BDT"; // Assuming BDT as a common default for SSLCommerz

      // Filter out keys already displayed in the main card content
      const excludeKeys = new Set([
        "tran_id",
        "status",
        "error",
        "failed_reason",
        "reason",
        "amount",
        "currency",
      ]);
      const details = Object.fromEntries(
        Object.entries(all).filter(([key]) => !excludeKeys.has(key))
      );

      return {
        transactionId: tranId,
        status: failStatus.toUpperCase(),
        reason: failReason,
        amount: payAmount,
        currency: payCurrency,
        detailedParams: details,
      };
    }, [searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-6">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-red-700 tracking-tight">
            Transaction Unsuccessful
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            We regret to inform you that your payment could not be processed
            successfully. Please review the details below and try again.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Summary Section */}
          <div className="border rounded-lg p-4 bg-red-50/50">
            <h3 className="flex items-center text-lg font-semibold text-red-700 border-b pb-2 mb-3">
              <DollarSign className="mr-2 h-5 w-5" />
              Transaction Summary
            </h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <span className="font-medium text-gray-700">Payment Amount:</span>
              <span className="font-bold text-red-600">
                {currency} {amount}
              </span>

              <span className="font-medium text-gray-700">Transaction ID:</span>
              <span className="text-gray-900 break-all">{transactionId}</span>

              <span className="font-medium text-gray-700">Status:</span>
              <span className="font-bold text-red-600 break-all">{status}</span>
            </div>
          </div>

          {/* Failure Reason */}
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <span className="font-medium text-gray-700 block mb-1">
              Reason for Failure:
            </span>
            <span className="text-sm text-gray-800 italic break-words">
              {reason}
            </span>
          </div>

          {/* Other Details Section */}
          {Object.keys(detailedParams).length > 0 && (
            <details className="mt-4 text-sm text-left border-t pt-4">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-red-600">
                Additional Gateway Details
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs bg-gray-50 p-3 rounded-md">
                {Object.entries(detailedParams).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="font-semibold text-gray-600 capitalize pr-1">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button
              asChild
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              <Link href="/checkout" className="flex items-center">
                <RotateCw className="mr-2 h-4 w-4" />
                Retry Payment
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
