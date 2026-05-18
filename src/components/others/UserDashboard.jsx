"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  FileDown,
  ArrowLeft,
  Copy,
  Package,
  Clock,
  CheckCircle,
  Heart,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PendingReviewsList from "./PendingReviewList";

export default function UserDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    wishlistItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingStates, setDownloadingStates] = useState({});
  const [copyingStates, setCopyingStates] = useState({});

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, ordersResponse] = await Promise.all([
          fetch("/api/users/dashboard"),
          fetch("/api/orders?page=1&pageSize=5"),
        ]);

        if (!dashboardResponse.ok) {
          throw new Error(
            `Failed to fetch dashboard data: ${dashboardResponse.statusText}`
          );
        }
        if (!ordersResponse.ok) {
          throw new Error(
            `Failed to fetch recent orders: ${ordersResponse.statusText}`
          );
        }

        const dashboardResult = await dashboardResponse.json();
        const ordersResult = await ordersResponse.json();

        setDashboardData(dashboardResult);
        setRecentOrders(ordersResult.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data. Please try again.");
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, []);

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

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900 flex justify-center items-center">
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

  const { totalOrders, pendingOrders, completedOrders, wishlistItems } =
    dashboardData;

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6 lg:p-12  min-h-screen text-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 sm:mb-12 flex items-center">
            <Link href="/dashboard" passHref>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full mr-4 text-gray-500 hover:text-primary"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                Welcome to Your Dashboard!
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Your personalized overview of account activities.
              </p>
            </div>
          </div>

          {/* --- */}

          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white p-6 flex flex-col items-center text-center">
              <Package className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900 mb-1">
                {totalOrders}
              </CardTitle>
              <p className="text-gray-600">Total Orders</p>
            </Card>
            <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white p-6 flex flex-col items-center text-center">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900 mb-1">
                {pendingOrders}
              </CardTitle>
              <p className="text-gray-600">Pending Orders</p>
            </Card>
            <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white p-6 flex flex-col items-center text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900 mb-1">
                {completedOrders}
              </CardTitle>
              <p className="text-gray-600">Completed Orders</p>
            </Card>
            <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white p-6 flex flex-col items-center text-center">
              <Heart className="h-12 w-12 text-red-500 mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900 mb-1">
                {wishlistItems}
              </CardTitle>
              <p className="text-gray-600">Wishlist Items</p>
            </Card>
          </div>

          {/* --- */}
          <section className="py-5">
            <PendingReviewsList />
          </section>

          <Card className="shadow-lg border border-gray-200 rounded-2xl bg-white mb-10">
            <CardHeader className="p-6 sm:p-8 rounded-t-2xl flex-row justify-between items-center">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {recentOrders.length > 0 ? (
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
                          Transaction
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
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
                          <td className="px-6 py-4  whitespace-nowrap text-sm font-bold">
                            ৳{" "}
                            {order.orderTotal?.toLocaleString("en-BD") ||
                              "0.00"}
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
                                          copyingStates[order.transactionNumber]
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
                                        className="text-gray-500 hover:text-purple-600 rounded-full"
                                        disabled={
                                          downloadingStates[order.invoice.id]
                                        }
                                      >
                                        {downloadingStates[order.invoice.id] ? (
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500">
                  <p className="text-lg mb-4">
                    You don't have any recent orders.
                  </p>
                  <Link href="/products" passHref>
                    <Button className="mt-4 rounded-sm bg-primary text-white font-semibold px-6">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- */}

          {/* Navigation Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/profile" passHref>
              <Button
                asChild
                className="w-full h-16 rounded-2xl bg-white text-primary border border-primary/50 hover:bg-primary/10 shadow-md transition-colors flex items-center justify-center text-lg font-semibold"
              >
                <a className="flex items-center">
                  My Profile <ArrowRight className="ml-3 h-5 w-5" />
                </a>
              </Button>
            </Link>
            <Link href="/cart" passHref>
              <Button
                asChild
                className="w-full h-16 rounded-2xl bg-white text-primary border border-primary/50 hover:bg-primary/10 shadow-md transition-colors flex items-center justify-center text-lg font-semibold"
              >
                <a className="flex items-center">
                  My Carts <ArrowRight className="ml-3 h-5 w-5" />
                </a>
              </Button>
            </Link>
            <Link href="/wishlist" passHref>
              <Button
                asChild
                className="w-full h-16 rounded-2xl bg-white text-primary border border-primary/50 hover:bg-primary/10 shadow-md transition-colors flex items-center justify-center text-lg font-semibold"
              >
                <a className="flex items-center">
                  My Wishlist <ArrowRight className="ml-3 h-5 w-5" />
                </a>
              </Button>
            </Link>
          </div>
          <div className="flex justify-center mt-6">
            <Link href="/orders" passHref>
              <Button variant="link" className="text-primary">
                View All Orders &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
