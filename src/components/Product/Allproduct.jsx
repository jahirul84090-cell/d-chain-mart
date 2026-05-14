// app/products/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import useCartStore from "@/lib/cartStore";
import ProductCard from "./ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { initializeCart } = useCartStore();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search });
      const response = await fetch(`/api/admin/product?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  return (
    <div className="container mx-auto p-6 max-w-7xl bg-gray-100 min-h-screen">
      <Card className="shadow-2xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-600 p-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">
            Our Products
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="mb-6">
            <Input
              placeholder="Search by product name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
            />
          </div>
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : products.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No products found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
