"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Copy,
  Check,
  Info,
  Truck,
  Banknote,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";

export default function PaymentMethods({
  paymentMethods,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
  transactionNumbers,
  setTransactionNumbers,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (accountNumber, id) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    toast.success("Account number copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const manualPayments = paymentMethods.filter(
    (m) => !m.isCashOnDelivery && m.accountNumber && m.isActive,
  );
  const codPayments = paymentMethods.filter((m) => m.isCashOnDelivery);

  if (!paymentMethods.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
        <AlertCircle className="w-7 h-7 text-gray-300" />
        <p className="text-sm text-gray-400 font-medium">
          No payment methods available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Manual / Mobile Banking ── */}
      {manualPayments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Mobile Banking
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {manualPayments.map((method) => {
              const isSelected = selectedPaymentMethodId === method.id;
              const txnNumber = transactionNumbers[method.id] || "";

              return (
                <div key={method.id} className="flex flex-col">
                  {/* Selectable card */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethodId(method.id)}
                    className={[
                      "w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "border-gray-900 bg-gray-900 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={[
                            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                            isSelected ? "bg-white/15" : "bg-gray-100",
                          ].join(" ")}
                        >
                          <CreditCard
                            className={[
                              "w-4 h-4",
                              isSelected ? "text-white" : "text-gray-600",
                            ].join(" ")}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={[
                              "text-sm font-semibold truncate",
                              isSelected ? "text-white" : "text-gray-900",
                            ].join(" ")}
                          >
                            {method.name}
                          </p>
                          <p
                            className={[
                              "text-xs",
                              isSelected ? "text-gray-300" : "text-gray-400",
                            ].join(" ")}
                          >
                            Transfer & confirm
                          </p>
                        </div>
                      </div>
                      <div
                        className={[
                          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                          isSelected
                            ? "border-white bg-white"
                            : "border-gray-300 bg-transparent",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded details — only when selected */}
                  {isSelected && (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                      {/* Account number row */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Account Number
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                            <span className="font-mono text-sm font-semibold text-gray-800 tracking-wide">
                              {method.accountNumber}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 w-10 p-0 rounded-lg border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-200 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(method.accountNumber, method.id);
                            }}
                          >
                            {copiedId === method.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Transaction number input */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Transaction Number
                        </p>
                        <Input
                          placeholder="e.g. TXN123456789"
                          value={txnNumber}
                          onChange={(e) =>
                            setTransactionNumbers({
                              ...transactionNumbers,
                              [method.id]: e.target.value,
                            })
                          }
                          className="h-10 rounded-lg border-gray-200 text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:border-transparent transition-all"
                        />
                        {!txnNumber && (
                          <p className="text-[11px] text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Required to confirm your order
                          </p>
                        )}
                        {txnNumber && (
                          <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Transaction number added
                          </p>
                        )}
                      </div>

                      {/* Instructions link */}
                      {method.instructions && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-1.5 px-2 -ml-1 rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="w-3.5 h-3.5" />
                              View payment instructions
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-base font-bold text-gray-900">
                                {method.name} — Instructions
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                {method.instructions}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider between sections */}
      {manualPayments.length > 0 && codPayments.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            or
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}

      {/* ── Cash on Delivery ── */}
      {codPayments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Cash on Delivery
            </span>
          </div>

          <div className="space-y-3">
            {codPayments.map((method) => {
              const isSelected = selectedPaymentMethodId === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPaymentMethodId(method.id)}
                  className={[
                    "w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border-gray-900 bg-gray-900 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                          isSelected ? "bg-white/15" : "bg-gray-100",
                        ].join(" ")}
                      >
                        <Truck
                          className={[
                            "w-4 h-4",
                            isSelected ? "text-white" : "text-gray-600",
                          ].join(" ")}
                        />
                      </div>
                      <div>
                        <p
                          className={[
                            "text-sm font-semibold",
                            isSelected ? "text-white" : "text-gray-900",
                          ].join(" ")}
                        >
                          {method.name}
                        </p>
                        <p
                          className={[
                            "text-xs",
                            isSelected ? "text-gray-300" : "text-gray-400",
                          ].join(" ")}
                        >
                          Pay directly to the delivery person
                        </p>
                      </div>
                    </div>
                    <div
                      className={[
                        "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                        isSelected
                          ? "border-white bg-white"
                          : "border-gray-300 bg-transparent",
                      ].join(" ")}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-xs text-gray-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        No advance payment required
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
