"use client";

import { useState, useEffect } from "react";
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
  const [isDeleting, setIsDeleting] = useState(false); // New state for delete loading
  const router = useRouter();

  const debouncedSearch = useDebounce(search, 600);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 ring-yellow-300";
      case "PROCESSING":
      case "SHIPPED":
        return "bg-blue-100 text-blue-800 ring-blue-300";
      case "DELIVERED":
        return "bg-green-100 text-green-800 ring-green-300";
      case "CANCELLED":
        return "bg-red-110 text-red-800 ring-red-300";
      default:
        return "bg-gray-100 text-gray-800 ring-gray-300";
    }
  };

  const columns = [
    {
      accessorKey: "sn",
      header: "S.N.",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.index + 1}</span>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "transactionNumber",
      header: "Transaction No.",
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-xs font-medium text-gray-700 cursor-pointer hover:underline">
                {row.original.transactionNumber
                  ? row.original.transactionNumber.slice(0, 10) + "..."
                  : "N/A"}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{row.original.transactionNumber || "N/A"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "user.email",
      header: "User Email",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.user.email}</span>
      ),
    },
    {
      accessorKey: "orderTotal",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          Order Total
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const orderTotal = row.getValue("orderTotal");
        return (
          <span className="text-sm font-semibold text-gray-900">
            ৳
            {orderTotal !== undefined && orderTotal !== null
              ? orderTotal.toLocaleString("en-BD")
              : "0.00"}
          </span>
        );
      },
    },
    {
      accessorKey: "deliveryFee",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          Delivery Fee
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const deliveryFee = row.getValue("deliveryFee");
        return (
          <span className="text-sm text-gray-700">
            ৳
            {deliveryFee !== undefined && deliveryFee !== null
              ? deliveryFee.toLocaleString("en-BD")
              : "0.00"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(
            row.getValue("status")
          )}`}
        >
          {row.getValue("status")}
        </span>
      ),
    },
    {
      accessorKey: "isPaid",
      header: "Paid",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
            row.getValue("isPaid")
              ? "bg-green-100 text-green-800 ring-green-300"
              : "bg-red-100 text-red-800 ring-red-300"
          }`}
        >
          {row.getValue("isPaid") ? "Yes" : "No"}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.paymentMethod?.name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          Created At
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/order/${row.original.id}`)}
            className="flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md
                          border border-teal-500 text-teal-600 hover:bg-teal-50 hover:border-teal-600
                          transition-colors duration-200 shadow-sm"
          >
            Details
          </Button>
          {/* FIX: Add null check for invoice object */}
          {row.original.isInvoiceGenerated && row.original.invoice && (
            <a
              href={`/api/admin/invoices/${row.original.invoice.id}/pdf`}
              download={`invoice-${row.original.id}.pdf`}
              target="_blank"
              className="flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md
                        border border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600
                        transition-colors duration-200 shadow-sm"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Invoice
            </a>
          )}
          {!row.original.isInvoiceGenerated && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setOrderToDelete(row.original.id);
                setIsConfirmModalOpen(true);
              }}
              className="flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md
                          bg-red-500 hover:bg-red-600 text-white
                          transition-colors duration-200 shadow-sm"
            >
              Delete
            </Button>
          )}
        </div>
      ),
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
        console.error("Error fetching orders:", error);
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
        console.error("Error fetching payment methods:", error);
        toast.error("Failed to fetch payment methods");
      }
    }
    fetchPaymentMethods();
  }, []);

  async function confirmDelete() {
    if (!orderToDelete) return;
    setIsDeleting(true); // Set loading to true
    try {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderToDelete }),
      });
      if (response.ok) {
        toast.success("Order deleted successfully");
        setOrders(orders.filter((order) => order.id !== orderToDelete));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order: " + error.message);
    } finally {
      setIsDeleting(false); // Reset loading state
      setIsConfirmModalOpen(false);
      setOrderToDelete(null);
    }
  }

  function cancelDelete() {
    setIsConfirmModalOpen(false);
    setOrderToDelete(null);
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen">
      <Card className="shadow-2xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-600 p-6">
          <CardTitle className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            Order Management <FileText className="ml-3 h-7 w-7" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <Input
              type="text"
              placeholder="Search by Order ID, User Email, or Transaction No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
            />
            <Input
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
            />
            <Input
              type="date"
              placeholder="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm">
                <SelectValue placeholder="Filter by status" />
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
              <SelectTrigger className="w-full border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="true">Paid</SelectItem>
                <SelectItem value="false">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger className="w-full border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm">
                <SelectValue placeholder="Filter by payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex justify-center my-10">
              <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto shadow-md">
                <Table>
                  <TableHeader className="bg-gray-100">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className="px-4 py-3 whitespace-nowrap text-sm text-gray-800"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-64">
                          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                            <PackageX className="h-20 w-20 mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">
                              No Orders Found
                            </h3>
                            <p className="text-center text-sm">
                              There are no orders that match your current
                              filters.
                              <br />
                              Try adjusting your search or clearing the filters
                              to see more results.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="rounded-lg shadow-sm text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                  Previous
                </Button>
                <span className="text-gray-700 font-medium text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!table.getCanNextPage()}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="rounded-lg shadow-sm text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
          <Card className="rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-95 animate-zoom-in">
            <CardHeader className="p-0 mb-4 border-b pb-3">
              <CardTitle className="text-2xl font-bold text-red-700 flex items-center">
                <X className="h-6 w-6 mr-2 text-red-600" /> Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="mb-6 text-gray-700 text-base leading-relaxed">
                Are you absolutely sure you want to permanently delete this
                order (ID:{" "}
                <span className="font-mono font-semibold">
                  {orderToDelete?.slice(0, 8)}...
                </span>
                )? This action cannot be undone and all associated data will be
                removed.
              </p>
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  disabled={isDeleting}
                  className="flex items-center rounded-lg px-4 py-2 text-base
                              border-gray-300 text-gray-700 hover:bg-gray-100
                              transition-all duration-200 shadow-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  variant="destructive"
                  disabled={isDeleting}
                  className="flex items-center rounded-lg px-4 py-2 text-base
                              bg-red-600 hover:bg-red-700 text-white
                              transition-all duration-200 shadow-md"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
