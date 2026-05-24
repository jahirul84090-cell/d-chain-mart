"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  XCircle,
  SlidersHorizontal,
  Star,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/lib/useDebounce";
import { useCartWithSession } from "@/lib/cartStore";
import useWishlistStore from "@/lib/wishlistStore";
import MergedProductCard from "@/components/productCard/MargedProductCard";

// Max price constant — change if your products go higher
const MAX_PRICE = 200000;

const ProductSkeleton = ({ viewMode }) => (
  <div
    className={cn(
      "rounded-2xl overflow-hidden animate-pulse bg-white border border-border shadow-sm",
      viewMode === "list"
        ? "flex flex-row items-center p-4 gap-5"
        : "flex flex-col"
    )}
  >
    <div
      className={cn(
        "bg-muted",
        viewMode === "list"
          ? "w-32 h-32 rounded-xl flex-shrink-0"
          : "w-full h-52"
      )}
    />
    <div className={cn("flex-1 space-y-3", viewMode === "list" ? "" : "p-4")}>
      <div className="h-4 bg-muted rounded-md w-3/5" />
      <div className="h-3 bg-muted rounded-md w-2/5" />
      <div className="h-3 bg-muted rounded-md w-1/4" />
      <div className="h-10 bg-muted rounded-xl w-full mt-3" />
    </div>
  </div>
);

const StarRow = ({ count }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3.5 w-3.5",
          i < count
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted-foreground/30"
        )}
      />
    ))}
  </div>
);

const FilterPanel = ({
  displayPriceRange,
  handlePriceRangeChange,
  minRating,
  setMinRating,
  categories,
  selectedCategories,
  handleCategoryToggle,
  onClearFilters,
}) => {
  const activeCount = selectedCategories.length + (minRating > 0 ? 1 : 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Reset all
          </button>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
          Price Range
        </p>
        <Slider
          value={displayPriceRange}
          max={MAX_PRICE}
          step={500}
          onValueChange={handlePriceRangeChange}
          className="[&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-md [&_[role=slider]]:bg-background [&_.bg-primary]:bg-primary"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
            ৳ {displayPriceRange[0].toLocaleString()}
          </span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
            ৳ {displayPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
          Categories
        </p>
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryToggle(cat.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                selectedCategories.includes(cat.id)
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/60"
              )}
            >
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => handleCategoryToggle(cat.id)}
                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`cat-${cat.id}`}
                className="cursor-pointer text-sm text-foreground flex-1 leading-none select-none"
              >
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
          Minimum Rating
        </p>
        <RadioGroup
          value={String(minRating)}
          onValueChange={(v) => setMinRating(Number(v))}
          className="space-y-1.5"
        >
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <div
              key={r}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors",
                minRating === r
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/60"
              )}
              onClick={() => setMinRating(r)}
            >
              <RadioGroupItem
                value={String(r)}
                id={`rating-${r}`}
                className="border-primary text-primary"
              />
              <Label
                htmlFor={`rating-${r}`}
                className="cursor-pointer flex items-center gap-2 flex-1"
              >
                {r === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    All ratings
                  </span>
                ) : (
                  <>
                    <StarRow count={r} />
                    <span className="text-xs text-muted-foreground">& up</span>
                  </>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />
    </div>
  );
};

