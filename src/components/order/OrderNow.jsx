"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  MapPin,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Lock,
  Plus,
  Truck,
  Package,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import useCartStore from "@/lib/cartStore";
import NewAddressForm from "./NewAddressForm";
import PaymentMethods from "./PaymentMethods";

const STEPS = [
  { id: 1, label: "Cart", icon: ShoppingCart },
  { id: 2, label: "Address", icon: MapPin },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Confirm", icon: CheckCircle2 },
];

export default function OrderNowPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [transactionNumbers, setTransactionNumbers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeStep = 3;
  const { cartItems, cartId, clearCart } = useCartStore();
  const router = useRouter();

  const handleAddressSave = (newAddress) => {
    setAddresses([...addresses, newAddress]);
    setSelectedAddressId(newAddress.id);
    setIsModalOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [addressResponse, paymentResponse, deliveryFeeResponse] =
          await Promise.all([
            fetch("/api/profile/address"),
            fetch("/api/admin/payment-methods"),
            fetch("/api/admin/delivery-fees"),
          ]);
        if (!isMounted) return;
        if (!addressResponse.ok || addressResponse.status === 401) {
          router.push("/login");
          toast.error("Please log in to place an order");
          return;
        }
        if (!paymentResponse.ok)
          throw new Error("Failed to fetch payment methods");
        if (!deliveryFeeResponse.ok)
          throw new Error("Failed to fetch delivery fees");

        const { addresses } = await addressResponse.json();
        const { paymentMethods } = await paymentResponse.json();
        const { deliveryFees } = await deliveryFeeResponse.json();

        if (isMounted) {
          setAddresses(addresses || []);
          if (addresses?.length) {
            const defaultAddress = addresses.find((a) => a.isDefault);
            setSelectedAddressId(defaultAddress?.id || addresses[0].id);
          }
          setPaymentMethods(paymentMethods || []);
          setDeliveryFees(deliveryFees || []);
        }
      } catch (error) {
        if (isMounted) toast.error("Failed to load data: " + error.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const getDeliveryFee = () => {
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) return 0;
    const matched = deliveryFees.find(
      (f) =>
        f.country.toLowerCase() === addr.country.toLowerCase() &&
        (!f.city || f.city.toLowerCase() === addr.city.toLowerCase()),
    );
    return matched ? matched.amount : 150;
  };

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const currentDeliveryFee = useMemo(
    () => getDeliveryFee(),
    [selectedAddressId, addresses, deliveryFees],
  );
  const totalAmount = useMemo(
    () => (subtotal + currentDeliveryFee).toFixed(2),
    [subtotal, currentDeliveryFee],
  );

  const handleManualOrder = async (methodId, transactionNumber) => {
    if (!cartId || !selectedAddressId) {
      toast.error("Please ensure your cart and shipping address are selected.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          shippingAddressId: selectedAddressId,
          paymentMethodId: methodId,
          ...(transactionNumber && { transactionNumber }),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to place order");
      }
      const { order } = await response.json();
      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/orders/confirm/${order.id}`);
    } catch (error) {
      toast.error("Failed to place order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === selectedPaymentMethodId),
    [selectedPaymentMethodId, paymentMethods],
  );

  const transactionNumber = useMemo(
    () =>
      selectedMethod?.id ? (transactionNumbers[selectedMethod.id] ?? "") : "",
    [selectedMethod, transactionNumbers],
  );

  const fmtTotal = `৳${Number(totalAmount).toLocaleString("en-BD")}`;

  const renderPaymentButton = () => {
    if (!selectedMethod) {
      return (
        <Button
          className="w-full h-12 text-sm font-semibold rounded-xl"
          disabled
        >
          Select a Payment Method
        </Button>
      );
    }

    if (selectedMethod.isCashOnDelivery) {
      return (
        <Button
          className="w-full h-12 bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white text-sm font-semibold rounded-xl gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => handleManualOrder(selectedMethod.id, null)}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Placing Order…
            </>
          ) : (
            <>
              <Truck className="h-4 w-4" /> Place Order · {fmtTotal}
            </>
          )}
        </Button>
      );
    }

    if (selectedMethod.accountNumber) {
      return (
        <Button
          className="w-full h-12 bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white text-sm font-semibold rounded-xl gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() =>
            handleManualOrder(selectedMethod.id, transactionNumber)
          }
          disabled={submitting || !transactionNumber.length}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" /> Confirm Payment · {fmtTotal}
            </>
          )}
        </Button>
      );
    }

    return (
      <Button
        className="w-full h-12 bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white text-sm font-semibold rounded-xl gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
        onClick={() => handleLivePayment(selectedMethod.name)}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" /> Pay Now · {fmtTotal}
          </>
        )}
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-400 font-medium">
          Preparing your checkout…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Progress Stepper ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center py-3.5">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isDone = activeStep > step.id;
              const isActive = activeStep === step.id;
              return (
                <div key={step.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={[
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                        isDone
                          ? "bg-gray-900 text-white"
                          : isActive
                            ? "border-2 border-gray-900 text-gray-900 bg-white shadow-sm"
                            : "bg-gray-100 border border-gray-200 text-gray-400",
                      ].join(" ")}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={[
                        "text-xs font-semibold tracking-wide hidden sm:block",
                        isActive
                          ? "text-gray-900"
                          : isDone
                            ? "text-gray-500"
                            : "text-gray-400",
                      ].join(" ")}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 sm:mx-3">
                      <div
                        className={[
                          "h-px transition-colors duration-300",
                          isDone ? "bg-gray-900" : "bg-gray-200",
                        ].join(" ")}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: Steps ── */}
        <div className="lg:col-span-2 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Checkout
          </h1>

          {/* ── Shipping Address Card ── */}
          <Card className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-gray-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                    Step 1
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    Shipping Address
                  </p>
                </div>
                {selectedAddressId && (
                  <Badge className="ml-auto shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[11px] font-semibold">
                    ✓ Selected
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-6 py-5 space-y-3">
              {addresses.length ? (
                <Select
                  value={selectedAddressId}
                  onValueChange={setSelectedAddressId}
                >
                  <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:border-transparent transition-all">
                    <SelectValue placeholder="Select a shipping address" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                    {addresses.map((addr) => (
                      <SelectItem
                        key={addr.id}
                        value={addr.id}
                        className="rounded-lg py-2.5 text-sm cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {addr.street}, {addr.city}, {addr.country}
                            {addr.isDefault && (
                              <span className="ml-1.5 text-[11px] font-medium text-blue-600">
                                Default
                              </span>
                            )}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-col items-center gap-2 py-7 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
                  <MapPin className="w-7 h-7 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">
                    No saved addresses
                  </p>
                  <p className="text-xs text-gray-400">
                    Add an address below to continue
                  </p>
                </div>
              )}

              {selectedAddressId && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-emerald-700">
                    Estimated delivery in 2–5 business days
                  </p>
                </div>
              )}

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-900 hover:bg-gray-50 gap-2 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[430px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-gray-900">
                      New Shipping Address
                    </DialogTitle>
                  </DialogHeader>
                  <NewAddressForm
                    onSave={handleAddressSave}
                    onCancel={() => setIsModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* ── Payment Card ── */}
          <Card className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-gray-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                    Step 2
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    Payment Method
                  </p>
                </div>
                {selectedPaymentMethodId && (
                  <Badge className="ml-auto shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[11px] font-semibold">
                    ✓ Selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <PaymentMethods
                paymentMethods={paymentMethods}
                selectedPaymentMethodId={selectedPaymentMethodId}
                setSelectedPaymentMethodId={setSelectedPaymentMethodId}
                transactionNumbers={transactionNumbers}
                setTransactionNumbers={setTransactionNumbers}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border border-gray-200 shadow-md overflow-hidden sticky top-[69px]">
            {/* Dark header */}
            <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-white tracking-wide">
                  Order Summary
                </span>
              </div>
              <Badge className="bg-white/15 text-white text-[11px] font-semibold hover:bg-white/15 border-0">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </Badge>
            </div>

            {/* Cart items */}
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        width={52}
                        height={52}
                        className="rounded-xl object-cover border border-gray-100 bg-gray-50 w-[52px] h-[52px]"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.selectedSize && (
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                            {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                            {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                      ৳{(item.price * item.quantity).toLocaleString("en-BD")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Package className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-400 font-medium">
                    Your cart is empty
                  </p>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-800">
                  ৳{subtotal.toLocaleString("en-BD")}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Delivery Fee
                </span>
                <span className="font-semibold text-gray-800">
                  ৳{currentDeliveryFee.toLocaleString("en-BD")}
                </span>
              </div>
              <Separator className="!my-2.5 bg-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-lg font-extrabold text-gray-900">
                  ৳{Number(totalAmount).toLocaleString("en-BD")}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 py-4 bg-white border-t border-gray-100 space-y-2.5">
              {renderPaymentButton()}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secured with 256-bit SSL encryption
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
