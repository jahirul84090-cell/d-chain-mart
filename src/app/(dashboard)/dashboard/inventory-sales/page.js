"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ShoppingCart,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  BarChart3,
  TrendingUp,
  Banknote,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

const tk = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });

const pct = (n) =>
  (isNaN(n) || !isFinite(n) ? "0" : Number(n).toFixed(1)) + "%";

const MONTHS = [
  { v: 1, l: "January" },
  { v: 2, l: "February" },
  { v: 3, l: "March" },
  { v: 4, l: "April" },
  { v: 5, l: "May" },
  { v: 6, l: "June" },
  { v: 7, l: "July" },
  { v: 8, l: "August" },
  { v: 9, l: "September" },
  { v: 10, l: "October" },
  { v: 11, l: "November" },
  { v: 12, l: "December" },
];

const NOW = new Date();

function KPI({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-2xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-lg font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleting, setDeleting] = useState(null);

  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState(String(NOW.getFullYear()));

  const [fProduct, setFProduct] = useState("");
  const [fQty, setFQty] = useState("1");
  const [fPrice, setFPrice] = useState("");
  const [fMonth, setFMonth] = useState(String(NOW.getMonth() + 1));
  const [fYear, setFYear] = useState(String(NOW.getFullYear()));
  const [fNote, setFNote] = useState("");

  const selectedProduct = products.find((p) => p.id === fProduct);
  const previewQty = parseInt(fQty, 10) || 0;
  const previewPrice = parseFloat(fPrice) || 0;
  const previewRevenue = previewPrice * previewQty;
  const previewCost = selectedProduct ? selectedProduct.buyPrice * previewQty : 0;
  const previewProfit = previewRevenue - previewCost;
  const previewMargin = previewCost > 0 ? (previewProfit / previewCost) * 100 : 0;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const salesQuery =
        filterMonth !== "all"
          ? `?month=${filterMonth}&year=${filterYear}`
          : filterYear
          ? `?year=${filterYear}`
          : "";

      const [pRes, sRes] = await Promise.all([
        fetch("/api/admin/inventory/products"),
        fetch(`/api/admin/inventory/sales${salesQuery}`),
      ]);

      const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);

      if (!pRes.ok) {
        throw new Error(pData.error || "Failed to load products.");
      }

      if (!sRes.ok) {
        throw new Error(sData.error || "Failed to load sales.");
      }

      setProducts(pData.products || []);
      setSales(sData.sales || []);
      setTotals(sData.totals || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openForm = () => {
    setFProduct("");
    setFQty("1");
    setFPrice("");
    setFNote("");
    setFMonth(String(NOW.getMonth() + 1));
    setFYear(String(NOW.getFullYear()));
    setFormErr("");
    setShowForm(true);
  };

  const onProductChange = (id) => {
    setFProduct(id);

    const product = products.find((item) => item.id === id);

    if (product) {
      setFPrice(String(product.sellPrice));
    }
  };

  const handleSave = async () => {
    setFormErr("");
    setSaving(true);

    try {
      if (!fProduct) {
        setFormErr("Please select a product.");
        return;
      }

      if (!fQty || parseInt(fQty, 10) <= 0) {
        setFormErr("Qty must be greater than 0.");
        return;
      }

      if (!fPrice || parseFloat(fPrice) <= 0) {
        setFormErr("Sell price must be greater than 0.");
        return;
      }

      const res = await fetch("/api/admin/inventory/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: fProduct,
          qty: parseInt(fQty, 10),
          sellPrice: parseFloat(fPrice),
          month: parseInt(fMonth, 10),
          year: parseInt(fYear, 10),
          note: fNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record sale.");
      }

      setShowForm(false);
      loadAll();
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this sale and restore stock?")) return;

    setDeleting(id);

    try {
      await fetch(`/api/admin/inventory/sales/${id}`, {
        method: "DELETE",
      });

      loadAll();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/inventory">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              </Link>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-black">Sales</h1>
                <p className="text-xs text-slate-500">
                  {sales.length} transactions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard/inventory-reports">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Reports
                </Button>
              </Link>

              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={openForm}
              >
                <Plus className="h-3.5 w-3.5" />
                Record Sale
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={loadAll}
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
            label="Total Revenue"
            value={tk(totals.revenue)}
            icon={Banknote}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          />

          <KPI
            label="Total Buy Cost"
            value={tk(totals.cost)}
            icon={Package}
            color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          />

          <KPI
            label="Total Profit"
            value={tk(totals.profit)}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          />

          <KPI
            label="Units Sold"
            value={totals.units || 0}
            icon={ShoppingCart}
            color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTHS.map((month) => (
                <SelectItem key={month.v} value={String(month.v)}>
                  {month.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
              </div>
            ) : sales.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">No sales recorded yet.</p>

                <Button
                  size="sm"
                  className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={openForm}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Record First Sale
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-800/60">
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sales.map((sale) => {
                    const profitColor =
                      sale.profit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400";

                    return (
                      <TableRow key={sale.id} className="group">
                        <TableCell>
                          <div className="font-semibold">
                            {sale.product?.brandName} {sale.product?.model}
                          </div>

                          {sale.product?.variant && (
                            <div className="text-xs text-slate-500">
                              {sale.product.variant}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {sale.qty}
                        </TableCell>

                        <TableCell className="text-right text-slate-500">
                          {tk(sale.buyPrice)}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {tk(sale.sellPrice)}
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {tk(sale.revenue)}
                        </TableCell>

                        <TableCell className="text-right text-amber-600">
                          {tk(sale.cost)}
                        </TableCell>

                        <TableCell
                          className={`text-right font-bold ${profitColor}`}
                        >
                          {tk(sale.profit)}
                        </TableCell>

                        <TableCell className={`text-right ${profitColor}`}>
                          {pct(sale.margin)}
                        </TableCell>

                        <TableCell className="text-sm">
                          {MONTHS.find((month) => month.v === sale.month)?.l?.slice(
                            0,
                            3
                          )}{" "}
                          {sale.year}
                        </TableCell>

                        <TableCell className="text-xs text-slate-400">
                          {sale.note || "—"}
                        </TableCell>

                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => handleDelete(sale.id)}
                            disabled={deleting === sale.id}
                          >
                            {deleting === sale.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Product *</Label>

              <Select value={fProduct} onValueChange={onProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>

                <SelectContent>
                  {products
                    .filter((product) => product.stock > 0)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.brandName} {product.model}{" "}
                        {product.variant ? `(${product.variant})` : ""} — Stock:{" "}
                        {product.stock}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Qty *</Label>
                <Input
                  type="number"
                  value={fQty}
                  onChange={(e) => setFQty(e.target.value)}
                  min="1"
                  max={selectedProduct?.stock}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Sell Price (৳) *
                </Label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ৳
                  </span>

                  <Input
                    type="number"
                    value={fPrice}
                    onChange={(e) => setFPrice(e.target.value)}
                    className="pl-7"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Month *</Label>

                <Select value={fMonth} onValueChange={setFMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.v} value={String(month.v)}>
                        {month.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Year *</Label>

                <Input
                  type="number"
                  value={fYear}
                  onChange={(e) => setFYear(e.target.value)}
                  min="2020"
                  max="2099"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Note (optional)</Label>
              <Input
                value={fNote}
                onChange={(e) => setFNote(e.target.value)}
                placeholder="e.g. cash payment, discount given"
              />
            </div>

            {selectedProduct && previewQty > 0 && previewPrice > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                {[
                  ["Revenue", tk(previewRevenue), "text-blue-600 dark:text-blue-400"],
                  ["Buy Cost", tk(previewCost), "text-amber-600 dark:text-amber-400"],
                  [
                    "Profit",
                    tk(previewProfit),
                    previewProfit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600",
                  ],
                  [
                    "Margin",
                    pct(previewMargin),
                    previewProfit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600",
                  ],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <p className="text-[10px] text-slate-500">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                  </div>
                ))}
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
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Record Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}