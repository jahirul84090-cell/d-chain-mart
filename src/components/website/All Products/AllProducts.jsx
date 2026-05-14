"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  XCircle,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebounce } from "@/lib/useDebounce";
import { useCartWithSession } from "@/lib/cartStore";
import useWishlistStore from "@/lib/wishlistStore";

import MergedProductCard from "@/components/productCard/MargedProductCard";

const ProductSkeleton = ({ viewMode }) => (
  <div
    className={`rounded-2xl overflow-hidden shadow-lg border-gray-100 animate-pulse ${
      viewMode === "list"
        ? "flex flex-col sm:flex-row items-center p-4"
        : "flex flex-col"
    }`}
  >
    <div
      className={`bg-gray-200 ${
        viewMode === "list"
          ? "w-full sm:w-32 h-48 sm:h-32 mb-4 sm:mb-0 sm:mr-4 flex-shrink-0 rounded-lg"
          : "w-full h-48"
      }`}
    />
    <div
      className={`p-4 ${
        viewMode === "list"
          ? "flex-1 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:gap-4"
          : "flex-1"
      }`}
    >
      <div className={viewMode === "list" ? "col-span-2 sm:col-span-1" : ""}>
        <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-1" />
        <div className="h-4 bg-gray-200 rounded-md w-1/3 mt-2" />
      </div>
      <div
        className={`mt-2 ${
          viewMode === "list" ? "flex flex-col items-start sm:items-end" : ""
        }`}
      >
        <div className="h-6 bg-gray-200 rounded-md w-1/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded-md w-1/3" />
        <div className="h-10 bg-gray-200 rounded-lg w-full mt-4" />
      </div>
    </div>
  </div>
);

