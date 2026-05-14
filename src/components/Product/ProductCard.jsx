// components/ProductCard.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart, Heart, Loader2, Plus, Minus } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { useCartWithSession } from "../../lib/cartStore";

export default function ProductCard({ product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  // 🟢 Use the correct hook to access the store with session logic
  const { cartItems, addToCart, updateCartItemQuantity, removeFromCart } =
    useCartWithSession();

  // Find the item in the cart if it exists
  const cartItem = cartItems.find((item) => item.productId === product.id);

  useEffect(() => {
    async function fetchUserAndWishlist() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        try {
          const response = await fetch(`/api/wishlist?productId=${product.id}`);
          if (response.ok) {
            const data = await response.json();
            setIsWishlisted(data.isWishlisted);
          }
        } catch (error) {
          console.error("Error checking wishlist:", error);
        }
      }
    }
    fetchUserAndWishlist();
  }, [product.id]);

  // 🟢 Corrected handlers for cart actions
  const handleAddToCart = () => {
    // Pass the correct parameters as expected by the addToCart action in the store
    const selectedSize = product.availableSizes?.[0] || null;
    const selectedColor = product.availableColors?.[0] || null;
    addToCart(product.id, 1, selectedSize, selectedColor); // Always add 1 item
    toast.success(`${product.name} added to cart!`); // You can also handle toast in the component
  };

  const handleDecreaseQuantity = () => {
    if (cartItem) {
      const newQuantity = cartItem.quantity - 1;
      if (newQuantity <= 0) {
        removeFromCart(cartItem.id); // Use item's unique id for removal
      } else {
        updateCartItemQuantity(cartItem.id, newQuantity); // Use item's unique id for update
      }
    }
  };

  const handleIncreaseQuantity = () => {
    if (cartItem) {
      updateCartItemQuantity(cartItem.id, cartItem.quantity + 1); // Use item's unique id for update
    }
  };

  const handleWishlistToggle = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to manage your wishlist.");
      router.push("/login");
      return;
    }
    setLoadingWishlist(true);
    try {
      const method = isWishlisted ? "DELETE" : "POST";
      const response = await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to update wishlist.");
      }
      setIsWishlisted(!isWishlisted);
      toast.success(
        isWishlisted
          ? `${product.name} removed from wishlist`
          : `${product.name} added to wishlist`
      );
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error(error.message || "Failed to update wishlist.");
    } finally {
      setLoadingWishlist(false);
    }
  }, [isWishlisted, product.id, product.name, router, user]);

  const averageRating = product.reviews?.length
    ? (
        product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length
      ).toFixed(1)
    : null;

  return (
    <Card className="relative shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out rounded-2xl overflow-hidden transform hover:-translate-y-2">
      <CardContent className="flex flex-col sm:flex-row p-0">
        <div className="relative w-full sm:w-1/2 aspect-square overflow-hidden bg-gray-200">
          {product.mainImage ? (
            <Image
              src={product.mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>
        <div className="w-full sm:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {product.shortDescription || "A high-quality product for you."}
            </p>
            <p className="text-2xl font-extrabold text-teal-600 my-2">
              ${product.price.toFixed(2)}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              {averageRating ? (
                <>
                  <span className="text-yellow-400">★</span> {averageRating}
                  <span className="ml-1 text-xs">
                    ({product.reviews.length} reviews)
                  </span>
                </>
              ) : (
                <span className="text-xs">No reviews yet</span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-4">
            {cartItem ? (
              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleDecreaseQuantity}
                  className="p-2 rounded-md"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-lg text-gray-800 w-full text-center">
                  {cartItem.quantity} in Cart
                </span>
                <Button
                  variant="outline"
                  onClick={handleIncreaseQuantity}
                  className="p-2 rounded-md"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAddToCart}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-md font-medium shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleWishlistToggle}
              disabled={loadingWishlist}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors duration-300"
            >
              {loadingWishlist ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              ) : (
                <Heart
                  className={`h-5 w-5 transition-colors duration-300 ${
                    isWishlisted ? "text-red-500 fill-red-500" : "text-gray-400"
                  }`}
                />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
