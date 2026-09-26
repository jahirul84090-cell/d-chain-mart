"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Loader2 } from "lucide-react";
import Image from "next/image";
import useWishlistStore from "@/lib/wishlistStore";
import { useCartWithSession } from "@/lib/cartStore";
import { parseOptions } from "@/lib/product-options";
import { toast } from "react-toastify";

// Products with sizes/colours need the shopper to choose on the product page.
const needsOptions = (item) =>
  parseOptions(item.availableSizes).length > 0 ||
  parseOptions(item.availableColors).length > 0;

const WishlistPage = () => {
  const [loadingItem, setLoadingItem] = useState(null);

  const wishlist = useWishlistStore((state) => state.wishlist);
  const hasLoaded = useWishlistStore((state) => state.hasLoaded);
  const isLoading = !hasLoaded;
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

  // Always show fresh prices and stock when the wishlist page opens.
  useEffect(() => {
    fetchWishlist({ force: true });
  }, [fetchWishlist]);

  const handleAddToCart = async (item) => {
    setLoadingItem(item.id);
    try {
      await addToCart(item.id, 1, null, null);
    } finally {
      setLoadingItem(null);
    }
  };

  const quickAddable = wishlist.filter(
    (item) => !item.isOutOfStock && !needsOptions(item)
  );

  // Adds every item that needs no size/colour choice, then removes those
  // items from the wishlist. Shows one summary message.
  const handleAddAllToCart = async () => {
    if (quickAddable.length === 0) return;
    setIsAddingAllToCart(true);
    let added = 0;
    try {
      for (const item of quickAddable) {
        const ok = await addToCart(item.id, 1, null, null, { silent: true });
        if (ok) {
          added += 1;
          await toggleWishlist(item, true);
        }
      }
    } finally {
      setIsAddingAllToCart(false);
    }
    const skipped = wishlist.length - added;
    if (added > 0) {
      toast.success(
        `${added} item${added === 1 ? "" : "s"} added to cart.` +
          (skipped > 0 ? " Items that need a size or colour stay in your wishlist." : "")
      );
    } else {
      toast.error("Could not add items to your cart.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Loader2 className="animate-spin h-8 w-8 text-primary" aria-hidden="true" />
        <span className="sr-only">Loading your wishlist…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center" role="alert">
        <p className="text-red-600 font-medium">We couldn&apos;t load your wishlist. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="text-gray-900">
      <div>
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
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
                          className="object-contain rounded-xl" sizes="(max-width: 640px) 50vw, 25vw" />
                      ) : (
                        <span className="text-sm text-gray-400">No Image</span>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center w-full">
                      <div className="flex-grow mb-4 sm:mb-0">
                        <h2 className="font-semibold text-base text-gray-800 mb-1 leading-tight">
                          <Link href={`/${item.slug}`} className="hover:text-primary">
                            {item.name}
                          </Link>
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
                          aria-label={`Remove ${item.name} from wishlist`}
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
                        ) : needsOptions(item) ? (
                          <Link href={`/${item.slug}`}>
                            <Button size="sm" variant="outline" className="h-8 rounded-full px-4 text-xs font-semibold">
                              Choose options
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 transition-colors text-white"
                            onClick={() => handleAddToCart(item)}
                            disabled={isItemLoading}
                            aria-label={`Add ${item.name} to cart`}
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

            <div className="xl:col-span-1">
              <Card className="rounded-2xl shadow-lg border border-gray-200 bg-white p-6 sm:p-8">
                <Button
                  className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-full font-semibold bg-primary hover:bg-primary/90 text-white transition-colors shadow-lg"
                  onClick={handleAddAllToCart}
                  disabled={isAddingAllToCart || quickAddable.length === 0}
                >
                  {isAddingAllToCart ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Add all to cart"
                  )}
                </Button>
                {quickAddable.length < wishlist.length && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    {wishlist.length - quickAddable.length} item(s) are out of
                    stock or need a size/colour and will stay in your wishlist.
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