export default function AllProducts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Price range — only apply filter if user has changed from defaults
  const [displayPriceRange, setDisplayPriceRange] = useState([
    Number(searchParams.get("minPrice")) || 0,
    Number(searchParams.get("maxPrice")) || MAX_PRICE,
  ]);
  const debouncedPriceRange = useDebounce(displayPriceRange, 300);

  const [minRating, setMinRating] = useState(
    Number(searchParams.get("minRating")) || 0
  );
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.getAll("categoryId") || []
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortOption, setSortOption] = useState(
    searchParams.get("sort") || "newest"
  );
  const [viewMode, setViewMode] = useState(searchParams.get("view") || "grid");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [hasInitialized, setHasInitialized] = useState(false);

  const { wishlist, fetchWishlist } = useWishlistStore();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const updateUrlParams = useCallback(
    (updates = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((item) => {
            if (item !== "" && item !== null && item !== undefined) {
              params.append(key, String(item));
            }
          });
          return;
        }
        if (
          value === "" ||
          value === null ||
          value === undefined ||
          value === 0 ||
          value === "newest" ||
          value === "grid"
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  const handlePriceRangeChange = useCallback(
    (value) => {
      setDisplayPriceRange(value);
      setCurrentPage(1);
      updateUrlParams({ minPrice: value[0], maxPrice: value[1], page: 1 });
    },
    [updateUrlParams]
  );

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Fetch categories — always unblock product fetch via finally
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCategories(data.categories || []);
        if (!hasInitialized) {
          const urlCategoryIds = searchParams.getAll("categoryId");
          if (urlCategoryIds.length > 0) {
            const validIds = urlCategoryIds.filter((id) =>
              data.categories?.some((c) => c.id === id)
            );
            setSelectedCategories(validIds);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setHasInitialized(true); // always unblock
      }
    }
    fetchCategories();
  }, [searchParams, hasInitialized]);

  // Fetch products — no price filter sent if at defaults
  useEffect(() => {
    if (!hasInitialized) return;

    const fetchProducts = async () => {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        sortBy: sortOption,
        isActive: true,
      });

      // Only send search if not empty
      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);

      // Only send price filter if user changed from defaults
      if (debouncedPriceRange[0] > 0)
        params.set("minPrice", debouncedPriceRange[0]);
      if (debouncedPriceRange[1] < MAX_PRICE)
        params.set("maxPrice", debouncedPriceRange[1]);

      // Only send rating filter if user selected one
      if (minRating > 0) params.set("minRating", minRating);

      // Categories
      selectedCategories.forEach((id) => params.append("categoryId", id));

      try {
        const res = await fetch(`/api/admin/product?${params}`);
        const data = await res.json();
        if (res.ok) {
          setProducts(data.products || []);
          setTotalProducts(data.total || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    debouncedSearchQuery,
    debouncedPriceRange,
    minRating,
    selectedCategories,
    currentPage,
    sortOption,
    hasInitialized,
  ]);

  const handleCategoryToggle = (id) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id];
      updateUrlParams({ categoryId: next, page: 1 });
      return next;
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setDisplayPriceRange([0, MAX_PRICE]);
    setMinRating(0);
    setSelectedCategories([]);
    setSearchQuery("");
    setCurrentPage(1);
    setSortOption("newest");
    router.replace(pathname, { scroll: false });
  };

  const currentCategoryNames = useMemo(
    () =>
      categories
        .filter((c) => selectedCategories.includes(c.id))
        .map((c) => c.name),
    [categories, selectedCategories]
  );

  const activeFilterCount =
    currentCategoryNames.length +
    (minRating > 0 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const visible = pages.filter(
      (page) =>
        page === 1 ||
        page === totalPages ||
        Math.abs(page - currentPage) <= 1
    );
    return (
      <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const next = currentPage - 1;
            setCurrentPage(next);
            updateUrlParams({ page: next });
          }}
          disabled={currentPage === 1}
          className="h-9 w-9 rounded-xl border-border hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {visible.map((page, index) => {
          const prev = visible[index - 1];
          return (
            <span key={page} className="flex items-center gap-1.5">
              {prev && page - prev > 1 && (
                <span className="text-muted-foreground text-sm px-1">…</span>
              )}
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  setCurrentPage(page);
                  updateUrlParams({ page });
                }}
                className={cn(
                  "h-9 w-9 rounded-xl text-sm font-medium transition-all",
                  currentPage === page
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "border-border hover:border-primary hover:text-primary"
                )}
              >
                {page}
              </Button>
            </span>
          );
        })}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const next = currentPage + 1;
            setCurrentPage(next);
            updateUrlParams({ page: next });
          }}
          disabled={currentPage === totalPages}
          className="h-9 w-9 rounded-xl border-border hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5">
            Our Store
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Product Catalog
          </h1>
          <p className="mt-2 text-sm max-w-md leading-relaxed">
            Explore our full collection — filter, sort, and discover exactly
            what you need.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-7">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 bg-white rounded-2xl border border-border shadow-sm p-6 min-h-[60vh]">
              <FilterPanel
                displayPriceRange={displayPriceRange}
                handlePriceRangeChange={handlePriceRangeChange}
                minRating={minRating}
                setMinRating={(value) => {
                  setMinRating(value);
                  setCurrentPage(1);
                  updateUrlParams({ minRating: value, page: 1 });
                }}
                categories={categories}
                selectedCategories={selectedCategories}
                handleCategoryToggle={handleCategoryToggle}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                    updateUrlParams({ q: e.target.value, page: 1 });
                  }}
                  className="pl-9 pr-9 h-10 rounded-xl border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary bg-muted/40 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                      updateUrlParams({ q: "", page: 1 });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="lg:hidden h-10 rounded-xl border-border gap-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 flex flex-col p-0 gap-0">
                  <SheetHeader className="p-5 border-b border-border">
                    <SheetTitle className="text-base font-bold">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-5">
                    <FilterPanel
                      displayPriceRange={displayPriceRange}
                      handlePriceRangeChange={handlePriceRangeChange}
                      minRating={minRating}
                      setMinRating={(value) => {
                        setMinRating(value);
                        setCurrentPage(1);
                        updateUrlParams({ minRating: value, page: 1 });
                      }}
                      categories={categories}
                      selectedCategories={selectedCategories}
                      handleCategoryToggle={handleCategoryToggle}
                      onClearFilters={handleClearFilters}
                    />
                  </div>
                  <SheetFooter className="p-5 border-t border-border">
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      className="w-full rounded-xl h-10 border-border hover:border-destructive hover:text-destructive"
                    >
                      Reset All Filters
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 ml-auto">
                <Select
                  value={sortOption}
                  onValueChange={(value) => {
                    setSortOption(value);
                    setCurrentPage(1);
                    updateUrlParams({ sort: value, page: 1 });
                  }}
                >
                  <SelectTrigger className="h-10 w-48 rounded-xl border-border text-sm focus:ring-1 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low → High</SelectItem>
                    <SelectItem value="price-desc">Price: High → Low</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center bg-muted/60 rounded-xl p-1 gap-0.5 border border-border">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { setViewMode("grid"); updateUrlParams({ view: "grid" }); }}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { setViewMode("list"); updateUrlParams({ view: "list" }); }}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {(currentCategoryNames.length > 0 || minRating > 0 || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Active filters:
                </span>
                {currentCategoryNames.map((name) => (
                  <Badge
                    key={name}
                    className="bg-primary/10 text-primary border border-primary/25 rounded-full px-3 py-1 text-xs font-medium gap-1.5 hover:bg-primary/20 cursor-pointer transition-colors select-none"
                    onClick={() =>
                      handleCategoryToggle(
                        categories.find((c) => c.name === name)?.id
                      )
                    }
                  >
                    {name}
                    <XCircle className="h-3 w-3 flex-shrink-0" />
                  </Badge>
                ))}
                {minRating > 0 && (
                  <Badge
                    className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium gap-1.5 hover:bg-amber-100 cursor-pointer transition-colors select-none"
                    onClick={() => {
                      setMinRating(0);
                      setCurrentPage(1);
                      updateUrlParams({ minRating: 0, page: 1 });
                    }}
                  >
                    {minRating}★ & up
                    <XCircle className="h-3 w-3 flex-shrink-0" />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    className="bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-3 py-1 text-xs font-medium gap-1.5 hover:bg-sky-100 cursor-pointer transition-colors select-none"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                      updateUrlParams({ q: "", page: 1 });
                    }}
                  >
                    "{searchQuery}"
                    <XCircle className="h-3 w-3 flex-shrink-0" />
                  </Badge>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {!loading && products.length > 0 && (
              <p className="text-xs text-muted-foreground font-medium">
                Showing{" "}
                <span className="text-foreground font-semibold">
                  {(currentPage - 1) * products.length + 1}–
                  {Math.min(currentPage * products.length, totalProducts)}
                </span>{" "}
                of{" "}
                <span className="text-foreground font-semibold">
                  {totalProducts}
                </span>{" "}
                products
              </p>
            )}

            {loading ? (
              <div
                className={cn(
                  "grid gap-5",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-border shadow-sm text-center px-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <PackageSearch className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  No Products Found
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                  Try adjusting your filters or search query to find what you're
                  looking for.
                </p>
                <Button
                  onClick={handleClearFilters}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-10 shadow-sm font-medium"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-5",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {products.map((product) => (
                  <MergedProductCard
                    key={product.id}
                    product={product}
                    buttonText="Add to Cart"
                    tags={product.isNewArrival ? "NEW" : undefined}
                  />
                ))}
              </div>
            )}

            {renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
}