"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  TrendingUp,
  Banknote,
  BarChart3,
  ShoppingCart,
  RefreshCw,
  Search,
} from "lucide-react";

const tk = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });

const pct = (n) =>
  (isNaN(n) || !isFinite(n) ? "0" : Number(n).toFixed(1)) + "%";

function KPI({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-0.5 text-2xl font-black">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  brandName: "",
  model: "",
  variant: "",
  buyPrice: "",
  sellPrice: "",
  stock: "1",
};

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/inventory/products");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load products.");
      }

      setProducts(data.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErr("");
    setShowAdd(true);
    setEditItem(null);
  };

  const openEdit = (p) => {
    setForm({
      brandName: p.brandName,
      model: p.model,
      variant: p.variant || "",
      buyPrice: String(p.buyPrice),
      sellPrice: String(p.sellPrice),
      stock: String(p.stock),
    });

    setFormErr("");
    setEditItem(p);
    setShowAdd(true);
  };

  const handleSave = async () => {
    setFormErr("");
    setSaving(true);

    try {
      const body = {
        brandName: form.brandName,
        model: form.model,
        variant: form.variant,
        buyPrice: parseFloat(form.buyPrice),
        sellPrice: parseFloat(form.sellPrice),
        stock: parseInt(form.stock, 10) || 0,
      };

      if (!body.brandName || !body.model) {
        setFormErr("Brand and model are required.");
        return;
      }

      if (!body.buyPrice || body.buyPrice <= 0) {
        setFormErr("Buy price must be greater than 0.");
        return;
      }

      if (!body.sellPrice || body.sellPrice <= 0) {
        setFormErr("Sell price must be greater than 0.");
        return;
      }

      const url = editItem
        ? `/api/admin/inventory/products/${editItem.id}`
        : "/api/admin/inventory/products";

      const method = editItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      setShowAdd(false);
      load();
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this product?")) return;

    setDeleting(id);

    try {
      await fetch(`/api/admin/inventory/products/${id}`, {
        method: "DELETE",
      });

      load();
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter((p) =>
    `${p.brandName} ${p.model} ${p.variant || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalBuyVal = products.reduce((s, p) => s + p.buyPrice * p.stock, 0);
  const totalSellVal = products.reduce((s, p) => s + p.sellPrice * p.stock, 0);
  const totalSaleProfit = products.reduce((s, p) => s + p.totalProfit, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <Package className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-black">Inventory</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {products.length} products · {totalStock} units in stock
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard/inventory-sales">
                <Button variant="outline" size="sm" className="gap-2">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Sales
                </Button>
              </Link>

              <Link href="/dashboard/inventory-reports">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Reports
                </Button>
              </Link>

              <Button
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={openAdd}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KPI
            label="Products"
            value={products.length}
            icon={Package}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          />

          <KPI
            label="Stock Value (Buy)"
            value={tk(totalBuyVal)}
            icon={Banknote}
            color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          />

          <KPI
            label="Stock Value (Sell)"
            value={tk(totalSellVal)}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          />

          <KPI
            label="Total Profit Earned"
            value={tk(totalSaleProfit)}
            sub="from all sales"
            icon={BarChart3}
            color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search brand, model, variant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Package className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">No products found.</p>

                <Button
                  size="sm"
                  className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={openAdd}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Product
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-800/60">
                    <TableHead>Brand / Model</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Total Profit</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((p) => {
                    const marginColor =
                      p.margin >= 20
                        ? "text-emerald-600 dark:text-emerald-400"
                        : p.margin >= 10
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400";

                    const stockBadge =
                      p.stock === 0
                        ? "bg-red-100 text-red-700"
                        : p.stock < 3
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700";

                    const stockLabel =
                      p.stock === 0
                        ? "Out of Stock"
                        : p.stock < 3
                        ? "Low Stock"
                        : "In Stock";

                    return (
                      <TableRow key={p.id} className="group">
                        <TableCell>
                          <div className="font-semibold">{p.brandName}</div>
                          <div className="text-xs text-slate-500">
                            {p.model}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-slate-500">
                          {p.variant || "—"}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {tk(p.buyPrice)}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {tk(p.sellPrice)}
                        </TableCell>

                        <TableCell
                          className={`text-right font-bold ${marginColor}`}
                        >
                          {pct(p.margin)}
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {p.stock}
                        </TableCell>

                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {tk(p.stockValue)}
                        </TableCell>

                        <TableCell className="text-right">
                          {p.totalUnitsSold}
                        </TableCell>

                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {tk(p.totalProfit)}
                        </TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${stockBadge}`}
                          >
                            {stockLabel}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(p.id)}
                              disabled={deleting === p.id}
                            >
                              {deleting === p.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Brand Name *</Label>
                <Input
                  value={form.brandName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brandName: e.target.value }))
                  }
                  placeholder="e.g. Samsung"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Model *</Label>
                <Input
                  value={form.model}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, model: e.target.value }))
                  }
                  placeholder="e.g. A55"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Variant</Label>
              <Input
                value={form.variant}
                onChange={(e) =>
                  setForm((f) => ({ ...f, variant: e.target.value }))
                }
                placeholder="e.g. 8/128, Button"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Buy Price (৳) *</Label>
                <Input
                  type="number"
                  value={form.buyPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, buyPrice: e.target.value }))
                  }
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Sell Price (৳) *
                </Label>
                <Input
                  type="number"
                  value={form.sellPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sellPrice: e.target.value }))
                  }
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stock Qty</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {form.buyPrice && form.sellPrice && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Profit per unit</span>
                  <span className="font-bold text-emerald-600">
                    {tk(
                      (parseFloat(form.sellPrice) || 0) -
                        (parseFloat(form.buyPrice) || 0)
                    )}
                  </span>
                </div>

                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-slate-500">Margin</span>
                  <span className="font-bold text-emerald-600">
                    {pct(
                      form.buyPrice > 0
                        ? ((parseFloat(form.sellPrice) -
                            parseFloat(form.buyPrice)) /
                            parseFloat(form.buyPrice)) *
                            100
                        : 0
                    )}
                  </span>
                </div>
              </div>
            )}

            {formErr && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{formErr}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {editItem ? "Update" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}