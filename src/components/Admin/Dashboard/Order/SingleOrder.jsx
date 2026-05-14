// app/admin/orders/[orderId]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle,
  Clock,
  FileText,
  User2,
  Package,
  ThumbsUp,
} from "lucide-react";
import { toast } from "react-toastify"; // Keeping react-toastify as per your original code

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch order");
      }
      const { order } = await response.json();
      setOrder(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order: " + error.message);
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  const handleUpdate = async (updates, successMessage, errorMessage) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorMessage || "Failed to update order"
        );
      }
      const { order: updatedOrder } = await response.json();
      setOrder(updatedOrder);
      toast.success(successMessage || "Order updated successfully");
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(
        error.message ||
          errorMessage ||
          "Failed to update order: " + error.message
      );
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    handleUpdate({ status: newStatus }, "Order status updated.");
  };

  const handlePaymentToggle = () => {
    handleUpdate(
      { isPaid: !order.isPaid },
      order.isPaid ? "Order marked as unpaid." : "Order marked as paid."
    );
  };

  const handleConfirmOrder = async () => {
    setUpdating(true);
    try {
      const updatedOrder = await handleUpdate(
        { generateInvoice: true },
        "Order confirmed and invoice generated successfully!",
        "Failed to confirm order and generate invoice."
      );

      if (!updatedOrder) {
        return;
      }

      if (updatedOrder.isInvoiceGenerated && updatedOrder.invoice?.id) {
        const emailResponse = await fetch(
          `/api/admin/invoices/${updatedOrder.invoice.id}/pdf`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();

          console.error("Failed to send invoice email:", errorData);
          toast.error(errorData.error || "Failed to send invoice email.");
        } else {
          toast.success("Invoice email sent to the user!");
        }
      }
    } catch (error) {
      console.error("Confirmation process failed:", error);
      toast.error(
        error.message || "An error occurred during order confirmation."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-700">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 text-center text-gray-500">
        <p className="text-xl font-semibold mb-4">Order not found.</p>
        <Button onClick={() => router.push("/admin/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const subtotal = order.orderTotal - (order.deliveryFee || 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl  min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Order Details
        </h1>
        <Button
          onClick={() => router.push("/dashboard/order/manage")}
          variant="outline"
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <span className="h-4 w-4 mr-2">&larr;</span> Back to Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-blue-600" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Order ID</p>
                <p className="text-base font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded-md mt-1 inline-block">
                  {order.id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Subtotal</p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  ৳{subtotal.toLocaleString("en-BD")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Delivery Fee
                </p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  ৳{(order.deliveryFee || 0).toLocaleString("en-BD")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Grand Total</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  ৳{order.orderTotal.toLocaleString("en-BD")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Payment Status
                </p>
                <Button
                  variant={order.isPaid ? "success" : "outline"}
                  className={`mt-2 px-3 py-1 text-sm rounded-full font-medium transition-colors
                                  ${
                                    order.isPaid
                                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                                      : "bg-red-100 text-red-800 hover:bg-red-200"
                                  }`}
                  onClick={handlePaymentToggle}
                  disabled={updating}
                >
                  {order.isPaid ? "Paid" : "Mark Paid"}
                </Button>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Transaction Number
                </p>
                <p className="text-base font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded-md mt-1 inline-block">
                  {order.transactionNumber || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="text-base text-gray-700 mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Last Updated
                </p>
                <p className="text-base text-gray-700 mt-1">
                  {new Date(order.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <Package className="h-6 w-6 mr-3 text-blue-600" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="font-semibold text-lg text-gray-800">
                    {item.productSnapshot.name}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-600 mt-2">
                    <p>
                      <strong>Quantity:</strong> {item.quantity}
                    </p>
                    <p>
                      <strong>Price:</strong> ${item.pricePaid.toFixed(2)}
                    </p>
                    {item.productSnapshot.selectedSize && (
                      <p>
                        <strong>Size:</strong>{" "}
                        {item.productSnapshot.selectedSize}
                      </p>
                    )}
                    {item.productSnapshot.selectedColor && (
                      <p>
                        <strong>Color:</strong>{" "}
                        {item.productSnapshot.selectedColor}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 mr-3 text-blue-600" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-base font-medium text-gray-500 mb-2">
                Change Status
              </p>
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <User2 className="h-6 w-6 mr-3 text-blue-600" />
                User & Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Customer Name
                </p>
                <p className="text-base mt-1">
                  {order.user.name || order.user.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base mt-1">{order.user.email}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-base font-semibold text-gray-900 mb-2">
                  Shipping Address
                </p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city},{" "}
                  {order.shippingAddress.state || ""}{" "}
                  {order.shippingAddress.zipCode || ""}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phoneNumber && (
                  <p className="mt-2">
                    <span className="font-semibold">Phone:</span>{" "}
                    {order.shippingAddress.phoneNumber}
                  </p>
                )}
              </div>
              {order.paymentMethod && (
                <div className="border-t pt-4">
                  <p className="text-base font-semibold text-gray-900 mb-2">
                    Payment Method
                  </p>
                  <p>
                    <span className="font-semibold">Method:</span>{" "}
                    {order.paymentMethod.name}
                  </p>
                  <p>
                    <span className="font-semibold">Account:</span>{" "}
                    {order.paymentMethod.accountNumber}
                  </p>
                  {order.paymentMethod.instructions && (
                    <p>
                      <span className="font-semibold">Instructions:</span>{" "}
                      {order.paymentMethod.instructions}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 shadow-lg border-none">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {order.status === "PENDING" && !order.isInvoiceGenerated && (
              <Button
                onClick={handleConfirmOrder}
                disabled={updating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold text-lg rounded-xl shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                {updating ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  <ThumbsUp className="h-6 w-6 mr-2" />
                )}
                Confirm Order
              </Button>
            )}
            {order.isInvoiceGenerated && (
              <a
                href={`/api/admin/invoices/${order.invoice?.id}/pdf`}
                download={`invoice-${
                  order.invoice?.invoiceNumber || order.id
                }.pdf`}
                className="w-full"
              >
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold text-lg"
                  disabled={updating}
                >
                  <FileText className="h-6 w-6 mr-2" />
                  Download Invoice PDF
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
