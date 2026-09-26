"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminPageHeader from "@/components/Admin/Dashboard/AdminPageHeader";
import { ConfirmDialog, ListPagination, ListState, StatusTabs, useListParams } from "@/components/Admin/Dashboard/AdminListParts";
import { formatBDT } from "@/lib/format";
import { useDebounce } from "@/lib/useDebounce";

const PAGE_SIZE = 20;
const LOW_STOCK = 5;

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Live" },
  { value: "hidden", label: "Hidden" },
  { value: "low", label: "Low stock", alert: true },
  { value: "out", label: "Out of stock", alert: true },
];

const SORTS = {
  newest: "Newest first",
  oldest: "Oldest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "stock-asc": "Stock: low to high",
  "stock-desc": "Stock: high to low",
};

// Storefront placement flags, filterable and shown as badges.
const PLACEMENTS = {
  isFeatured: "Featured",
  isPopular: "Popular",
  isNewArrival: "New arrival",
  isSlider: "Homepage slider",
};

const DEFAULTS = { tab: "all", category: "all", placement: "all", q: "", sort: "newest", page: 1 };

function StockCell({ amount, withLabel }) {
  if (amount <= 0) return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">Out of stock</span>;
  if (amount <= LOW_STOCK)
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">{amount} left</span>;
  return <span className="tabular-nums text-gray-700">{amount}{withLabel && " in stock"}</span>;
}

function PriceCell({ product }) {
  return (
    <div className="whitespace-nowrap">
      <p className="font-semibold text-gray-900">{formatBDT(product.price)}</p>
      {product.oldPrice > product.price && (
        <p className="text-xs text-gray-500">
          <span className="line-through">{formatBDT(product.oldPrice)}</span>
          {product.discount > 0 && <span className="ml-1 font-medium text-green-700">−{Math.round(product.discount)}%</span>}
        </p>
      )}
    </div>
  );
}

function Thumb({ product }) {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
      {product.mainImage ? (
        <Image src={product.mainImage} alt="" fill sizes="48px" className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">{product.name[0]}</span>
      )}
    </div>
  );
}

function Placements({ product }) {
  const tags = Object.entries(PLACEMENTS).filter(([key]) => product[key]);
  if (!tags.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.map(([key, label]) => (
        <span key={key} className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
          {label}
        </span>
      ))}
    </div>
  );
}

