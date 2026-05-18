"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Loader2 } from "lucide-react";
import Image from "next/image";
import useWishlistStore from "@/lib/wishlistStore";
import { useCartWithSession } from "@/lib/cartStore";

const WishlistPage = () => {
  const [loadingItem, setLoadingItem] = useState(null);

  const wishlist = useWishlistStore((state) => state.wishlist);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const error = useWishlistStore((state) => state.error);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isAddingAllToCart = useWishlistStore(
    (state) => state.isAddingAllToCart
  );
  const setIsAddingAllToCart = useWishlistStore(
    (state) => state.setIsAddingAllToCart
  );

  const { addToCart } = useCartWithSession();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleAddToCart = async (item) => {
    setLoadingItem(item.id);
    try {
      await addToCart(item.id, 1, item.selectedSize, item.selectedColor);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoadingItem(null);
    }
  };

  const handleAddAllToCart = async () => {
    if (wishlist.length === 0 || wishlist.every((item) => item.isOutOfStock))
      return;

    setIsAddingAllToCart(true);

    const itemsToRemove = [];

    try {
      for (const item of wishlist) {
        if (!item.isOutOfStock) {
          await addToCart(item.id, 1, item.selectedSize, item.selectedColor);
          itemsToRemove.push(item);
        }
      }

      for (const item of itemsToRemove) {
        await toggleWishlist(item, true);
      }
    } catch (error) {
      console.error("Error adding all to cart:", error);
    } finally {
      setIsAddingAllToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg font-medium">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 sm:mb-12 flex-wrap gap-4">
          <div className="flex items-end">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Your Wishlist
            </h1>
            <span className="text-gray-500 font-normal text-sm sm:text-xl ml-2 sm:ml-4">
              ({wishlist.length} items)
            </span>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              className="rounded-full h-10 sm:h-11 px-6 sm:px-7 font-medium border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm transition-all"
            >
              Continue Shopping
            </Button>
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 sm:p-20 bg-white rounded-2xl shadow-lg text-center">
            <p className="text-lg sm:text-xl text-gray-600 font-medium mb-4">
              Your wishlist is empty.
            </p>
            <Link href="/">
              <Button className="rounded-full h-12 px-8 font-semibold bg-primary hover:bg-primary/90 text-white transition-colors shadow-lg">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-4">
              {wishlist.map((item) => {
                const isOutOfStock = item.isOutOfStock || false;
                const isItemLoading = loadingItem === item.id;

                return (
                  <Card
                    key={item.id}
                    className={`flex flex-col sm:flex-row p-4 items-start sm:items-center rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-lg bg-white relative ${
                      isOutOfStock ? "opacity-80" : ""
                    }`}
                  >
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center pointer-events-none z-10">
                        <span className="text-xl font-bold text-red-600 border-2 border-red-600 px-4 py-1 rounded-full bg-white shadow-xl transform rotate-[-5deg]">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}

                    <div className="relative h-20 w-20 flex-shrink-0 mb-4 sm:mb-0 mr-4 sm:mr-6 bg-gray-100 rounded-xl flex items-center justify-center">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain rounded-xl"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">No Image</span>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center w-full">
                      <div className="flex-grow mb-4 sm:mb-0">
                        <h2 className="font-semibold text-base text-gray-800 mb-1 leading-tight">
                          {item.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          ৳{item.price.toLocaleString("en-BD")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 sm:ml-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors rounded-full"
                          onClick={() => toggleWishlist(item, true)}
                          disabled={isItemLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {isOutOfStock ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={true}
                            className="h-8 rounded-full border-red-500 text-red-500 bg-red-50 cursor-not-allowed px-4 text-xs font-semibold"
                          >
                            Out of Stock
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 transition-colors text-white"
                            onClick={() => handleAddToCart(item)}
                            disabled={isItemLoading}
                          >
                            {isItemLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white p-6 sm:p-8">
                <Button
                  className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-full font-semibold bg-primary hover:bg-primary/90 text-white transition-colors shadow-lg"
                  onClick={handleAddAllToCart}
                  disabled={
                    isAddingAllToCart ||
                    wishlist.length === 0 ||
                    wishlist.every((item) => item.isOutOfStock)
                  }
                >
                  {isAddingAllToCart ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Add all to cart"
                  )}
                </Button>
                {wishlist.some((item) => item.isOutOfStock) && (
                  <p className="text-center text-sm text-red-500 mt-3 font-medium">
                    (Skipping{" "}
                    {wishlist.filter((item) => item.isOutOfStock).length} out of
                    stock item(s))
                  </p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
