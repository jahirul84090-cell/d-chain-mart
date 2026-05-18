"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) {
        setError("No order ID provided.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/orders/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch order details.");
        }

        const fetchedData = await response.json();
        setOrder(fetchedData.order);
      } catch (err) {
        setError(err.message);
        toast.error(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center min-h-screen items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen text-center">
        <ArrowLeft className="h-10 w-10 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-gray-600">{error}</p>
        <Link href="/" passHref>
          <Button className="mt-6">Back to Home</Button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
        <p className="text-gray-600">
          The order you are looking for could not be found.
        </p>
        <Link href="/" passHref>
          <Button className="mt-6">Back to Home</Button>
        </Link>
      </div>
    );
  }

  // Calculate total amount on the client-side
  const totalAmount = order.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Thank You!
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Your purchase has been placed successfully.
          </p>
        </div>

        <Card className="shadow-lg border border-gray-200 rounded-2xl bg-white mb-8">
          <CardHeader className="p-6 sm:p-8 rounded-t-2xl border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">
              Order ID #{order.id}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Status: {order.status}</p>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Order Summary
              </h3>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Price: ৳
                      {item.product.price?.toLocaleString("en-BD") || "N/A"} ⬅️
                      **FIXED HERE**
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 mt-6">
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-lg font-extrabold">
                <span>Total</span>
                <span>৳ {totalAmount.toLocaleString("en-BD")}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 sm:p-8 flex justify-center border-t border-gray-200">
            <Link href="/" passHref>
              <Button className="rounded-sm bg-primary text-white font-semibold py-3 px-8">
                Continue Shopping
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