const FilterSidebar = ({
  displayPriceRange,
  handlePriceRangeChange,
  minRating,
  setMinRating,
  categories,
  selectedCategories,
  handleCategoryToggle,
}) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <h2 className="text-xl font-bold mb-4 text-gray-800">Filter by Price</h2>
    <div className="space-y-4">
      <Slider
        defaultValue={displayPriceRange}
        max={10000}
        step={10}
        onValueChange={handlePriceRangeChange}
        // Theme color usage: bg-primary
        className="[&_[data-radix-slider-track]]:bg-gray-200 [&_[data-radix-slider-range]]:bg-primary [&_[data-radix-slider-thumb]]:bg-primary"
      />
      <div className="flex justify-between items-center text-gray-600 text-sm">
        {/* Currency change */}
        <span>Tk {displayPriceRange[0]}</span>
        <span>Tk {displayPriceRange[1]}</span>
      </div>
    </div>

    <hr className="my-6 border-gray-200" />

    <h2 className="text-xl font-bold mb-4 text-gray-800">Filter by Rating</h2>
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => (
        <div key={rating} className="flex items-center">
          <input
            type="radio"
            id={`rating-${rating}`}
            name="rating-filter"
            checked={minRating === rating}
            onChange={() => setMinRating(rating)}
            // Theme color usage
            className="h-4 w-4 text-primary rounded-full border-gray-300 focus:ring-primary"
          />
          <Label
            htmlFor={`rating-${rating}`}
            className="ml-2 flex items-center text-gray-700 cursor-pointer"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className={`h-4 w-4 ${
                  i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
            <span className="ml-2">{rating} Stars & Up</span>
          </Label>
        </div>
      ))}
    </div>

    <hr className="my-6 border-gray-200" />

    <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
    <ul className="space-y-2">
      {categories.map((category) => (
        <li key={category.id} className="flex items-center">
          <input
            type="checkbox"
            id={category.id}
            checked={selectedCategories.includes(category.id)}
            onChange={() => handleCategoryToggle(category.id)}
            // Theme color usage
            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
          />
          <Label
            htmlFor={category.id}
            className="ml-2 text-gray-700 cursor-pointer"
          >
            {category.name}
          </Label>
        </li>
      ))}
    </ul>
  </div>
);

export default function AllProducts() {
  const searchParams = useSearchParams();

  const [displayPriceRange, setDisplayPriceRange] = useState([0, 10000]);
  const debouncedPriceRange = useDebounce(displayPriceRange, 300);

  const [minRating, setMinRating] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selections, setSelections] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);

  const { addToCart, cartItems, updateCartItemQuantity } = useCartWithSession();
  const { wishlist, fetchWishlist, toggleWishlist } = useWishlistStore();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const handlePriceRangeChange = useCallback((value) => {
    setDisplayPriceRange(value);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data.categories);

        if (!hasInitialized) {
          const urlCategoryId = searchParams.get("categoryId");
          if (
            urlCategoryId &&
            data.categories.some((cat) => cat.id === urlCategoryId)
          ) {
            setSelectedCategories([urlCategoryId]);
          }
          setDisplayPriceRange([0, 10000]);
          setHasInitialized(true);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, [searchParams, hasInitialized]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const [minPrice, maxPrice] = debouncedPriceRange;

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        minPrice,
        maxPrice,
        minRating,
        page: currentPage,
        sortBy: sortOption,
      });

      // This is the correct client-side way to pass multiple IDs
      selectedCategories.forEach((catId) => params.append("categoryId", catId));

      try {
        const response = await fetch(
          `/api/admin/product?${params.toString()}&isActive=true`
        );
        const data = await response.json();

        if (response.ok) {
          setProducts(data.products);
          setTotalProducts(data.total);
          setTotalPages(data.totalPages);

          setSelections((prev) => {
            const newSelections = { ...prev };
            data.products.forEach((product) => {
              if (!newSelections[product.id]) {
                newSelections[product.id] = {
                  selectedSize: product.availableSizes
                    ? product.availableSizes.split(",")[0]
                    : null,
                  selectedColor: product.availableColors
                    ? product.availableColors.split(",")[0]
                    : null,
                };
              }
            });
            return newSelections;
          });
        } else {
          setProducts([]);
        }
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (hasInitialized) {
      fetchProducts();
    }
  }, [
    debouncedSearchQuery,
    debouncedPriceRange,
    minRating,
    selectedCategories,
    currentPage,
    sortOption,
    hasInitialized,
  ]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setDisplayPriceRange([0, 10000]);
    setMinRating(0);
    setSelectedCategories([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSelectionChange = (productId, field, value) => {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const currentCategoryNames = useMemo(
    () =>
      categories
        .filter((cat) => selectedCategories.includes(cat.id))
        .map((cat) => cat.name),
    [categories, selectedCategories]
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <Button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          className="rounded-full"
        >
          Previous
        </Button>
        {pageNumbers.map((number) => (
          <Button
            key={number}
            onClick={() => setCurrentPage(number)}
            variant={currentPage === number ? "default" : "outline"}
            className={`rounded-full ${
              currentPage === number
                ? "bg-primary text-white hover:bg-primary"
                : "border-gray-300"
            }`}
          >
            {number}
          </Button>
        ))}
        <Button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          className="rounded-full"
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Comprehensive Product Catalog
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore a curated selection of products with advanced filtering and
            sorting capabilities.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 hidden lg:block">
            <FilterSidebar
              displayPriceRange={displayPriceRange}
              handlePriceRangeChange={handlePriceRangeChange}
              minRating={minRating}
              setMinRating={setMinRating}
              categories={categories}
              selectedCategories={selectedCategories}
              handleCategoryToggle={handleCategoryToggle}
            />
          </aside>

          <div className="lg:w-3/4">
            <div className="lg:hidden flex justify-end mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 border-gray-300"
                  >
                    <Filter className="h-4 w-4 text-gray-700" />
                    <span className="text-gray-700">Filter</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-full sm:max-w-xs p-0 flex flex-col"
                >
                  <SheetHeader className="p-4 border-b border-gray-200">
                    <SheetTitle className="text-xl font-semibold">
                      Product Filters
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-0 p-4 overflow-y-auto h-full">
                    <FilterSidebar
                      displayPriceRange={displayPriceRange}
                      handlePriceRangeChange={handlePriceRangeChange}
                      minRating={minRating}
                      setMinRating={setMinRating}
                      categories={categories}
                      selectedCategories={selectedCategories}
                      handleCategoryToggle={handleCategoryToggle}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="relative flex-1 w-full sm:w-auto mb-4 sm:mb-0 sm:mr-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus-visible:ring-primary"
                />
              </div>
              <div className="flex flex-wrap items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Label htmlFor="sort-select">Sort by</Label>
                  <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) => {
                      setSortOption(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-md p-1 pr-6 focus:ring-primary focus:border-primary"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="oldest">Oldest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Label>View</Label>
                  <Button
                    size="icon"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    className={
                      viewMode === "grid"
                        ? ""
                        : "text-gray-500 hover:text-primary"
                    }
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    className={
                      viewMode === "list"
                        ? ""
                        : "text-gray-500 hover:text-primary"
                    }
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {(currentCategoryNames.length > 0 ||
              searchQuery ||
              minRating > 0) && (
              <div className="flex items-center flex-wrap gap-2 mb-4">
                <span className="text-gray-700 font-semibold">
                  Active Filters:
                </span>
                {currentCategoryNames.map((catName) => (
                  <Badge
                    key={catName}
                    variant="secondary"
                    // Theme color usage
                    className="bg-primary/10 text-primary rounded-full py-1 px-3"
                  >
                    {catName}
                    <Button
                      onClick={() =>
                        handleCategoryToggle(
                          categories.find((c) => c.name === catName)?.id
                        )
                      }
                      variant="ghost"
                      size="icon"
                      // Theme color usage
                      className="h-4 w-4 ml-2 text-primary rounded-full hover:bg-primary/20"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {minRating > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-700 rounded-full py-1 px-3"
                  >
                    {minRating} Stars & Up
                    <Button
                      onClick={() => setMinRating(0)}
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-2 text-yellow-700 rounded-full hover:bg-yellow-200"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 rounded-full py-1 px-3"
                  >
                    Search: "{searchQuery}"
                    <Button
                      onClick={() => setSearchQuery("")}
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-2 text-blue-700 rounded-full hover:bg-blue-200"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                <Button
                  onClick={handleClearFilters}
                  variant="link"
                  // Theme color usage
                  className="text-primary hover:text-primary/80 transition-colors p-0 h-auto font-medium"
                >
                  Clear All
                </Button>
              </div>
            )}

            {loading ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
                <SearchX className="h-24 w-24 text-gray-400 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  No Products Found
                </h2>
                <p className="text-gray-600 mb-6">
                  Your current filters or search criteria did not match any
                  products.
                </p>
                <Button
                  onClick={handleClearFilters}
                  // Theme color usage
                  className="bg-primary hover:bg-primary/80 text-white font-medium rounded-lg"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4 font-medium">
                  Showing {products.length} of {totalProducts} products
                </p>
                <div
                  className={`grid gap-6 ${
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      : "grid-cols-1"
                  }`}
                >
                  {products.map((product) => (
                    <MergedProductCard
                      key={product.id}
                      product={product}
                      selections={selections[product.id]}
                      onSelectionChange={(field, value) =>
                        handleSelectionChange(product.id, field, value)
                      }
                      isWishlisted={wishlist.some(
                        (item) => item.productId === product.id
                      )}
                      onToggleWishlist={() => toggleWishlist(product.id)}
                      onAddToCart={(quantity = 1) =>
                        addToCart(
                          {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            imageUrl: product.imageUrls
                              ? product.imageUrls.split(",")[0]
                              : null,
                            size: selections[product.id]?.selectedSize,
                            color: selections[product.id]?.selectedColor,
                          },
                          quantity
                        )
                      }
                      tags="NEW"
                      buttonText="Add to Cart"
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </>
            )}
            {renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
}
