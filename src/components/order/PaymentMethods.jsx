"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, Copy, Info, Wallet } from "lucide-react";

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
    (m) => !m.isCashOnDelivery && m.accountNumber && m.isActive
  );
  const codPayments = paymentMethods.filter((m) => m.isCashOnDelivery);

  return (
    <Card className="rounded-2xl shadow-lg border border-gray-100 bg-white">
      <CardContent className="p-8 space-y-10">
        <div className="flex items-center gap-2 border-b pb-4">
          <Wallet className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-900">
            Choose Payment Method
          </h2>
        </div>

        {/* MANUAL PAYMENT METHODS */}
        {manualPayments.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              🏦 Manual Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {manualPayments.map((method) => {
                const isSelected = selectedPaymentMethodId === method.id;
                const transactionNumber = transactionNumbers[method.id] || "";
                return (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPaymentMethodId(method.id)}
                    className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition hover:shadow-md ${
                      isSelected
                        ? "border-primary"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {method.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Transfer & confirm
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    {isSelected && (
                      <div className="mt-5 space-y-4">
                        {/* Account Number */}
                        <div className="flex items-center justify-between bg-white border rounded-xl px-4 py-2 shadow-sm">
                          <span className="font-mono text-gray-800 text-sm">
                            {method.accountNumber}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(method.accountNumber, method.id);
                            }}
                          >
                            {copiedId === method.id ? "Copied!" : <Copy />}
                          </Button>
                        </div>

                        {/* Instructions */}
                        {method.instructions && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Info className="h-4 w-4 mr-1" />
                                Instructions
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>
                                  {method.name} Instructions
                                </DialogTitle>
                              </DialogHeader>
                              <div className="text-sm  whitespace-pre-line leading-relaxed">
                                {method.instructions}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Transaction Number Input */}
                        <Input
                          placeholder="Enter transaction number"
                          value={transactionNumber}
                          onChange={(e) =>
                            setTransactionNumbers({
                              ...transactionNumbers,
                              [method.id]: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CASH ON DELIVERY */}
        {codPayments.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              🚚 Cash on Delivery
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {codPayments.map((method) => {
                const isSelected = selectedPaymentMethodId === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPaymentMethodId(method.id)}
                    className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition hover:shadow-md ${
                      isSelected
                        ? "border-primary"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{method.name}</p>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pay directly to delivery person
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
