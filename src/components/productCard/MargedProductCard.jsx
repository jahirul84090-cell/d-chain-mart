"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { ShoppingCart, Heart, Eye, Ban, CheckCircle, Star } from "lucide-react";
import { QuickViewModal } from "./QuickViewModal";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useSession } from "next-auth/react"; // Import NextAuth session
import useWishlistStore from "@/lib/wishlistStore"; // DIRECT IMPORT of your store

// Custom Hook to manage Wishlist State & Authentication
const useProductWishlist = () => {
  const { status } = useSession();
  const store = useWishlistStore();

  // Initialize flag to prevent repeated fetching
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only fetch if authenticated and not yet initialized
    if (status === "authenticated" && !initialized) {
      store.fetchWishlist();
      setInitialized(true);
    }
    // Reset initialization state if user logs out
    if (status === "unauthenticated" && initialized) {
      setInitialized(false);
    }
  }, [status, initialized, store]);

  // Return the store's state and actions
  return store;
};

// Helper function for rating average
const calculateAverageRating = (reviews) => {
  if (!reviews?.length) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return total / reviews.length;
};

const MergedProductCard = ({
  product,
  tags,
  buttonText = "Add to Cart",
  isSlider = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isSoldOut = product.stockAmount <= 0;

  // --- WISHLIST INTEGRATION using the new local hook ---
  const { wishlist, toggleWishlist, isToggling } = useProductWishlist();

  const isProductInWishlist = wishlist.some(
    (item) => item.id === product.id || item.slug === product.slug
  );

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };
  // ---------------------------------------------------

  const averageRating = calculateAverageRating(product.reviews);
  const reviewCount = product.reviews?.length || 0;
  const stockPercentage =
    product.stockAmount > 0
      ? (product.totalSales / product.stockAmount) * 100
      : 0;

  // Embla Carousel
  const autoplayOptions = useRef({ delay: 3000, stopOnInteraction: false });
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay(autoplayOptions.current),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onInit = useCallback(
    (embla) => setScrollSnaps(embla.scrollSnapList()),
    []
  );
  const onSelect = useCallback(
    (embla) => setSelectedIndex(embla.selectedScrollSnap()),
    []
  );

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onInit);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onInit);
    };
  }, [emblaApi, onInit, onSelect]);

  const scrollTo = useCallback(
    (index) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const heartIconClasses = isProductInWishlist
    ? "fill-red-500 text-red-500 hover:text-red-600 dark:text-red-500 dark:hover:text-red-600"
    : "text-gray-500 hover:text-primary dark:text-white dark:hover:text-primary";

  return (
    <>
      <div
        className={`${
          isSlider
            ? "flex-none w-[calc(80%-1rem)] sm:w-[calc(40%-1rem)] md:w-[calc(25%-1rem)] lg:w-[calc(20%-1rem)] xl:w-[calc(20%-1rem)] m-2 bg-white rounded-lg shadow-md border border-gray-200 grid grid-rows-[auto,1fr,auto] transition-all duration-300 group hover:shadow-xl dark:bg-gray-800 dark:border-gray-700"
            : "relative flex flex-col w-full overflow-hidden rounded-lg shadow-lg border border-gray-200 transition-all duration-300 group hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 h-auto"
        }`}
      >
        {/* Image Section */}
        {isSlider ? (
          <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
            <Image
              src={
                product.mainImage ||
                product?.images?.[0]?.url ||
                "https://placehold.co/400x300/E5E7EB/A2A9B0?text=No+Image"
              }
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 80vw, (max-width: 768px) 40vw, (max-width: 1024px) 25vw, 20vw"
            />

            {/* Tags */}
            <div className="absolute top-0 left-0 w-full flex justify-between p-2 z-10">
              {tags && (
                <div className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-md">
                  {tags}
                </div>
              )}
              {product.discount > 0 && (
                <div className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-md">
                  -{product.discount}%
                </div>
              )}
            </div>

            {/* Hover Actions */}
            <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 ease-out z-20">
              <div className="flex flex-col items-center gap-3 bg-white rounded-md p-2 shadow-xl backdrop-blur-sm border border-gray-200 dark:bg-gray-700/80 dark:border-gray-600">
                <button
                  aria-label="Wishlist"
                  className="p-2"
                  onClick={handleToggleWishlist}
                  disabled={isToggling}
                >
                  <Heart
                    className={`w-5 h-5 cursor-pointer transition-colors ${
                      isToggling ? "animate-pulse" : heartIconClasses
                    }`}
                  />
                </button>
                <button
                  aria-label="Quick View"
                  className="p-2 "
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Eye className="w-5 h-5 hover:text-primary cursor-pointer transition-colors dark:text-white dark:hover:text-primary" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-48 overflow-hidden rounded-t-md">
            <div className="embla h-full" ref={emblaRef}>
              <div className="embla__container flex h-full">
                {(product.images || []).map((image, index) => (
                  <div
                    key={index}
                    className="embla__slide relative flex-[0_0_100%] h-full"
                  >
                    <Image
                      src={
                        image.url ||
                        "https://placehold.co/400x300/E5E7EB/A2A9B0?text=No+Image"
                      }
                      alt={product.name}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 80vw, (max-width: 768px) 40vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            {scrollSnaps.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(index);
                    }}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      index === selectedIndex
                        ? "bg-primary scale-110"
                        : "bg-gray-400 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="absolute top-0 left-0 w-full flex justify-between p-2 z-20">
              {tags && (
                <div className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-md">
                  {tags}
                </div>
              )}
              {product.discount > 0 && (
                <div className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-md">
                  -{product.discount}%
                </div>
              )}
            </div>

            {/* Hover Icons */}
            <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 ease-out z-30">
              <div className="flex flex-col items-center gap-3 bg-white rounded-md p-2 shadow-xl backdrop-blur-sm border border-gray-200 dark:bg-gray-700/80 dark:border-gray-600">
                <button
                  aria-label="Wishlist"
                  className="p-1"
                  onClick={handleToggleWishlist}
                  disabled={isToggling}
                >
                  <Heart
                    className={`w-5 h-5 cursor-pointer transition-colors ${
                      isToggling ? "animate-pulse" : heartIconClasses
                    }`}
                  />
                </button>
                <button
                  aria-label="Quick View"
                  className="p-1"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDialogOpen(true);
                  }}
                >
                  <Eye className="w-5 h-5 cursor-pointer hover:text-primary transition-colors dark:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 flex flex-col justify-between space-y-2">
          <Link href={`/${product.slug}`} className="block">
            <CardTitle className="text-sm font-semibold line-clamp-2 h-10 dark:text-white">
              {product.name}
            </CardTitle>
            {!isSlider && (
              <>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-0.5 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(averageRating)
                            ? "fill-current"
                            : "text-gray-300 dark:text-gray-500"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              </>
            )}

            <div className="mt-2 text-sm flex items-center space-x-1 dark:text-gray-400">
              {isSoldOut ? (
                <>
                  <Ban className="h-4 w-4 text-red-500" />
                  <p className="font-semibold text-red-500">Out of Stock</p>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="font-semibold text-green-600">In Stock</p>
                </>
              )}
            </div>
          </Link>

          {/* Price */}
          <div className="flex items-baseline space-x-2">
            <span className="text-base text-primary font-bold">
              <span className="text-xl font-bold">৳ </span>
              {product.price.toLocaleString("en-BD")}
            </span>
            {product.oldPrice > 0 && (
              <span className="text-sm line-through dark:text-gray-400">
                {product.oldPrice.toLocaleString("en-BD")}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 pt-0 space-y-3">
          {!isSlider && (
            <>
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(stockPercentage, 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 font-semibold dark:text-gray-400">
                  <span>Sold: {product.totalSales || 0}</span>
                  <span>Total Stock: {product.stockAmount || 0}</span>
                </div>
              </div>
            </>
          )}

          {isSoldOut ? (
            <Button
              disabled
              className="w-full py-5 bg-gray-400 cursor-not-allowed"
            >
              Out of Stock
            </Button>
          ) : (
            <Link href={`/${product.slug}`} passHref>
              <Button className="group relative w-full rounded-sm overflow-hidden transition-all duration-300 hover:bg-primary/80 cursor-pointer py-5 flex items-center justify-center">
                <span className="inline-block uppercase font-semibold text-sm transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:opacity-0">
                  {buttonText}
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-6 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <ShoppingCart className="w-5 h-5" />
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
};

export default MergedProductCard;
