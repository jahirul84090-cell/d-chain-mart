"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Eye, FilePlus2, MoreHorizontal, Search, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminPageHeader from "@/components/Admin/Dashboard/AdminPageHeader";
import { ConfirmDialog, ListPagination, ListState, StatusTabs, useListParams } from "@/components/Admin/Dashboard/AdminListParts";
import { OrderStatusBadge, downloadInvoice } from "@/components/others/Allorders";
import { formatBDT, formatDate, orderNumber } from "@/lib/format";
import { useDebounce } from "@/lib/useDebounce";

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const SORTS = {
  newest: { sortBy: "createdAt", sortOrder: "desc", label: "Newest first" },
  oldest: { sortBy: "createdAt", sortOrder: "asc", label: "Oldest first" },
  highest: { sortBy: "orderTotal", sortOrder: "desc", label: "Highest total" },
  lowest: { sortBy: "orderTotal", sortOrder: "asc", label: "Lowest total" },
};

const DEFAULTS = { status: "all", paid: "all", method: "all", q: "", from: "", to: "", sort: "newest", page: 1 };

function PaymentCell({ order }) {
  const cod = order.paymentMethod?.isCashOnDelivery;
  return (
    <div className="text-sm">
      <p className="text-gray-900">{order.paymentMethod?.name || "—"}</p>
      <p className={order.isPaid ? "text-xs font-medium text-green-700" : "text-xs text-amber-700"}>
        {order.isPaid ? "Paid" : order.status === "CANCELLED" ? "Not charged" : cod ? "Collect on delivery" : "Awaiting payment"}
      </p>
      {!cod && order.transactionNumber && (
        <p className="max-w-[10rem] truncate font-mono text-[11px] text-gray-500" title={order.transactionNumber}>
          {order.transactionNumber}
        </p>
      )}
    </div>
  );
}

function itemCount(order) {
  const n = order.items.reduce((sum, i) => sum + i.quantity, 0);
  return `${n} item${n === 1 ? "" : "s"}`;
}

