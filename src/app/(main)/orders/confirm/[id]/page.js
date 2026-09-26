"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  CreditCard,
  Package,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatAddress,
  formatBDT,
  formatDate,
  orderNumber,
  ORDER_STATUS_LABEL,
} from "@/lib/format";

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/admin/orders/${id}`);
        if (!response.ok) throw new Error("We couldn't find this order.");
        const data = await response.json();
        if (active) setOrder(data.order);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) fetchOrder();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Loading your order…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <section className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <PackageX className="h-12 w-12 text-gray-400" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Order not found</h1>
        <p className="mt-2 text-gray-600">
          {error || "The order you are looking for could not be found."}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/orders"><Button variant="outline">My orders</Button></Link>
          <Link href="/"><Button>Back to home</Button></Link>
        </div>
      </section>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.pricePaid) * item.quantity,
    0
  );
  const isCod = order.paymentMethod?.name?.toLowerCase().includes("cash");

  return (
    <section className="bg-gray-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-gray-600">
            Order <span className="font-semibold text-gray-900">{orderNumber(order.id)}</span>{" "}
            has been placed. We&apos;ll contact you to confirm delivery.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm text-gray-500">Order number</p>
              <p className="font-semibold text-gray-900">{orderNumber(order.id)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Placed on</p>
              <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {ORDER_STATUS_LABEL[order.status] || order.status}
            </span>
          </div>

          <ul className="divide-y divide-gray-100 px-5 sm:px-6">
            {order.items.map((item) => {
              const snap = item.productSnapshot || {};
              return (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <Image
                      src={snap.image || item.product?.mainImage || "/placeholder.png"}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {snap.name || item.product?.name}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Qty {item.quantity}
                      {snap.selectedSize && ` · Size ${snap.selectedSize}`}
                      {snap.selectedColor && ` · ${snap.selectedColor}`}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatBDT(Number(item.pricePaid) * item.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="space-y-2 border-t border-gray-100 bg-gray-50 px-5 py-4 text-sm sm:px-6">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd className="font-medium">{formatBDT(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Delivery fee</dt>
              <dd className="font-medium">{formatBDT(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
              <dt className="font-semibold text-gray-900">Total</dt>
              <dd className="font-bold text-gray-900">{formatBDT(order.orderTotal)}</dd>
            </div>
          </dl>

          <div className="grid gap-4 border-t border-gray-100 px-5 py-5 sm:grid-cols-2 sm:px-6">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Delivery address</p>
                <p className="mt-1 text-gray-600">{formatAddress(order.shippingAddress)}</p>
                {order.shippingAddress?.phoneNumber && (
                  <p className="text-gray-600">{order.shippingAddress.phoneNumber}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Payment</p>
                <p className="mt-1 text-gray-600">{order.paymentMethod?.name || "—"}</p>
                <p className="text-gray-600">
                  {order.isPaid
                    ? "Paid"
                    : isCod
                    ? `Pay ${formatBDT(order.orderTotal)} on delivery`
                    : "Payment being verified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/orders">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <Package className="h-4 w-4" aria-hidden="true" /> View my orders
            </Button>
          </Link>
          <Link href="/allproducts">
            <Button className="w-full sm:w-auto">Continue shopping</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
