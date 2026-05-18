// app/admin/orders/edit/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

export default function EditOrder() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const router = useRouter();
  const { id } = useParams();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: "PENDING",
      isPaid: false,
    },
  });

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/admin/orders/${id}`);
        if (!response.ok) throw new Error("Failed to fetch order");
        const { order } = await response.json();
        if (!order) throw new Error("Order not found");
        console.log("Fetched order:", JSON.stringify(order, null, 2));
        setOrder(order);
        setValue("status", order.status);
        setValue("isPaid", order.isPaid);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to fetch order: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id, setValue]);

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: data.status,
          isPaid: data.isPaid,
        }),
      });
      if (response.ok) {
        toast.success("Order updated successfully");
        router.push("/admin/orders");
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !order) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl bg-gray-100 min-h-screen">
      <Card className="shadow-2xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-600 p-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">
            Edit Order #{order.id.slice(0, 8)}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 bg-white/5 rounded-lg p-4 backdrop-blur-sm">
              <div>
                <Label className="text-gray-900 font-medium">User Email</Label>
                <Input
                  value={order.user.email}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-900 font-medium">Order Total</Label>
                <Input
                  value={`$${order.orderTotal.toFixed(2)}`}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-900 font-medium">
                  Shipping Address
                </Label>
                <Input
                  value={`${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-900 font-medium">
                  Payment Method
                </Label>
                <Input
                  value={order.paymentMethod?.name || "N/A"}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-900 font-medium">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger className="mt-1 border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm">
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
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.status.message}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="isPaid" className="text-gray-900 font-medium">
                  Paid
                </Label>
                <Switch
                  id="isPaid"
                  checked={watch("isPaid")}
                  onCheckedChange={(checked) => setValue("isPaid", checked)}
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
              <div>
                <Label className="text-gray-900 font-medium">Order Items</Label>
                <div className="mt-1 space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="border p-2 rounded-lg bg-gray-50"
                    >
                      <p>
                        <strong>Product:</strong> {item.productSnapshot.name}
                      </p>
                      <p>
                        <strong>Quantity:</strong> {item.quantity}
                      </p>
                      <p>
                        <strong>Price Paid:</strong> $
                        {item.pricePaid.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-gray-900 font-medium">Created At</Label>
                <Input
                  value={new Date(order.createdAt).toLocaleString()}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/orders")}
                className="border-gray-300 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-medium shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Update Order"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
