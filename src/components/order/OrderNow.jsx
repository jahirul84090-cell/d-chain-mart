"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import useCartStore from "@/lib/cartStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewAddressForm from "./NewAddressForm";
import PaymentMethods from "./PaymentMethods";

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
            const defaultAddress = addresses.find((addr) => addr.isDefault);
            setSelectedAddressId(defaultAddress?.id || addresses[0].id);
          }
          setPaymentMethods(paymentMethods || []);
          setDeliveryFees(deliveryFees || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching data:", error);
          toast.error("Failed to load data: " + error.message);
        }
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
    const selectedAddress = addresses.find(
      (addr) => addr.id === selectedAddressId
    );
    if (!selectedAddress) return 0;
    const matchedFee = deliveryFees.find(
      (fee) =>
        fee.country.toLowerCase() === selectedAddress.country.toLowerCase() &&
        (!fee.city ||
          fee.city.toLowerCase() === selectedAddress.city.toLowerCase())
    );
    return matchedFee ? matchedFee.amount : 150;
  };

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
  const currentDeliveryFee = useMemo(
    () => getDeliveryFee(),
    [selectedAddressId, addresses, deliveryFees]
  );
  const totalAmount = useMemo(
    () => (subtotal + currentDeliveryFee).toFixed(2),
    [subtotal, currentDeliveryFee]
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
      console.error("Error placing order:", error);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === selectedPaymentMethodId),
    [selectedPaymentMethodId, paymentMethods]
  );

  const transactionNumber = useMemo(() => {
    return selectedMethod?.id
      ? transactionNumbers[selectedMethod.id] ?? ""
      : "";
  }, [selectedMethod, transactionNumbers]);

  const renderPaymentButton = () => {
    if (!selectedMethod) {
      return (
        <Button className="w-full  text-white font-semibold" disabled>
          Select Payment Method
        </Button>
      );
    }

    if (selectedMethod.isCashOnDelivery) {
      return (
        <Button
          className="w-full bg-gray-900 hover:bg-black text-white font-semibold"
          onClick={() => handleManualOrder(selectedMethod.id, null)}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            `Place Order - $${totalAmount}`
          )}
        </Button>
      );
    } else if (selectedMethod.accountNumber) {
      return (
        <Button
          className="w-full bg-gray-900 hover:bg-black text-white font-semibold"
          onClick={() =>
            handleManualOrder(selectedMethod.id, transactionNumber)
          }
          disabled={submitting || !transactionNumber.length}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            `Confirm Payment - $${totalAmount}`
          )}
        </Button>
      );
    } else {
      return (
        <Button
          className="w-full   font-semibold"
          onClick={() => handleLivePayment(selectedMethod.name)}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay Now - $${totalAmount}`
          )}
        </Button>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-12">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Left side (Steps) */}
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center lg:text-left">
            Checkout
          </h1>

          {/* Shipping Section */}
          <Card className="rounded-2xl shadow-md border border-gray-100">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" /> Shipping
                Address
              </h2>
              {addresses.length ? (
                <Select
                  value={selectedAddressId}
                  onValueChange={setSelectedAddressId}
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border-gray-300">
                    <SelectValue placeholder="Select a shipping address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((addr) => (
                      <SelectItem key={addr.id} value={addr.id}>
                        {addr.street}, {addr.city}, {addr.country}{" "}
                        {addr.isDefault && "(Default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center p-4 text-sm text-gray-500 border border-dashed rounded-lg">
                  No addresses found. Add a new one to proceed.
                </div>
              )}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-lg text-gray-600 border border-gray-300 hover:bg-gray-50"
                  >
                    + Add New Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add a New Address</DialogTitle>
                  </DialogHeader>
                  <NewAddressForm
                    onSave={handleAddressSave}
                    onCancel={() => setIsModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <PaymentMethods
            paymentMethods={paymentMethods}
            selectedPaymentMethodId={selectedPaymentMethodId}
            setSelectedPaymentMethodId={setSelectedPaymentMethodId}
            transactionNumbers={transactionNumbers}
            setTransactionNumbers={setTransactionNumbers}
          />
        </div>

        {/* Right side (Summary sticky) */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl shadow-md border border-gray-100 sticky top-6">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold  flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary" /> Order
                Summary
              </h2>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {cartItems.length ? (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 border-b pb-3"
                    >
                      <Image
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium ">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} |{" "}
                          {item.selectedSize || "No Size"} |{" "}
                          {item.selectedColor || "No Color"}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        ৳ {(item.price * item.quantity).toLocaleString("en-BD")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-center">
                    Your cart is empty.
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 text-sm font-medium">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>৳ {subtotal.toLocaleString("en-BD")}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Fee</span>
                  <span>৳ {currentDeliveryFee.toLocaleString("en-BD")}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 text-primary">
                  <span>Total</span>
                  <span>৳{totalAmount}</span>
                </div>
              </div>

              {/* Pay Button */}
              {renderPaymentButton()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