function RowActions({ product, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href={`/dashboard/product/edit/${product.id}`}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Edit</span>
          <span className="sr-only sm:hidden">Edit {product.name}</span>
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`More actions for ${product.name}`}>
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {product.isActive && (
            <DropdownMenuItem asChild>
              <a href={`/${product.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" /> View in store
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600 focus:text-red-700">
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function ProductManagement() {
  const [params, setParams] = useListParams(DEFAULTS);
  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebounce(search.trim(), 400);

  const [data, setData] = useState({ products: [], total: 0, totalPages: 1, counts: {} });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (debouncedSearch !== params.q) setParams({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCategories(Array.isArray(d) ? d : d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    const q = new URLSearchParams({ page: params.page, limit: PAGE_SIZE, sortBy: params.sort });
    if (params.q) q.set("search", params.q);
    if (params.category !== "all") q.set("categoryId", params.category);
    if (params.placement !== "all") q.set(params.placement, "true");
    if (params.tab === "active") q.set("isActive", "true");
    if (params.tab === "hidden") q.set("isActive", "false");
    if (params.tab === "low" || params.tab === "out") q.set("stock", params.tab);

    setLoading(true);
    fetch(`/api/admin/product?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load products."))))
      .then((d) => {
        if (!active) return;
        setData({ products: d.products, total: d.total, totalPages: d.totalPages || 1, counts: d.counts || {} });
        setError(null);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.page, params.q, params.category, params.placement, params.tab, params.sort, reloadKey]);

  const toggleLive = async (product, isActive) => {
    setToggling(product.id);
    // Optimistic: flip it now, roll back on failure.
    setData((d) => ({ ...d, products: d.products.map((p) => (p.id === product.id ? { ...p, isActive } : p)) }));
    try {
      const res = await fetch("/api/admin/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, flags: { isActive } }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not update the product.");
      toast.success(isActive ? `${product.name} is live in the store.` : `${product.name} is hidden from the store.`);
      setReloadKey((k) => k + 1); // refresh tab counts
    } catch (e) {
      setData((d) => ({ ...d, products: d.products.map((p) => (p.id === product.id ? { ...p, isActive: !isActive } : p)) }));
      toast.error(e.message);
    } finally {
      setToggling(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDelete.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not delete the product.");
      toast.success(`${toDelete.name} deleted.`);
      setToDelete(null);
      if (data.products.length === 1 && params.page > 1) setParams({ page: params.page - 1 });
      else setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const tabs = TABS.map((t) => ({ ...t, count: data.counts[t.value] }));
  const filtersActive = params.q || params.category !== "all" || params.placement !== "all";

  const liveSwitch = (product) => (
    <Switch
      checked={product.isActive}
      disabled={toggling === product.id}
      onCheckedChange={(v) => toggleLive(product, v)}
      aria-label={`${product.name} visible in store`}
    />
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <AdminPageHeader
        title="Products"
        description="Manage your catalogue, prices, stock and what shows in the store."
        actions={
          <Button asChild className="gap-2">
            <Link href="/dashboard/product/add">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add product
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="space-y-4 border-b border-gray-100 p-4">
          <StatusTabs label="Product filter" tabs={tabs} value={params.tab} onChange={(tab) => setParams({ tab })} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or URL slug"
                aria-label="Search products"
                className="pl-9"
              />
            </div>
            <Select value={params.category} onValueChange={(category) => setParams({ category })}>
              <SelectTrigger className="w-full" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={params.placement} onValueChange={(placement) => setParams({ placement })}>
              <SelectTrigger className="w-full" aria-label="Store placement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any placement</SelectItem>
                {Object.entries(PLACEMENTS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={params.sort} onValueChange={(sort) => setParams({ sort })}>
              <SelectTrigger className="w-full" aria-label="Sort products">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORTS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-600"
              onClick={() => {
                setSearch("");
                setParams({ q: "", category: "all", placement: "all" });
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" /> Clear filters
            </Button>
          )}
        </div>

        <ListState
          loading={loading && !data.products.length}
          error={error}
          onRetry={() => setReloadKey((k) => k + 1)}
          empty={!loading && !error && data.products.length === 0}
          emptyTitle={filtersActive || params.tab !== "all" ? "No products match these filters" : "No products yet"}
          emptyHint={filtersActive ? "Try a different search or clear the filters." : undefined}
          action={
            !filtersActive && params.tab === "all" ? (
              <Button asChild>
                <Link href="/dashboard/product/add">Add your first product</Link>
              </Button>
            ) : null
          }
        />

        {!error && data.products.length > 0 && (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Product</th>
                  <th scope="col" className="hidden px-4 py-3 lg:table-cell">Category</th>
                  <th scope="col" className="px-4 py-3">Price</th>
                  <th scope="col" className="px-4 py-3">Stock</th>
                  <th scope="col" className="hidden px-4 py-3 xl:table-cell">Views</th>
                  <th scope="col" className="px-4 py-3">Live</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50/70 ${product.isActive ? "" : "bg-gray-50/50"}`}>
                    <td className="max-w-md px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb product={product} />
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/product/edit/${product.id}`}
                            className="line-clamp-1 font-medium text-gray-900 hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <p className="truncate text-xs text-gray-500">/{product.slug}</p>
                          {!product.isActive && <p className="text-xs font-medium text-gray-500">Hidden from store</p>}
                          <Placements product={product} />
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{product.category?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <PriceCell product={product} />
                    </td>
                    <td className="px-4 py-3">
                      <StockCell amount={product.stockAmount} />
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums text-gray-600 xl:table-cell">{Math.round(product.views || 0)}</td>
                    <td className="px-4 py-3">{liveSwitch(product)}</td>
                    <td className="px-4 py-3">
                      <RowActions product={product} onDelete={setToDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-gray-100 md:hidden">
              {data.products.map((product) => (
                <li key={product.id} className="flex gap-3 p-4">
                  <Thumb product={product} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/product/edit/${product.id}`} className="line-clamp-2 text-sm font-medium text-gray-900">
                      {product.name}
                    </Link>
                    <p className="text-xs text-gray-500">{product.category?.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <PriceCell product={product} />
                      <StockCell amount={product.stockAmount} withLabel />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        {liveSwitch(product)}
                        {product.isActive ? "Live" : "Hidden"}
                      </label>
                      <RowActions product={product} onDelete={setToDelete} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <ListPagination
              page={params.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={PAGE_SIZE}
              noun="products"
              onPage={(page) => setParams({ page })}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.name ?? "product"}?`}
        description="This permanently removes the product and its images. Products that have orders can't be deleted — hide them instead."
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
