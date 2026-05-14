"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingBag,
  Package,
  User,
  Clock,
  Loader2,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export default function Summary() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all-time");
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalUsers: 0,
    },
    recentOrders: [],
    topSellingProduct: null,
    lowStockProducts: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const summaryResponse = await fetch(
          `/api/admin/dashboard/summary?period=${period}`
        );
        const summaryData = await summaryResponse.json();

        setDashboardData({
          summary: {
            totalRevenue: summaryData.metrics.totalRevenue,
            totalOrders: summaryData.metrics.totalOrders,
            totalProducts: summaryData.metrics.totalProducts, // Changed from summaryData.summary.totalProducts
            totalUsers: summaryData.metrics.totalUsers, // Changed from summaryData.summary.totalUsers
          },
          recentOrders: summaryData.orders.slice(0, 4),
          topSellingProduct: summaryData.topSellingProduct,
          lowStockProducts: summaryData.lowStockProducts,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [period]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
    }).format(amount);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "DELIVERED":
        return "green";
      case "SHIPPED":
        return "blue";
      case "PROCESSING":
        return "yellow";
      case "PENDING":
        return "orange";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="15days">Last 15 Days</SelectItem>
            <SelectItem value="1month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* --- Main Metrics --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summary.totalOrders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summary.totalProducts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summary.totalUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- Top Selling Product --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" /> Top Selling Product
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {dashboardData.topSellingProduct ? (
              <>
                <Image
                  src={dashboardData.topSellingProduct.image.url}
                  alt={dashboardData.topSellingProduct.name}
                  width={80}
                  height={80}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {dashboardData.topSellingProduct.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sold: {dashboardData.topSellingProduct.quantitySold} units
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No orders in this period.</p>
            )}
          </CardContent>
        </Card>

        {/* --- Low Stock Products --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.lowStockProducts.length > 0 ? (
                  dashboardData.lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-right font-medium text-red-500">
                        {product.stockAmount}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      All products are well-stocked.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* --- Recent Orders Table --- */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-xs">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{order.user.name}</TableCell>
                    <TableCell>{formatCurrency(order.orderTotal)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
