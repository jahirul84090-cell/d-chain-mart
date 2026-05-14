"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import {
  Loader2,
  ArrowUpDown,
  Download,
  Trash2,
  Eye,
  AlertTriangle,
  ShoppingBag,
  PackageX,
  X,
  TruckIcon,
  BadgeCheck,
  Ban,
  RefreshCw,
  Clock4,
} from "lucide-react";
import { useDebounce } from "@/lib/useDebounce";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  PENDING: {
    label: "Pending",
    icon: Clock4,
    color: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-400",
  },
  PROCESSING: {
    label: "Processing",
    icon: RefreshCw,
    color: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-400",
  },
  SHIPPED: {
    label: "Shipped",
    icon: TruckIcon,
    color: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-400",
  },
  DELIVERED: {
    label: "Delivered",
    icon: BadgeCheck,
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Ban,
    color: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-400",
  },
};

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${m.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ─── Global download toast ────────────────────────────────────────────────────
function DownloadToast({ orderId }) {
  if (!orderId) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-2xl px-5 py-3.5 animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Downloading Invoice
        </p>
        <p className="text-xs text-slate-400">Preparing your PDF…</p>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ orderId, isDeleting, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !isDeleting && onCancel()}
      />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500" />
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Delete this order?
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                This cannot be undone.
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 leading-relaxed">
            Order{" "}
            <code className="font-mono font-semibold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded text-xs">
              {orderId?.slice(0, 8)}…
            </code>{" "}
            and all associated data will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-5 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 transition-all shadow-md shadow-red-100"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? "Deleting…" : "Delete Permanently"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Icon action button ───────────────────────────────────────────────────────
function IconBtn({
  onClick,
  disabled,
  tooltip,
  children,
  variant = "default",
}) {
  const variantCls = {
    default: "hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50",
    blue: "hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50",
    red: "hover:border-red-400 hover:text-red-600 hover:bg-red-50",
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${variantCls[variant]}`}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPaidFilter, setIsPaidFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const router = useRouter();

  const debouncedSearch = useDebounce(search, 600);

  async function handleInvoiceDownload(e, invoiceId, orderId) {
    e.preventDefault();
    setDownloadingInvoice(orderId);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error("Failed to download invoice");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `invoice-${orderId}.pdf`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (err) {
      toast.error("Download failed: " + err.message);
    } finally {
      setDownloadingInvoice(null);
    }
  }

  async function confirmDelete() {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderToDelete }),
      });
      if (res.ok) {
        toast.success("Order deleted");
        setOrders((prev) => prev.filter((o) => o.id !== orderToDelete));
      } else {
        throw new Error((await res.json()).error || "Delete failed");
      }
    } catch (err) {
      toast.error("Delete failed: " + err.message);
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  }

  const columns = [
    {
      accessorKey: "sn",
      header: () => <ColHead>#</ColHead>,
      cell: ({ row }) => (
        <span className="text-xs text-slate-400">{row.index + 1}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "transactionNumber",
      header: () => <ColHead>Transaction</ColHead>,
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md cursor-default">
                {row.original.transactionNumber ? (
                  row.original.transactionNumber.slice(0, 10) + "…"
                ) : (
                  <span className="text-slate-400 italic font-normal">N/A</span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs">
              {row.original.transactionNumber || "N/A"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "user.email",
      header: () => <ColHead>Customer</ColHead>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0">
            {row.original.user.email[0].toUpperCase()}
          </span>
          <span className="text-sm text-slate-700 font-medium truncate max-w-[160px]">
            {row.original.user.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "orderTotal",
      header: ({ column }) => <SortHead column={column} label="Total" />,
      cell: ({ row }) => (
        <span className="text-sm font-bold text-slate-800">
          ৳{row.getValue("orderTotal")?.toLocaleString("en-BD") ?? "0"}
        </span>
      ),
    },
    {
      accessorKey: "deliveryFee",
      header: ({ column }) => <SortHead column={column} label="Delivery" />,
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">
          ৳{row.getValue("deliveryFee")?.toLocaleString("en-BD") ?? "0"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => <ColHead>Status</ColHead>,
      cell: ({ row }) => <StatusPill status={row.getValue("status")} />,
    },
    {
      accessorKey: "isPaid",
      header: () => <ColHead>Paid</ColHead>,
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
            row.getValue("isPaid")
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {row.getValue("isPaid") ? "Paid" : "Unpaid"}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: () => <ColHead>Method</ColHead>,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {row.original.paymentMethod?.name || (
            <span className="text-slate-400 italic">N/A</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortHead column={column} label="Date" />,
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 tabular-nums">
          {new Date(row.getValue("createdAt")).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <ColHead>Actions</ColHead>,
      cell: ({ row }) => {
        const isDownloading = downloadingInvoice === row.original.id;
        return (
          <div className="flex items-center gap-1.5">
            <IconBtn
              onClick={() => router.push(`/dashboard/order/${row.original.id}`)}
              tooltip="View Details"
              variant="default"
            >
              <Eye className="h-3.5 w-3.5" />
            </IconBtn>

            {row.original.isInvoiceGenerated && row.original.invoice && (
              <IconBtn
                onClick={(e) =>
                  handleInvoiceDownload(
                    e,
                    row.original.invoice.id,
                    row.original.id,
                  )
                }
                disabled={isDownloading}
                tooltip={isDownloading ? "Downloading…" : "Download Invoice"}
                variant="blue"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </IconBtn>
            )}

            {!row.original.isInvoiceGenerated && (
              <IconBtn
                onClick={() => setOrderToDelete(row.original.id)}
                tooltip="Delete Order"
                variant="red"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize: 10 },
    },
    onSortingChange: setSorting,
    manualPagination: true,
    pageCount: totalPages,
  });

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        p.append("page", currentPage);
        p.append("limit", "10");
        if (statusFilter !== "all") p.append("status", statusFilter);
        if (isPaidFilter !== "all") p.append("isPaid", isPaidFilter);
        if (paymentMethodFilter !== "all")
          p.append("paymentMethodId", paymentMethodFilter);
        if (debouncedSearch) p.append("search", debouncedSearch);
        if (fromDate) p.append("fromDate", fromDate);
        if (toDate) p.append("toDate", toDate);
        p.append("sortBy", sorting[0]?.id || "createdAt");
        p.append("sortOrder", sorting[0]?.desc ? "desc" : "asc");

        const res = await fetch(`/api/admin/orders?${p}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const { orders: fetched, totalPages: tp } = await res.json();
        setOrders(fetched);
        setTotalPages(tp);
      } catch (err) {
        toast.error("Failed to fetch orders: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [
    currentPage,
    statusFilter,
    isPaidFilter,
    debouncedSearch,
    fromDate,
    toDate,
    paymentMethodFilter,
    sorting,
  ]);

  useEffect(() => {
    fetch("/api/admin/payment-methods")
      .then((r) => r.json())
      .then(({ paymentMethods: m }) => setPaymentMethods(m))
      .catch(() => {});
  }, []);

  const inputCls =
    "border-slate-200 focus:ring-2 focus:ring-indigo-400 rounded-xl shadow-sm text-sm h-10 placeholder:text-slate-400";
  const selectCls =
    "w-full border-slate-200 bg-white text-slate-700 rounded-xl shadow-sm text-sm h-10";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-md">
            <ShoppingBag className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Order Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor, filter and manage all customer orders
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2 relative">
              <Input
                placeholder="Search by email, transaction…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputCls}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`${inputCls} text-slate-600`}
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`${inputCls} text-slate-600`}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={selectCls}>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <SelectItem key={v} value={v}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isPaidFilter} onValueChange={setIsPaidFilter}>
              <SelectTrigger className={selectCls}>
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="true">Paid</SelectItem>
                <SelectItem value="false">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paymentMethods.length > 0 && (
            <div className="w-full sm:w-56">
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className={selectCls}>
                  <SelectValue placeholder="All Payment Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-400 font-medium">
                Loading orders…
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/80">
                      {table.getHeaderGroups().map((hg) =>
                        hg.headers.map((h) => (
                          <TableHead
                            key={h.id}
                            className="px-4 py-3 text-left whitespace-nowrap"
                          >
                            {flexRender(
                              h.column.columnDef.header,
                              h.getContext(),
                            )}
                          </TableHead>
                        )),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row, i) => (
                        <TableRow
                          key={row.id}
                          className={`border-b border-slate-50 hover:bg-indigo-50/40 transition-colors duration-100 ${i % 2 !== 0 ? "bg-slate-50/40" : ""}`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className="px-4 py-3 whitespace-nowrap"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-64">
                          <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                            <PackageX className="h-14 w-14 text-slate-200" />
                            <div className="text-center">
                              <p className="font-semibold text-slate-500 text-sm">
                                No orders found
                              </p>
                              <p className="text-xs mt-1 text-slate-400">
                                Try adjusting your filters or search.
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-700">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {totalPages}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={!table.getCanNextPage()}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {orderToDelete && (
        <DeleteModal
          orderId={orderToDelete}
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setOrderToDelete(null)}
        />
      )}

      {/* Download overlay */}
      <DownloadToast orderId={downloadingInvoice} />
    </div>
  );
}

// ─── Tiny header helpers ──────────────────────────────────────────────────────
function ColHead({ children }) {
  return (
    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
      {children}
    </span>
  );
}

function SortHead({ column, label }) {
  return (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors group"
    >
      {label}
      <ArrowUpDown className="h-3 w-3 group-hover:text-slate-600" />
    </button>
  );
}
