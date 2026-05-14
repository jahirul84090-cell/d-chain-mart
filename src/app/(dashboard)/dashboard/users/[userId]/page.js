"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Copy,
  SquareArrowOutUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminUserDetailsPage() {
  const router = useRouter();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    async function fetchUserDetails() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/users/${userId}?page=${currentPage}&pageSize=${pageSize}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch user details");
        }
        const { user, totalOrders } = await response.json();
        setUser(user);
        setTotalOrders(totalOrders);
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user details: " + error.message, {
          position: "top-right",
        });
        router.push("/admin/users");
      } finally {
        setLoading(false);
      }
    }
    fetchUserDetails();
  }, [userId, router, currentPage]);

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(user.id);
    toast.success("User ID copied to clipboard!", { position: "bottom-right" });
  };

  const handleExpandOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatRole = (role) => {
    if (!role) return "N/A";
    return role.toLowerCase().replace(/_/g, " ");
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.street}, ${address.city}, ${address.country}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
    }).format(amount);
  };

  const totalPages = Math.ceil(totalOrders / pageSize);
  const totalLTV =
    user?.orders?.reduce((sum, order) => sum + order.orderTotal, 0) || 0;
  const averageOrderValue = totalOrders > 0 ? totalLTV / totalOrders : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 flex flex-col justify-center items-center min-h-screen bg-gray-50 text-gray-800">
        <p className="text-gray-500 text-lg">User not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/users")}
          className="mt-4 text-blue-500 border-blue-500 hover:bg-blue-50"
        >
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 max-w-7xl min-h-screen  text-gray-800">
      <ToastContainer position="bottom-right" />
      <Button
        variant="outline"
        onClick={() => router.push("/admin/users")}
        className="mb-6 text-blue-500 border-blue-500 hover:bg-blue-50"
      >
        Back to Users
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalOrders}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Lifetime Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalLTV)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Average Order Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg bg-white border-gray-200 rounded-xl overflow-hidden mb-8">
        <CardHeader className="bg-gray-100 p-6 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            User Profile
          </CardTitle>
          <CardDescription className="text-gray-500">
            Detailed information about the user and their account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">User ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-gray-800 break-all">{user.id}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyUserId}>
                  <Copy className="h-4 w-4 text-blue-500" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-800 font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-800 font-medium">{user.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-gray-800 font-medium capitalize">
                {formatRole(user.role)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Created At</p>
              <p className="text-gray-800 font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Updated At</p>
              <p className="text-gray-800 font-medium">
                {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-white border-gray-200 rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-100 p-6 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Order History
          </CardTitle>
          <CardDescription className="text-gray-500">
            A list of all past orders made by this user.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow className="border-gray-200">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="text-gray-500">Order ID</TableHead>
                  <TableHead className="text-gray-500">Total ($)</TableHead>
                  <TableHead className="text-gray-500">Status</TableHead>
                  <TableHead className="text-gray-500">
                    Shipping Address
                  </TableHead>
                  <TableHead className="text-gray-500">Created At</TableHead>
                  <TableHead className="text-right text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.orders.length > 0 ? (
                  user.orders.map((order) => (
                    <>
                      <TableRow
                        key={order.id}
                        onClick={() => handleExpandOrder(order.id)}
                        className="cursor-pointer hover:bg-gray-100 transition-colors border-gray-200"
                      >
                        <TableCell>
                          <ChevronDown
                            className={`h-4 w-4 transform transition-transform text-blue-500 ${
                              expandedOrderId === order.id
                                ? "rotate-180"
                                : "rotate-0"
                            }`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatCurrency(order.orderTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize border-gray-300 text-gray-500"
                          >
                            {order.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatAddress(order.shippingAddress)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/order/${order.id}`}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-blue-500 border-blue-500 hover:bg-blue-50"
                            >
                              <SquareArrowOutUpRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                      {expandedOrderId === order.id && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={7}>
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-lg mb-2 text-gray-900">
                                Order Items
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-100">
                                    <TableHead className="text-gray-500">
                                      Product Name
                                    </TableHead>
                                    <TableHead className="text-gray-500">
                                      Quantity
                                    </TableHead>
                                    <TableHead className="text-gray-500">
                                      Price Paid
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item) => (
                                    <TableRow
                                      key={item.id}
                                      className="border-gray-200"
                                    >
                                      <TableCell className="text-gray-900">
                                        {item.productSnapshot.name}
                                      </TableCell>
                                      <TableCell className="text-gray-700">
                                        {item.quantity}
                                      </TableCell>
                                      <TableCell className="text-gray-700">
                                        {formatCurrency(item.pricePaid)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500 py-4"
                    >
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalOrders > 0 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
                className="text-blue-500 border-blue-500 hover:bg-blue-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage >= totalPages}
                className="text-blue-500 border-blue-500 hover:bg-blue-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
