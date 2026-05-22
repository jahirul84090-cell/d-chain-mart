/**
 * File: app/admin/accounting/stock/page.jsx
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Loader2,
  Package,
  RefreshCcw,
  Search,
  Settings2,
  Trash2,
  Undo2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LEDGER_TYPES = [
  { value: "STOCK_IN", label: "Stock In", icon: ArrowUpCircle },
  { value: "STOCK_OUT", label: "Stock Out", icon: ArrowDownCircle },
  { value: "SALE", label: "Sale", icon: Package },
  { value: "RETURN", label: "Return", icon: Undo2 },
  { value: "DAMAGE", label: "Damage", icon: Trash2 },
  { value: "ADJUSTMENT", label: "Adjustment", icon: Wrench },
];

const typeMap = {
  STOCK_IN: {
    label: "Stock In",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  STOCK_OUT: {
    label: "Stock Out",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  SALE: {
    label: "Sale",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  RETURN: {
    label: "Return",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  DAMAGE: {
    label: "Damage",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  ADJUSTMENT: {
    label: "Adjustment",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const todayDate = new Date().toISOString().slice(0, 10);

const firstDayOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
)
  .toISOString()
  .slice(0, 10);

const emptyForm = {
  productId: "",
  type: "STOCK_IN",
  quantity: "",
  note: "",
};

function dateTimeFmt(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }) {
  const item = typeMap[type] || {
    label: type,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

export default function AccountingStockPage() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayDate);
  const [type, setType] = useState("");
  const [productId, setProductId] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [openForm, setOpenForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.productId) || null;
  }, [products, form.productId]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) return products.slice(0, 50);

    return products
      .filter((product) => {
        return (
          product.name?.toLowerCase().includes(query) ||
          product.slug?.toLowerCase().includes(query)
        );
      })
      .slice(0, 50);
  }, [products, productSearch]);

  async function loadEntries(page = 1) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "20");

      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (type && type !== "ALL") params.set("type", type);
      if (productId && productId !== "ALL") params.set("productId", productId);

      const res = await fetch(`/api/admin/accounting/stock-ledger?${params}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load stock ledger.");
        return;
      }

      setEntries(data.entries || []);
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

  async function loadProducts() {
    try {
      setLoadingProducts(true);

      const res = await fetch("/api/admin/accounting/products?limit=100", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) return;

      setProducts(data.products || []);
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadEntries(1);
    loadProducts();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setProductSearch("");
  }

  function openCreateModal() {
    resetForm();
    setOpenForm(true);
  }

  async function submitStockEntry() {
    try {
      setSaving(true);
      setError("");

      const payload = {
        productId: form.productId,
        type: form.type,
        quantity: Number(form.quantity),
        note: form.note || null,
      };

      const res = await fetch("/api/admin/accounting/stock-ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to create stock entry.");
        return;
      }

      setOpenForm(false);
      resetForm();

      await Promise.all([
        loadEntries(pagination.page || 1),
        loadProducts(),
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const totals = entries.reduce(
    (acc, entry) => {
      if (["STOCK_IN", "RETURN"].includes(entry.type)) {
        acc.stockIn += Number(entry.quantity || 0);
      }

      if (["STOCK_OUT", "SALE", "DAMAGE"].includes(entry.type)) {
        acc.stockOut += Number(entry.quantity || 0);
      }

      if (entry.type === "ADJUSTMENT") {
        acc.adjustments += 1;
      }

      return acc;
    },
    {
      stockIn: 0,
      stockOut: 0,
      adjustments: 0,
    }
  );

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stock Ledger</h1>
            <p className="text-sm text-muted-foreground">
              Track stock in, stock out, returns, damages and manual adjustments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/accounting">Dashboard</Link>
            </Button>

            <Button onClick={openCreateModal}>
              <Boxes className="mr-2 h-4 w-4" />
              Add Stock Entry
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Stock In</p>
              <h3 className="mt-2 text-2xl font-bold">{totals.stockIn}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Current page entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Stock Out</p>
              <h3 className="mt-2 text-2xl font-bold">{totals.stockOut}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Sale / stock out / damage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Adjustments</p>
              <h3 className="mt-2 text-2xl font-bold">{totals.adjustments}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Current page adjustments
              </p>
            </CardContent>
          </Card>
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

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Type
              </label>
              <Select value={type || "ALL"} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="All type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Type</SelectItem>
                  {LEDGER_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Product
              </label>
              <Select value={productId || "ALL"} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Products</SelectItem>
                  {products.slice(0, 80).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => loadEntries(1)}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-5 w-5 text-primary" />
              Stock History
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading stock ledger...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No stock entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {dateTimeFmt(entry.createdAt)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-muted">
                              {entry.product?.mainImage ? (
                                <Image
                                  src={entry.product.mainImage}
                                  alt={entry.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="m-3 h-5 w-5 text-muted-foreground" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {entry.product?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.product?.slug}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <TypeBadge type={entry.type} />
                        </TableCell>

                        <TableCell className="font-bold">
                          {entry.quantity}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {entry.product?.stockAmount ?? "—"}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-[280px] truncate text-muted-foreground">
                          {entry.note || "—"}
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
                {pagination.total} entries
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => loadEntries(pagination.page - 1)}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  disabled={
                    pagination.page >= pagination.totalPages || loading
                  }
                  onClick={() => loadEntries(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Stock Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Search Product
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product name..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
              {loadingProducts ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No product found.
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const active = form.productId === product.id;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          productId: product.id,
                        }))
                      }
                      className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition hover:bg-muted ${
                        active ? "border-primary bg-primary/5" : ""
                      }`}
                    >
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

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Current stock: {product.stockAmount}
                        </p>
                      </div>

                      {active && <Badge>Selected</Badge>}
                    </button>
                  );
                })
              )}
            </div>

            {selectedProduct && (
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Selected: <strong>{selectedProduct.name}</strong> — Current
                  stock: <strong>{selectedProduct.stockAmount}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LEDGER_TYPES.map((item) => {
                    const Icon = item.icon;

                    return (
                      <SelectItem key={item.value} value={item.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {form.type === "ADJUSTMENT" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Adjustment sets product stock to this exact quantity.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                placeholder={
                  form.type === "ADJUSTMENT"
                    ? "Set final stock quantity"
                    : "Enter quantity"
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Note</label>
              <Textarea
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Optional note"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              onClick={submitStockEntry}
              disabled={saving || !form.productId || !form.quantity}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Stock Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}