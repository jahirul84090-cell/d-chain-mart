// app/admin/products/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [search, setSearch] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isSlider, setIsSlider] = useState(false);
  const [isActive, setIsActive] = useState(false); // New state for isActive filter
  const [categoryId, setCategoryId] = useState("all");
  const [sortByStock, setSortByStock] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const { categories } = await response.json();
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to fetch categories");
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    search,
    isFeatured,
    isPopular,
    isNewArrival,
    isSlider,
    isActive, // New dependency
    categoryId,
    sortByStock,
    currentPage,
  ]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        ...(isFeatured && { isFeatured: true }),
        ...(isPopular && { isPopular: true }),
        ...(isNewArrival && { isNewArrival: true }),
        ...(isSlider && { isSlider: true }),
        ...(isActive && { isActive: true }), // Add isActive filter
        ...(categoryId !== "all" && { categoryId }),
        sortByStock,
        page: currentPage,
        limit: itemsPerPage,
      }).toString();
      const response = await fetch(`/api/admin/product?${query}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const {
        products,
        total,
        totalPages,
        currentPage: serverPage,
      } = await response.json();
      setProducts(products);
      setTotalItems(total);
      setTotalPages(totalPages);
      setCurrentPage(serverPage);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
      setLoading(false);
    }
  }

  async function handleDeleteProduct(productId) {
    setDeletingProductId(productId);
    try {
      const response = await fetch("/api/admin/product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      });
      if (response.ok) {
        setProducts(products.filter((prod) => prod.id !== productId));
        setTotalItems((prev) => prev - 1);
        if (products.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          fetchProducts(); // Refresh to handle pagination
        }
        toast.success("Product deleted successfully");
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setDeletingProductId(null);
    }
  }

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl bg-gray-100 min-h-screen font-sans text-gray-800">
      <Card className="shadow-lg border border-gray-200 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-white p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-wide text-gray-900">
              Product Management 📦
            </CardTitle>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md"
              onClick={() => router.push("/dashboard/product/add")}
            >
              <Plus className="h-5 w-5 mr-2" /> Add New Product
            </Button>
          </div>
          <div className="mt-6 md:mt-8 flex flex-col space-y-4 bg-gray-50 rounded-xl p-4 md:p-6 shadow-inner border border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name..."
                className="pl-12 pr-4 py-3 md:py-4 border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white text-gray-800 font-medium shadow-sm transition-all duration-300 w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isFeatured"
                  className="text-gray-600 font-medium text-sm"
                >
                  Featured
                </Label>
                <Switch
                  id="isFeatured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isPopular"
                  className="text-gray-600 font-medium text-sm"
                >
                  Popular
                </Label>
                <Switch
                  id="isPopular"
                  checked={isPopular}
                  onCheckedChange={setIsPopular}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isNewArrival"
                  className="text-gray-600 font-medium text-sm"
                >
                  New Arrival
                </Label>
                <Switch
                  id="isNewArrival"
                  checked={isNewArrival}
                  onCheckedChange={setIsNewArrival}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isSlider"
                  className="text-gray-600 font-medium text-sm"
                >
                  Slider
                </Label>
                <Switch
                  id="isSlider"
                  checked={isSlider}
                  onCheckedChange={setIsSlider}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
              {/* New filter for isActive */}
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isActive"
                  className="text-gray-600 font-medium text-sm"
                >
                  Active
                </Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="categoryId"
                  className="text-gray-600 font-medium text-sm"
                >
                  Category
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger
                    id="categoryId"
                    className="w-40 md:w-48 border border-gray-300 bg-white text-gray-800 rounded-xl shadow-sm font-medium"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-800 border-gray-300">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  setSortByStock(sortByStock === "asc" ? "desc" : "asc")
                }
                className="text-gray-600 border border-gray-300 hover:bg-gray-200 font-bold rounded-xl transition-all duration-200 shadow-sm"
              >
                Sort Stock {sortByStock === "asc" ? "⬆️" : "⬇️"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-8 bg-white rounded-b-2xl">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-lg bg-gray-200" />
              {[...Array(7)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full rounded-lg bg-gray-200"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-500 py-8 md:py-12 font-semibold text-lg">
              No products found 😔
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 border-b border-gray-200">
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Image
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[150px]">
                        Name
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[150px]">
                        Slug
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Price
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Old Price
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Discount %
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Stock
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[120px]">
                        Category
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Views
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Sales
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Rating
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Images
                      </TableHead>
                      {/* New TableHead for isActive */}
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[80px]">
                        Active
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 text-sm py-4 min-w-[180px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow
                        key={product.id}
                        className={`hover:bg-gray-100 transition-colors duration-150 border-b border-gray-200`}
                      >
                        <TableCell className="py-4">
                          {product.mainImage ? (
                            <Avatar className="h-10 w-10 rounded-lg shadow-md">
                              <AvatarImage
                                src={product.mainImage}
                                alt={`${product.name} image`}
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-lg bg-gray-200 text-gray-600 font-semibold">
                                {product.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="h-10 w-10 rounded-lg shadow-md">
                              <AvatarFallback className="rounded-lg bg-gray-200 text-gray-600 font-semibold">
                                {product.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-800 py-4 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {product.slug}
                        </TableCell>
                        <TableCell className="text-indigo-600 font-bold py-4">
                          ৳{product.price.toLocaleString("en-BD")}
                        </TableCell>
                        {/* New TableCell for Old Price */}
                        <TableCell className="py-4">
                          {product.oldPrice ? (
                            <span className="text-red-500 line-through">
                              ৳{product.oldPrice.toLocaleString("en-BD")}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        {/* New TableCell for Discount */}
                        <TableCell className="py-4 font-semibold text-green-600">
                          {product.discount ? `${product.discount}%` : "-"}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4">
                          {product.stockAmount}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4">
                          {product.category?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4">
                          {product.views || 0}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4">
                          {product.totalSales || 0}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4">
                          {product.rating} ★
                        </TableCell>
                        <TableCell className="text-gray-600 py-4">
                          {product.images.length}
                        </TableCell>
                        {/* New TableCell for isActive status */}
                        <TableCell className="py-4">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${
                              product.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/product/edit/${product.id}`
                                )
                              }
                              className="border-gray-300 bg-white text-gray-600 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-all duration-200"
                              disabled={deletingProductId === product.id}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-400 bg-white text-red-600 hover:bg-red-50 rounded-lg font-medium shadow-sm transition-all duration-200"
                                  disabled={deletingProductId === product.id}
                                >
                                  {deletingProductId === product.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="z-[1000] rounded-lg bg-white text-gray-800 shadow-lg border border-gray-300">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-bold text-gray-900">
                                    Delete Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600 mt-2">
                                    Are you sure you want to delete "
                                    {product.name}"? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-lg border-gray-300 hover:bg-gray-100">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteProduct(product.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all duration-200 text-white"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 md:mt-8 space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-600 font-medium">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-800">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {totalItems}
                  </span>{" "}
                  products
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-300 bg-white text-indigo-600 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-all duration-200"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(page)}
                        className={
                          currentPage === page
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all duration-200"
                            : "border-gray-300 bg-white text-indigo-600 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-all duration-200"
                        }
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-gray-300 bg-white text-indigo-600 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-all duration-200"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
