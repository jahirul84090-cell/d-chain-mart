"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Loader2, PackageOpen } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { formatBDT, formatDate, orderNumber, ORDER_STATUS_LABEL } from "@/lib/format";

export const STATUS_STYLE = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  PROCESSING: "bg-sky-50 text-sky-700 ring-sky-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 ring-green-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

export function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[status] || "bg-gray-50 text-gray-700 ring-gray-200"}`}>
      {ORDER_STATUS_LABEL[status] || status}
    </span>
  );
}

export async function downloadInvoice(invoiceId, ref) {
  const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
  if (!response.ok) throw new Error("Could not download the invoice.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${ref}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function OrderCard({ order }) {
  const [downloading, setDownloading] = useState(false);
  const ref = orderNumber(order.id);
  const isCod = order.paymentMethod?.isCashOnDelivery;

  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoice(order.invoice.id, ref);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-gray-900">{ref}</span>
          <span className="text-gray-500">{formatDate(order.createdAt)}</span>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <ul className="divide-y divide-gray-100 px-4 sm:px-5">
        {order.items.map((item, i) => {
          const snap = item.productSnapshot || {};
          return (
            <li key={i} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <Image src={snap.image || "/placeholder.png"} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                {snap.slug ? (
                  <Link href={`/${snap.slug}`} className="line-clamp-1 text-sm font-medium text-gray-900 hover:text-primary">
                    {snap.name}
                  </Link>
                ) : (
                  <p className="line-clamp-1 text-sm font-medium text-gray-900">{snap.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  Qty {item.quantity}
                  {snap.selectedSize && ` · Size ${snap.selectedSize}`}
                  {snap.selectedColor && ` · ${snap.selectedColor}`}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-900">{formatBDT(item.pricePaid * item.quantity)}</p>
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
        <div className="text-sm">
          <p className="font-semibold text-gray-900">Total {formatBDT(order.orderTotal)}</p>
          <p className="text-xs text-gray-500">
            {order.paymentMethod?.name || "—"} ·{" "}
            {order.isPaid
              ? "Paid"
              : order.status === "CANCELLED"
              ? "Not charged"
              : isCod
              ? "Pay on delivery"
              : "Payment being verified"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.invoice?.id && (
            <Button variant="outline" size="sm" onClick={onDownload} disabled={downloading} className="gap-1.5">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              Invoice
            </Button>
          )}
          <Link href={`/orders/confirm/${order.id}`}>
            <Button size="sm">View details</Button>
          </Link>
        </div>
      </footer>
    </article>
  );
}

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, totalOrders: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/orders?page=${page}&pageSize=10`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load your orders.");
        return r.json();
      })
      .then((result) => {
        if (!active) return;
        setOrders(result.data);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My orders</h1>
      <p className="mt-1 text-sm text-gray-600">
        {pagination.totalOrders ? `${pagination.totalOrders} order${pagination.totalOrders === 1 ? "" : "s"}` : "Your order history"}
      </p>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading your orders…</span>
          </div>
        ) : error ? (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <PackageOpen className="h-10 w-10 text-gray-300" aria-hidden="true" />
            <p className="mt-3 font-medium text-gray-900">You haven&apos;t placed any orders yet</p>
            <Link href="/allproducts" className="mt-4">
              <Button>Start shopping</Button>
            </Link>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      {pagination.totalPages > 1 && (
        <nav aria-label="Order pages" className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </nav>
      )}
    </section>
  );
}
