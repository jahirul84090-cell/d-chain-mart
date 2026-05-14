"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  X,
  Check,
  FileText,
  PackageX,
  ShoppingBag,
  Download,
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useDebounce } from "@/lib/useDebounce";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null); // tracks which invoice is downloading
  const router = useRouter();

  const debouncedSearch = useDebounce(search, 600);

  const getStatusConfig = (status) => {
    switch (status) {
      case "PENDING":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          ring: "ring-amber-200",
          dot: "bg-amber-400",
        };
      case "PROCESSING":
        return {
          bg: "bg-sky-50",
          text: "text-sky-700",
          ring: "ring-sky-200",
          dot: "bg-sky-400",
        };
      case "SHIPPED":
        return {
          bg: "bg-violet-50",
          text: "text-violet-700",
          ring: "ring-violet-200",
          dot: "bg-violet-400",
        };
      case "DELIVERED":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          ring: "ring-emerald-200",
          dot: "bg-emerald-400",
        };
      case "CANCELLED":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          ring: "ring-red-200",
          dot: "bg-red-400",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          ring: "ring-gray-200",
          dot: "bg-gray-400",
        };
    }
  };

  async function handleInvoiceDownload(e, invoiceId, orderId) {
    e.preventDefault();
    setDownloadingInvoice(orderId);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to download invoice: " + error.message);
    } finally {
      setDownloadingInvoice(null);
    }
  }

  const columns = [
    {
      accessorKey: "sn",
      header: () => (
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          #
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-400">
          {row.index + 1}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "transactionNumber",
      header: () => (
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Transaction
        </span>
      ),
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-200 transition-colors">
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
      header: () => (
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Customer
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-slate-700 font-medium">
          {row.original.user.email}
        </span>
      ),
    },
    {
      accessorKey: "orderTotal",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors group"
        >
          Total
          <ArrowUpDown className="h-3 w-3 group-hover:text-slate-600 transition-colors" />
        </button>
      ),
      cell: ({ row }) => {
        const val = row.getValue("orderTotal");
        return (
          <span className="text-sm font-bold text-slate-800">
            ৳{val != null ? val.toLocaleString("en-BD") : "0.00"}
          </span>
        );
      },
    },
    {
      accessorKey: "deliveryFee",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors group"
        >
          Delivery
          <ArrowUpDown className="h-3 w-3 group-hover:text-slate-600 transition-colors" />
        </button>
      ),
      cell: ({ row }) => {
        const val = row.getValue("deliveryFee");
        return (
          <span className="text-sm text-slate-600">
            ৳{val != null ? val.toLocaleString("en-BD") : "0.00"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Status
        </span>
      ),
      cell: ({ row }) => {
        const cfg = getStatusConfig(row.getValue("status"));
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {row.getValue("status")}
          </span>
        );
      },
    },
    {
      accessorKey: "isPaid",
      header: () => (
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Paid
        </span>
      ),
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
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
      header: () => (
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Method
        </span>
      ),
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
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors group"
        >
          Date
          <ArrowUpDown className="h-3 w-3 group-hover:text-slate-600 transition-colors" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">
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
      header: () => (
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Actions
        </span>
      ),
      cell: ({ row }) => {
        const isDownloading = downloadingInvoice === row.original.id;
        return (
          <div className="flex items-center gap-2">
            {/* Details Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/order/${row.original.id}`)
                    }
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-150 shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  View Details
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Invoice Download Button */}
            {row.original.isInvoiceGenerated && row.original.invoice && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) =>
                        handleInvoiceDownload(
                          e,
                          row.original.invoice.id,
                          row.original.id,
                        )
                      }
                      disabled={isDownloading}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isDownloading ? "Downloading…" : "Download Invoice"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Delete Button */}
            {!row.original.isInvoiceGenerated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setOrderToDelete(row.original.id);
                        setIsConfirmModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Delete Order
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        params.append("limit", "10");
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (isPaidFilter !== "all") params.append("isPaid", isPaidFilter);
        if (paymentMethodFilter !== "all")
          params.append("paymentMethodId", paymentMethodFilter);
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        params.append("sortBy", sorting[0]?.id || "createdAt");
        params.append("sortOrder", sorting[0]?.desc ? "desc" : "asc");

        const response = await fetch(`/api/admin/orders?${params}`);
        if (!response.ok) throw new Error("Failed to fetch orders");
        const { orders: fetchedOrders, totalPages: fetchedTotalPages } =
          await response.json();
        setOrders(fetchedOrders);
        setTotalPages(fetchedTotalPages);
      } catch (error) {
        toast.error("Failed to fetch orders: " + error.message);
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
    async function fetchPaymentMethods() {
      try {
        const response = await fetch("/api/admin/payment-methods");
        if (!response.ok) throw new Error("Failed to fetch payment methods");
        const { paymentMethods: fetchedMethods } = await response.json();
        setPaymentMethods(fetchedMethods);
      } catch (error) {
        toast.error("Failed to fetch payment methods");
      }
    }
    fetchPaymentMethods();
  }, []);

  async function confirmDelete() {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderToDelete }),
      });
      if (response.ok) {
        toast.success("Order deleted successfully");
        setOrders(orders.filter((o) => o.id !== orderToDelete));
      } else {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete order");
      }
    } catch (error) {
      toast.error("Failed to delete order: " + error.message);
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
      setOrderToDelete(null);
    }
  }

  const filterSelectClass =
    "w-full border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-teal-400 rounded-xl shadow-sm text-sm h-10";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-600 shadow-md">
                <ShoppingBag className="h-4.5 w-4.5 text-white" />
              </span>
              Order Management
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-11">
              Monitor, filter, and manage all customer orders
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2">
              <Input
                type="text"
                placeholder="Search orders, emails, transactions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-200 focus:ring-2 focus:ring-teal-400 rounded-xl shadow-sm text-sm h-10 placeholder:text-slate-400"
              />
            </div>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-slate-200 focus:ring-2 focus:ring-teal-400 rounded-xl shadow-sm text-sm h-10 text-slate-600"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-slate-200 focus:ring-2 focus:ring-teal-400 rounded-xl shadow-sm text-sm h-10 text-slate-600"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={filterSelectClass}>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isPaidFilter} onValueChange={setIsPaidFilter}>
              <SelectTrigger className={filterSelectClass}>
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
            <div className="mt-3 w-full sm:w-64">
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className={filterSelectClass}>
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

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              <p className="text-sm text-slate-400 font-medium">
                Loading orders…
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/70">
                      {table.getHeaderGroups().map((hg) =>
                        hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="px-4 py-3 text-left whitespace-nowrap"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
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
                          className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors duration-100 ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}
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
                              <p className="font-semibold text-slate-500 text-base">
                                No orders found
                              </p>
                              <p className="text-sm mt-1">
                                Try adjusting your filters or search query.
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
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-sm text-slate-500">
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
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={!table.getCanNextPage()}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isDeleting && cancelDelete()}
          />
          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500" />

            <div className="p-6">
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete Order
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                You are about to permanently delete order{" "}
                <code className="font-mono font-semibold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded text-xs">
                  {orderToDelete?.slice(0, 8)}…
                </code>
                . All associated data will be removed from the system.
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setOrderToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-red-200"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Invoice Download Overlay */}
      {downloadingInvoice && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-xl px-5 py-3.5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Downloading Invoice
              </p>
              <p className="text-xs text-slate-400">Preparing your PDF file…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
