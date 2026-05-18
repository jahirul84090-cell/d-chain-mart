"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileDown, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "react-toastify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalOrders: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [downloadingStates, setDownloadingStates] = useState({});
  const [copyingStates, setCopyingStates] = useState({});
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/orders?page=${page}&pageSize=${pagination.pageSize}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const result = await response.json();
        setOrders(result.data);
        setPagination(result.pagination);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
        toast.error("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, pagination.pageSize]);

  const downloadInvoice = async (invoiceId) => {
    setDownloadingStates((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice.");
    } finally {
      setDownloadingStates((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  const copyTransactionNumber = async (transactionNumber) => {
    setCopyingStates((prev) => ({ ...prev, [transactionNumber]: true }));
    try {
      await navigator.clipboard.writeText(transactionNumber);
      toast.success(
        `Transaction number copied: ${transactionNumber.slice(0, 8)}...`
      );
    } catch (error) {
      console.error("Failed to copy transaction number:", error);
      toast.error("Failed to copy transaction number.");
    } finally {
      setCopyingStates((prev) => ({ ...prev, [transactionNumber]: false }));
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen  flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900 flex justify-center items-center">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6 lg:p-12 min-h-screen text-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 sm:mb-12 flex items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                All Orders
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                A comprehensive history of all your purchases.
              </p>
            </div>
          </div>

          <Card className="shadow-lg border border-gray-200 rounded-2xl bg-white mb-10">
            <CardHeader className="p-6 sm:p-8 rounded-t-2xl flex-row justify-between items-center">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Order ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Total
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Payment Method
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Payment Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Transaction Number
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <>
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.id.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === "DELIVERED"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "PENDING"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "CANCELLED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                              ৳{" "}
                              {order.orderTotal?.toLocaleString("en-BD") ||
                                "0.00"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {order.paymentMethod?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.isPaid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.isPaid ? "Paid" : "Unpaid"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                {order.transactionNumber ? (
                                  <>
                                    <span className="truncate max-w-[150px]">
                                      {order.transactionNumber?.slice(0, 4)}...
                                      {order.transactionNumber?.slice(-4)}
                                    </span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() =>
                                            copyTransactionNumber(
                                              order.transactionNumber
                                            )
                                          }
                                          variant="ghost"
                                          size="icon"
                                          className="text-gray-500 hover:text-primary rounded-full"
                                          disabled={
                                            copyingStates[
                                              order.transactionNumber
                                            ]
                                          }
                                        >
                                          {copyingStates[
                                            order.transactionNumber
                                          ] ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Copy Transaction Number</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <span>N/A</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2 justify-end">
                                {order.isInvoiceGenerated &&
                                  order.invoice?.id && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() =>
                                            downloadInvoice(order.invoice.id)
                                          }
                                          variant="ghost"
                                          size="icon"
                                          className="text-gray-500 hover:text-primary rounded-full"
                                          disabled={
                                            downloadingStates[order.invoice.id]
                                          }
                                        >
                                          {downloadingStates[
                                            order.invoice.id
                                          ] ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <FileDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Download Invoice</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                {order.items && order.items.length > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        onClick={() =>
                                          toggleOrderDetails(order.id)
                                        }
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-500 hover:text-primary rounded-full"
                                      >
                                        {expandedOrderId === order.id ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {expandedOrderId === order.id
                                          ? "Hide Details"
                                          : "View Details"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedOrderId === order.id && (
                            <tr
                              className="bg-gray-100"
                              key={`details-${order.id}`}
                            >
                              <td colSpan="8" className="p-4">
                                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                  {/* Order Items List */}
                                  <h4 className="font-bold text-gray-800 mb-2">
                                    Order Items
                                  </h4>
                                  <ul className="space-y-2">
                                    {order.items.map((item, index) => {
                                      const productDetails =
                                        typeof item.productSnapshot === "string"
                                          ? JSON.parse(item.productSnapshot)
                                          : item.productSnapshot;

                                      if (!productDetails) {
                                        return null;
                                      }

                                      return (
                                        <li
                                          key={`${order.id}-${index}`}
                                          className="flex items-center justify-between text-sm text-gray-700"
                                        >
                                          <span>
                                            {productDetails.name} (x
                                            {item.quantity})
                                          </span>
                                          <span className="font-semibold">
                                            ${productDetails.price.toFixed(2)}
                                          </span>
                                        </li>
                                      );
                                    })}
                                  </ul>

                                  {/* Order Summary */}
                                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                    <h4 className="font-bold text-gray-800">
                                      Order Summary
                                    </h4>
                                    <div className="flex justify-between text-sm text-gray-700">
                                      <span>Total Products:</span>
                                      <span className="font-semibold">
                                        {order.items.length}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-700">
                                      <span>Total Quantity:</span>
                                      <span className="font-semibold">
                                        {order.items.reduce(
                                          (total, item) =>
                                            total + item.quantity,
                                          0
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-700">
                                      <span>Delivery Fee:</span>
                                      <span className="font-semibold">
                                        ${order.deliveryFee.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold text-gray-900 mt-2 pt-2 border-t border-gray-300">
                                      <span>Order Total:</span>
                                      <span>
                                        ${order.orderTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500">
                  <p className="text-lg mb-4">
                    It looks like you haven't placed any orders yet.{" "}
                  </p>
                  <Link href="/products">
                    <Button className="mt-4 rounded-full bg-primary text-white font-semibold px-6">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                variant="outline"
                className="rounded-full"
              >
                Previous
              </Button>
              <span className="text-gray-700 font-semibold">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === pagination.totalPages}
                variant="outline"
                className="rounded-full"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