function RowActions({ order, onDownload, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`More actions for order ${orderNumber(order.id)}`}>
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/order/${order.id}`}>
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" /> View & update
          </Link>
        </DropdownMenuItem>
        {order.invoice?.id && (
          <DropdownMenuItem onClick={() => onDownload(order)}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download invoice
          </DropdownMenuItem>
        )}
        {order.status === "CANCELLED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(order)} className="text-red-600 focus:text-red-700">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete order
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function OrderManagement() {
  const [params, setParams] = useListParams(DEFAULTS);
  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebounce(search.trim(), 400);

  const [data, setData] = useState({ orders: [], total: 0, totalPages: 1, statusCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [methods, setMethods] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Push the debounced search box into the URL.
  useEffect(() => {
    if (debouncedSearch !== params.q) setParams({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetch("/api/admin/payment-methods")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMethods(Array.isArray(d) ? d : d.paymentMethods || []))
      .catch(() => setMethods([]));
  }, []);

  useEffect(() => {
    let active = true;
    const sort = SORTS[params.sort] || SORTS.newest;
    const q = new URLSearchParams({ page: params.page, limit: PAGE_SIZE, sortBy: sort.sortBy, sortOrder: sort.sortOrder });
    if (params.status !== "all") q.set("status", params.status);
    if (params.paid !== "all") q.set("isPaid", params.paid === "paid" ? "true" : "false");
    if (params.method !== "all") q.set("paymentMethodId", params.method);
    if (params.q) q.set("search", params.q);
    if (params.from) q.set("fromDate", params.from);
    if (params.to) q.set("toDate", params.to);

    setLoading(true);
    fetch(`/api/admin/orders?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load orders."))))
      .then((d) => {
        if (!active) return;
        setData({ orders: d.orders, total: d.total, totalPages: d.totalPages || 1, statusCounts: d.statusCounts || {} });
        setError(null);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.page, params.status, params.paid, params.method, params.q, params.from, params.to, params.sort, reloadKey]);

  const onDownload = useCallback(async (order) => {
    try {
      await downloadInvoice(order.invoice.id, orderNumber(order.id));
    } catch (e) {
      toast.error(e.message);
    }
  }, []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDelete.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not delete the order.");
      toast.success(`Order ${orderNumber(toDelete.id)} deleted.`);
      setToDelete(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const counts = data.statusCounts;
  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.value === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[t.value] || 0,
    alert: t.value === "PENDING",
  }));
  const filtersActive = params.q || params.paid !== "all" || params.method !== "all" || params.from || params.to;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <AdminPageHeader
        title="Orders"
        description="Confirm, ship and track customer orders."
        actions={
          <Button asChild className="gap-2">
            <Link href="/dashboard/invoice">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Create manual order
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="space-y-4 border-b border-gray-100 p-4">
          <StatusTabs label="Order status" tabs={tabs} value={params.status} onChange={(status) => setParams({ status })} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order no., name, email, phone or payment ref."
                aria-label="Search orders"
                className="pl-9"
              />
            </div>
            <Select value={params.paid} onValueChange={(paid) => setParams({ paid })}>
              <SelectTrigger className="w-full" aria-label="Payment status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any payment status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={params.method} onValueChange={(method) => setParams({ method })}>
              <SelectTrigger className="w-full" aria-label="Payment method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any payment method</SelectItem>
                {methods.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={params.sort} onValueChange={(sort) => setParams({ sort })}>
              <SelectTrigger className="w-full" aria-label="Sort orders">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORTS).map(([key, s]) => (
                  <SelectItem key={key} value={key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label htmlFor="order-from" className="w-9 shrink-0 text-xs text-gray-500">
                From
              </Label>
              <Input id="order-from" type="date" value={params.from} max={params.to || undefined} onChange={(e) => setParams({ from: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="order-to" className="w-9 shrink-0 text-xs text-gray-500">
                To
              </Label>
              <Input id="order-to" type="date" value={params.to} min={params.from || undefined} onChange={(e) => setParams({ to: e.target.value })} />
            </div>
          </div>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-600"
              onClick={() => {
                setSearch("");
                setParams({ q: "", paid: "all", method: "all", from: "", to: "" });
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" /> Clear filters
            </Button>
          )}
        </div>

        <ListState
          loading={loading && !data.orders.length}
          error={error}
          onRetry={() => setReloadKey((k) => k + 1)}
          empty={!loading && !error && data.orders.length === 0}
          emptyTitle={filtersActive || params.status !== "all" ? "No orders match these filters" : "No orders yet"}
          emptyHint={filtersActive ? "Try a different search or clear the filters." : "New orders will appear here."}
        />

        {!error && data.orders.length > 0 && (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Order</th>
                  <th scope="col" className="px-4 py-3">Customer</th>
                  <th scope="col" className="hidden px-4 py-3 lg:table-cell">Date</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="hidden px-4 py-3 xl:table-cell">Payment</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/order/${order.id}`} className="font-semibold text-primary hover:underline">
                        {orderNumber(order.id)}
                      </Link>
                      <p className="text-xs text-gray-500">{itemCount(order)}</p>
                    </td>
                    <td className="max-w-[14rem] px-4 py-3">
                      <p className="truncate font-medium text-gray-900">{order.user?.name || "—"}</p>
                      <p className="truncate text-xs text-gray-500">{order.shippingAddress?.phoneNumber || order.user?.email}</p>
                      <p className="truncate text-xs text-gray-400">{order.shippingAddress?.city}</p>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-gray-600 lg:table-cell">
                      {formatDate(order.createdAt, { withTime: true })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <p className="font-semibold text-gray-900">{formatBDT(order.orderTotal)}</p>
                      {order.deliveryFee > 0 && <p className="text-xs text-gray-500">incl. {formatBDT(order.deliveryFee)} delivery</p>}
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                      <PaymentCell order={order} />
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                      {!order.isPaid && order.status !== "CANCELLED" && (
                        <p className="mt-1 text-xs text-amber-700 xl:hidden">Unpaid</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActions order={order} onDownload={onDownload} onDelete={setToDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phone cards */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {data.orders.map((order) => (
                <li key={order.id} className="flex gap-3 p-4">
                  <Link href={`/dashboard/order/${order.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-primary">{orderNumber(order.id)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-gray-900">
                      {order.user?.name || order.user?.email}
                      {order.shippingAddress?.city && <span className="font-normal text-gray-500"> · {order.shippingAddress.city}</span>}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {formatDate(order.createdAt)} · {itemCount(order)}
                      </span>
                      <span className="font-semibold text-gray-900">{formatBDT(order.orderTotal)}</span>
                    </div>
                    <p className={`mt-0.5 text-xs ${order.isPaid ? "text-green-700" : "text-amber-700"}`}>
                      {order.paymentMethod?.name} · {order.isPaid ? "Paid" : order.status === "CANCELLED" ? "Not charged" : "Unpaid"}
                    </p>
                  </Link>
                  <RowActions order={order} onDownload={onDownload} onDelete={setToDelete} />
                </li>
              ))}
            </ul>

            <ListPagination
              page={params.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={PAGE_SIZE}
              noun="orders"
              onPage={(page) => setParams({ page })}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete order ${toDelete ? orderNumber(toDelete.id) : ""}?`}
        description="This permanently removes the cancelled order and its invoice. This can't be undone."
        confirmLabel="Delete order"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
