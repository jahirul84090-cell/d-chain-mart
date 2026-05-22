/**
 * File: app/admin/accounting/products/page.jsx
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  AlertCircle,
  BarChart3,
  Boxes,
  Loader2,
  Package,
  RefreshCcw,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;

const todayDate = new Date().toISOString().slice(0, 10);

const firstDayOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
)
  .toISOString()
  .slice(0, 10);

function StatCard({ title, value, sub, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-2xl font-bold">{value}</h3>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountingProductsPage() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayDate);
  const [q, setQ] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts(page = 1) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q.trim()) params.set("q", q.trim());
      if (lowStock) params.set("lowStock", "true");

      const res = await fetch(`/api/admin/accounting/products?${params}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load product report.");
        return;
      }

      setProducts(data.products || []);
      setSummary(data.summary || {});
      setPagination(
        data.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts(1);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Product Accounting
            </h1>
            <p className="text-sm text-muted-foreground">
              Product-wise sales, stock value, direct profit and loan profit.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/accounting">Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/accounting/stock">Stock Ledger</Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={money(summary.totalRevenue)}
            sub="Direct + loan sales"
            icon={Wallet}
          />
          <StatCard
            title="Total Profit"
            value={money(summary.totalProfit)}
            sub="Direct profit + loan expected profit"
            icon={TrendingUp}
          />
          <StatCard
            title="Stock Cost Value"
            value={money(summary.stockCostValue)}
            sub="Buying price × stock"
            icon={Boxes}
          />
          <StatCard
            title="Stock Selling Value"
            value={money(summary.stockSellingValue)}
            sub="Selling price × stock"
            icon={BarChart3}
          />
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                From
              </label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                To
              </label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Search Product
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or slug"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                <Checkbox
                  checked={lowStock}
                  onCheckedChange={(checked) => setLowStock(Boolean(checked))}
                />
                Low stock
              </label>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => loadProducts(1)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Direct Revenue</p>
              <h3 className="mt-2 text-2xl font-bold">
                {money(summary.directRevenue)}
              </h3>
              <p className="text-xs text-muted-foreground">
                Sold Qty: {summary.directSoldQty || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Loan Sales</p>
              <h3 className="mt-2 text-2xl font-bold">
                {money(summary.loanSales)}
              </h3>
              <p className="text-xs text-muted-foreground">
                Loan Qty: {summary.loanSoldQty || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Loan Expected Profit
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                {money(summary.loanExpectedProfit)}
              </h3>
              <p className="text-xs text-muted-foreground">
                Interest + product profit
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" />
              Product Profit Report
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Buy</TableHead>
                    <TableHead>Sell</TableHead>
                    <TableHead>Stock Cost</TableHead>
                    <TableHead>Direct Sales</TableHead>
                    <TableHead>Loan Sales</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Total Profit</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading products...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                              {product.mainImage ? (
                                <Image
                                  src={product.mainImage}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="m-3 h-6 w-6 text-muted-foreground" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.categoryName || "No category"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              Number(product.stockAmount || 0) <= 5
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {product.stockAmount}
                          </Badge>
                        </TableCell>

                        <TableCell>{money(product.buyingPrice)}</TableCell>
                        <TableCell>{money(product.sellingPrice)}</TableCell>
                        <TableCell>{money(product.stockCostValue)}</TableCell>
                        <TableCell>{money(product.directRevenue)}</TableCell>
                        <TableCell>{money(product.loanSales)}</TableCell>
                        <TableCell className="font-semibold">
                          {money(product.totalRevenue)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {money(product.totalProfit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} — Total{" "}
                {pagination.total} products
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => loadProducts(pagination.page - 1)}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  disabled={
                    pagination.page >= pagination.totalPages || loading
                  }
                  onClick={() => loadProducts(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}