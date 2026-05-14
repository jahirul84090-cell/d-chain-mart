"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  Clock4,
  FileText,
  User2,
  Package,
  ThumbsUp,
  ArrowLeft,
  CreditCard,
  MapPin,
  ReceiptText,
  AlertCircle,
  BadgeCheck,
  Ban,
  TruckIcon,
  RefreshCw,
  Download,
  Phone,
  Mail,
  Banknote,
} from "lucide-react";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META = {
  PENDING: {
    label: "Pending",
    Icon: Clock4,
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  PROCESSING: {
    label: "Processing",
    Icon: RefreshCw,
    cls: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  SHIPPED: {
    label: "Shipped",
    Icon: TruckIcon,
    cls: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  DELIVERED: {
    label: "Delivered",
    Icon: BadgeCheck,
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    Icon: Ban,
    cls: "bg-red-50 text-red-700 ring-red-200",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Full-screen backdrop spinner */
function PageSpinner({ message }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center gap-4 border border-slate-100">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-indigo-200 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">{message}</p>
          <p className="text-xs text-slate-400 mt-1">
            Please do not close this page
          </p>
        </div>
      </div>
    </div>
  );
}

/** Status pill */
function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${m.cls}`}
    >
      <m.Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

/** Section card with accent left border */
function Card({ icon: Icon, title, accent = "indigo", children, topRight }) {
  const accents = {
    indigo: "border-indigo-500",
    emerald: "border-emerald-500",
    amber: "border-amber-400",
    rose: "border-rose-400",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className={`border-l-[3px] ${accents[accent]}`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Icon className="h-3.5 w-3.5 text-slate-500" />
            </span>
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {title}
            </h2>
          </div>
          {topRight}
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Label + value */
function Field({ label, value, mono = false, highlight = "" }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span
        className={`text-sm ${mono ? "font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg inline-block" : ""} ${highlight || "text-slate-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

/** Bottom-bar action button with built-in spinner */
function ActionBtn({
  onClick,
  disabled,
  loading,
  loadingText,
  icon: Icon,
  label,
  variant = "primary",
}) {
  const vs = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100",
    emerald:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${vs[variant]}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          <Icon className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const { id: orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinnerMsg, setSpinnerMsg] = useState("");

  // ── Granular loading flags (each action tracked separately) ──
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPay, setUpdatingPay] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const anyBusy = updatingStatus || updatingPay || confirming || downloading;

  // ── Fetch order ────────────────────────────────────────────────────────────
  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to fetch");
      const { order } = await res.json();
      setOrder(order);
    } catch (err) {
      toast.error("Failed to load order: " + err.message);
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  // ── Generic PATCH ──────────────────────────────────────────────────────────
  const patch = async (updates, successMsg) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    const { order: updated } = await res.json();
    setOrder(updated);
    toast.success(successMsg);
    return updated;
  };

  // ── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    setSpinnerMsg(`Changing status to ${STATUS_META[newStatus]?.label}…`);
    try {
      await patch(
        { status: newStatus },
        `Status updated to ${STATUS_META[newStatus]?.label}.`,
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingStatus(false);
      setSpinnerMsg("");
    }
  };

  // ── Payment toggle ─────────────────────────────────────────────────────────
  const handlePaymentToggle = async () => {
    const nextPaid = !order.isPaid;
    setUpdatingPay(true);
    setSpinnerMsg(nextPaid ? "Marking as paid…" : "Marking as unpaid…");
    try {
      await patch(
        { isPaid: nextPaid },
        nextPaid ? "Order marked as paid." : "Order marked as unpaid.",
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingPay(false);
      setSpinnerMsg("");
    }
  };

  // ── Generate invoice ───────────────────────────────────────────────────────
  const handleGenerateInvoice = async () => {
    if (!order.isPaid) {
      toast.warn("Mark order as paid before generating an invoice.");
      return;
    }
    setConfirming(true);
    setSpinnerMsg("Generating invoice…");
    try {
      const updated = await patch(
        {
          generateInvoice: true,
          // Auto-advance PENDING → PROCESSING when invoice is created
          ...(order.status === "PENDING" ? { status: "PROCESSING" } : {}),
        },
        "Invoice generated successfully!",
      );
      if (updated?.isInvoiceGenerated && updated?.invoice?.id) {
        setSpinnerMsg("Sending invoice email to customer…");
        const emailRes = await fetch(
          `/api/admin/invoices/${updated.invoice.id}/pdf`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (!emailRes.ok) {
          toast.error(
            (await emailRes.json()).error || "Failed to send invoice email.",
          );
        } else {
          toast.success("Invoice emailed to customer!");
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to generate invoice.");
    } finally {
      setConfirming(false);
      setSpinnerMsg("");
    }
  };

  // ── Download invoice PDF ───────────────────────────────────────────────────
  const handleDownloadInvoice = async () => {
    if (!order?.invoice?.id) return;
    setDownloading(true);
    setSpinnerMsg("Preparing invoice PDF…");
    try {
      const res = await fetch(`/api/admin/invoices/${order.invoice.id}/pdf`);
      if (!res.ok) throw new Error("Server returned an error");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `invoice-${order.invoice.invoiceNumber || order.id}.pdf`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded!");
    } catch (err) {
      toast.error("Download failed: " + err.message);
    } finally {
      setDownloading(false);
      setSpinnerMsg("");
    }
  };

  // ── Derived booleans ───────────────────────────────────────────────────────
  const hasInvoice = order?.isInvoiceGenerated && !!order?.invoice?.id;
  const canGenerate = !order?.isInvoiceGenerated && order?.isPaid;
  const invoiceBlocked = !order?.isInvoiceGenerated && !order?.isPaid;

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / error screens
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Loading order details…
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <AlertCircle className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500 font-medium">Order not found.</p>
        <button
          onClick={() => router.push("/admin/orders")}
          className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  const subtotal = order.orderTotal - (order.deliveryFee || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // Page
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Full-page spinner overlay for any async action */}
      {anyBusy && <PageSpinner message={spinnerMsg} />}

      <div className="min-h-screen bg-slate-50">
        {/* ── Sticky top bar ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
            {/* Left: breadcrumb + title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push("/dashboard/order/manage")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Orders
              </button>
              <span className="text-slate-200">/</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  Order Details
                </p>
                <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate">
                  {order.id}
                </p>
              </div>
            </div>

            {/* Right: status chips */}
            <div className="flex items-center gap-2 shrink-0">
              <StatusPill status={order.status} />
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                  order.isPaid
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-red-50 text-red-700 ring-red-200"
                }`}
              >
                <Banknote className="h-3 w-3" />
                {order.isPaid ? "Paid" : "Unpaid"}
              </span>
              {hasInvoice && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-200">
                  <ReceiptText className="h-3 w-3" />#
                  {order.invoice.invoiceNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
          {/* ── Invoice blocked warning ─────────────────────────────────── */}
          {invoiceBlocked && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-4">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Invoice cannot be generated yet
                </p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  You must mark this order as <strong>Paid</strong> before
                  generating an invoice. Invoices are legal documents and should
                  only be issued after payment is confirmed.
                </p>
              </div>
            </div>
          )}

          {/* ── Main content grid ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ══ LEFT: 2 cols ════════════════════════════════════════════ */}
            <div className="lg:col-span-2 space-y-5">
              {/* Order Summary */}
              <Card icon={CheckCircle2} title="Order Summary" accent="indigo">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
                  <Field
                    label="Subtotal"
                    value={`৳${subtotal.toLocaleString("en-BD")}`}
                  />
                  <Field
                    label="Delivery Fee"
                    value={`৳${(order.deliveryFee || 0).toLocaleString("en-BD")}`}
                  />
                  <Field
                    label="Grand Total"
                    value={`৳${order.orderTotal.toLocaleString("en-BD")}`}
                    highlight="text-indigo-600 font-bold text-base"
                  />
                  <Field
                    label="Transaction No."
                    value={order.transactionNumber || "N/A"}
                    mono
                  />
                  <Field
                    label="Created At"
                    value={new Date(order.createdAt).toLocaleString()}
                  />
                  <Field
                    label="Last Updated"
                    value={new Date(order.updatedAt).toLocaleString()}
                  />
                </div>

                {/* Payment toggle */}
                <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                      Payment Status
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                        order.isPaid
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-red-50 text-red-700 ring-red-200"
                      }`}
                    >
                      {order.isPaid ? (
                        <BadgeCheck className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {order.isPaid ? "Payment Received" : "Awaiting Payment"}
                    </span>
                  </div>

                  <button
                    onClick={handlePaymentToggle}
                    disabled={anyBusy}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      order.isPaid
                        ? "bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                        : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100"
                    }`}
                  >
                    {updatingPay ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Banknote className="h-3.5 w-3.5" />
                    )}
                    {updatingPay
                      ? order.isPaid
                        ? "Marking unpaid…"
                        : "Marking paid…"
                      : order.isPaid
                        ? "Mark as Unpaid"
                        : "Mark as Paid"}
                  </button>
                </div>
              </Card>

              {/* Order Items */}
              <Card
                icon={Package}
                title={`Order Items · ${order.items.length} item${order.items.length !== 1 ? "s" : ""}`}
                accent="emerald"
              >
                <div className="space-y-2.5">
                  {order.items.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 hover:bg-white hover:shadow-sm transition-all duration-150"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xs shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {item.productSnapshot.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            Qty:{" "}
                            <strong className="text-slate-700">
                              {item.quantity}
                            </strong>
                          </span>
                          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            Unit:{" "}
                            <strong className="text-slate-700">
                              ৳{item.pricePaid.toLocaleString("en-BD")}
                            </strong>
                          </span>
                          {item.productSnapshot.selectedSize && (
                            <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-md font-medium">
                              {item.productSnapshot.selectedSize}
                            </span>
                          )}
                          {item.productSnapshot.selectedColor && (
                            <span className="text-xs bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded-md font-medium">
                              {item.productSnapshot.selectedColor}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">
                          ৳
                          {(item.pricePaid * item.quantity).toLocaleString(
                            "en-BD",
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">
                          subtotal
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Total footer */}
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-indigo-50 border border-indigo-100 mt-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Grand Total
                    </span>
                    <span className="text-base font-bold text-indigo-700">
                      ৳{order.orderTotal.toLocaleString("en-BD")}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ══ RIGHT: 1 col ════════════════════════════════════════════ */}
            <div className="lg:col-span-1 space-y-5">
              {/* Status */}
              <Card icon={Clock4} title="Order Status" accent="amber">
                <div className="space-y-3">
                  <StatusPill status={order.status} />
                  <Select
                    value={order.status}
                    onValueChange={handleStatusChange}
                    disabled={anyBusy}
                  >
                    <SelectTrigger className="w-full rounded-xl border-slate-200 text-sm h-10 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_META).map(([val, m]) => (
                        <SelectItem key={val} value={val}>
                          <div className="flex items-center gap-2">
                            <m.Icon className="h-3.5 w-3.5" />
                            {m.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updatingStatus && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 font-medium">
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      {spinnerMsg}
                    </div>
                  )}
                </div>
              </Card>

              {/* Customer */}
              <Card icon={User2} title="Customer" accent="indigo">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                    {(order.user.name || order.user.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {order.user.name || "—"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      {order.user.email}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Shipping */}
              <Card icon={MapPin} title="Shipping Address" accent="emerald">
                <address className="not-italic space-y-1.5 text-sm text-slate-700">
                  <p className="font-semibold text-slate-800">
                    {order.shippingAddress.street}
                  </p>
                  <p className="text-slate-600">
                    {order.shippingAddress.city}
                    {order.shippingAddress.state
                      ? `, ${order.shippingAddress.state}`
                      : ""}
                    {order.shippingAddress.zipCode
                      ? ` ${order.shippingAddress.zipCode}`
                      : ""}
                  </p>
                  <p className="text-slate-600">
                    {order.shippingAddress.country}
                  </p>
                  {order.shippingAddress.phoneNumber && (
                    <p className="flex items-center gap-1.5 text-slate-500 pt-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      {order.shippingAddress.phoneNumber}
                    </p>
                  )}
                </address>
              </Card>

              {/* Payment Method */}
              {order.paymentMethod && (
                <Card icon={CreditCard} title="Payment Method" accent="rose">
                  <div className="space-y-3">
                    <Field label="Method" value={order.paymentMethod.name} />
                    {order.paymentMethod.accountNumber && (
                      <Field
                        label="Account"
                        value={order.paymentMethod.accountNumber}
                        mono
                      />
                    )}
                    {order.paymentMethod.instructions && (
                      <Field
                        label="Instructions"
                        value={order.paymentMethod.instructions}
                      />
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* ── Action Bar ──────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Actions
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Generate Invoice (paid, no invoice yet) */}
              {canGenerate && (
                <ActionBtn
                  onClick={handleGenerateInvoice}
                  disabled={anyBusy}
                  loading={confirming}
                  loadingText="Generating invoice…"
                  icon={ReceiptText}
                  label={
                    order.status === "PENDING"
                      ? "Confirm & Generate Invoice"
                      : "Generate Invoice"
                  }
                  variant="primary"
                />
              )}

              {/* Blocked — not paid */}
              {invoiceBlocked && (
                <div className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none">
                  <AlertCircle className="h-4 w-4" />
                  Mark as Paid to Generate Invoice
                </div>
              )}

              {/* Download Invoice */}
              {hasInvoice && (
                <ActionBtn
                  onClick={handleDownloadInvoice}
                  disabled={anyBusy}
                  loading={downloading}
                  loadingText="Downloading PDF…"
                  icon={Download}
                  label="Download Invoice PDF"
                  variant="emerald"
                />
              )}

              {/* Invoice number chip */}
              {hasInvoice && (
                <div className="sm:flex-none inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                  <FileText className="h-3.5 w-3.5 shrink-0" />#
                  {order.invoice.invoiceNumber}
                </div>
              )}
            </div>

            {/* Inline progress banners — show inside the action bar below buttons */}
            {downloading && (
              <div className="mt-3 flex items-center gap-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span className="font-semibold">Fetching PDF from server…</span>
                <span className="text-emerald-500 hidden sm:inline">
                  Download will start automatically.
                </span>
              </div>
            )}
            {confirming && (
              <div className="mt-3 flex items-center gap-2.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span className="font-semibold">{spinnerMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
