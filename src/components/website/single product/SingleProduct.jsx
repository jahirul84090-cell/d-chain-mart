"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Star,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  ChevronRight,
  Share,
  Loader2,
  CheckCircle,
  PackageX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageModal from "@/components/others/Imagemodal";
import { useCartWithSession } from "@/lib/cartStore";
import useWishlistStore from "@/lib/wishlistStore";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import ReviewForm from "@/components/others/ReviewFrom";

export default function SingleProductDetail({ productData }) {
  // external stores & session
  const { cartItems, addToCart, updateCartItemQuantity } = useCartWithSession();
  const { wishlist, toggleWishlist, fetchWishlist } = useWishlistStore();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userId = session?.user?.id;

  const hasImages = productData?.images?.length > 0;
  const [selectedImage, setSelectedImage] = useState(
    hasImages ? productData.images[0].url : productData.mainImage
  );
  const [thumbIndex, setThumbIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    (productData?.availableColors?.split(",") || [])[0]?.trim() || null
  );
  const [selectedSize, setSelectedSize] = useState(
    (productData?.availableSizes?.split(",") || [])[0]?.trim() || null
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewsToShow, setReviewsToShow] = useState(5);
  const [activeTab, setActiveTab] = useState("Product Details");

  // helper arrays
  const availableColors = (productData?.availableColors || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const availableSizes = (productData?.availableSizes || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // cart item matching (keeps your scheme)
  const itemIdentifier = `${productData.id}-${selectedSize || "no-size"}-${
    selectedColor || "no-color"
  }`;
  const currentCartItem = cartItems.find((it) => it.id === itemIdentifier);
  const isInCart = !!currentCartItem;
  const isWishlisted = wishlist.some((it) => it.id === productData.id);

  // derived quantity & updating flag (from cart item if available)
  const quantity = currentCartItem?.quantity || 1;
  const isUpdating = currentCartItem?.isUpdating || false;

  // fetch wishlist on login
  useEffect(() => {
    if (isLoggedIn) fetchWishlist();
  }, [isLoggedIn, fetchWishlist]);

  // reviews stats
  const reviewsData = productData?.reviews || [];
  const reviewsCount = reviewsData.length;
  const totalRating = reviewsData.reduce((s, r) => s + (r.rating || 0), 0);
  const averageRating =
    reviewsCount > 0 ? (totalRating / reviewsCount).toFixed(1) : 0;

  // helpers
  const priceFormatted = (n) =>
    typeof n === "number" ? n.toLocaleString("en-BD") : n;
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  // ----- actions (preserve your signatures) -----
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to add to cart.");
      return;
    }
    if (productData.stockAmount <= 0) {
      toast.warn("This product is sold out.");
      return;
    }
    if (availableSizes.length > 0 && !selectedSize) {
      toast.warn("Please select a size.");
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      toast.warn("Please select a color.");
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(productData.id, 1, selectedSize, selectedColor);
    } catch (err) {
      toast.error("Failed to add to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateQuantity = async (newQty) => {
    if (!currentCartItem) return;
    if (newQty < 1) return;
    await updateCartItemQuantity(
      currentCartItem.dbItemId,
      newQty,
      currentCartItem.id
    );
  };

  const handleToggleWishlist = () => {
    if (!isLoggedIn) {
      toast.error("Please log in to add to wishlist.");
      return;
    }
    toggleWishlist(productData, isWishlisted);
    toast.success(
      isWishlisted ? "Item removed from wishlist." : "Item added to wishlist!"
    );
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: productData.name,
          text: productData.shortdescription,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.info("Product URL copied to clipboard.");
      }
    } catch (err) {
      console.error("share failed", err);
      toast.error("Could not share item.");
    }
  };

  const handleLoadMore = () => setReviewsToShow((p) => p + 5);

  const onThumbClick = (url, idx) => {
    if (!url) return;
    setSelectedImage(url);
    setThumbIndex(idx);
  };

  const openImageModal = (images, index = 0) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
    if (images && images[index]) setSelectedImage(images[index]);
  };

  const onOpenGalleryModal = () => {
    setIsImageModalOpen(true);
    setCurrentImageIndex(thumbIndex || 0);
  };

  const addButtonDisabled =
    isAdding ||
    !isLoggedIn ||
    productData.stockAmount <= 0 ||
    (availableSizes.length > 0 && !selectedSize) ||
    (availableColors.length > 0 && !selectedColor);

  const BuyDetails = () => {
    return (
      <>
        <div className=" border rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-medium break-words">
            {productData.name}
          </h1>

          <div className="flex items-center mt-3">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(averageRating)
                      ? "fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-3 text-sm text-gray-600">
              {averageRating} ({reviewsCount})
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <div className="text-3xl lg:text-4xl font-extrabold text-primary">
              ৳ {priceFormatted(productData.price)}
            </div>
            {productData.oldPrice > 0 && (
              <div className="text-sm line-through text-gray-400">
                ৳ {priceFormatted(productData.oldPrice)}
              </div>
            )}
            {productData.discount > 0 && (
              <div className="ml-auto px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                -{productData.discount}%
              </div>
            )}
          </div>

          <div
            className={`inline-flex my-3 items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-colors ${
              productData.stockAmount > 0
                ? "border-transparent bg-green-100 text-green-700" // In Stock: Green Badge
                : "border-transparent bg-red-100 text-red-700" // Out of Stock: Red Badge
            }`}
          >
            {/* Conditional Icon (Lucide-React) */}
            {productData.stockAmount > 0 ? (
              <CheckCircle className="w-4 h-4 mr-1.5" />
            ) : (
              <PackageX className="w-4 h-4 mr-1.5" />
            )}

            {/* Stock Text */}
            <span className="mr-1">Stock:</span>
            <span className="font-bold">
              {productData.stockAmount > 0
                ? `${productData.stockAmount} available`
                : "Out of stock"}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {productData.shortdescription}
          </p>

          {/* variants desktop */}
          {availableColors.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-700">Color</div>
                <div className="text-sm text-gray-400">
                  {selectedColor || "None"}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {availableColors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(color)}
                    className={`w-9 h-9 rounded-full border transition-transform ${
                      selectedColor === color
                        ? "ring-2 ring-primary scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {availableSizes.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-700">Size</div>
                <div className="text-sm text-gray-400">
                  {selectedSize || "None"}
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {availableSizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    className="rounded-full px-4 py-2 text-sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* quantity / add to cart desktop */}
          <div className="mt-6 flex items-center gap-3">
            {productData.stockAmount <= 0 ? (
              <Button disabled className="w-full bg-gray-400 text-white py-3">
                Sold Out
              </Button>
            ) : isInCart ? (
              <div className="flex-1 flex items-center justify-between border rounded-full px-2 py-1">
                <Button
                  onClick={() => handleUpdateQuantity(quantity - 1)}
                  disabled={isUpdating || quantity <= 1}
                  variant="ghost"
                  className="p-1 h-9 w-9"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="text-lg font-semibold w-12 text-center">
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    quantity
                  )}
                </div>
                <Button
                  onClick={() => handleUpdateQuantity(quantity + 1)}
                  disabled={isUpdating || quantity >= productData.stockAmount}
                  variant="ghost"
                  className="p-1 h-9 w-9"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAddToCart}
                disabled={addButtonDisabled}
                className="flex-1 py-4 font-semibold cursor-pointer text-base group relative overflow-hidden"
              >
                {isAdding ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                  </div>
                ) : (
                  <>
                    <span className="inline-block transition-transform group-hover:-translate-y-6 group-hover:opacity-0">
                      Add to Cart
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-6 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <ShoppingCart className="w-5 h-5" />
                    </span>
                  </>
                )}
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={handleToggleWishlist}
                variant="outline"
                size="icon"
                className={isLoggedIn ? "" : "cursor-not-allowed opacity-80"}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? "text-red-500 fill-current" : ""
                  }`}
                />
              </Button>
              <Button onClick={handleShare} variant="outline" size="icon">
                <Share className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {isInCart && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/cart" className="col-span-1">
                <Button variant="outline" className="w-full py-2">
                  Go to Cart
                </Button>
              </Link>
              <Link href="/checkout" className="col-span-1">
                <Button className="w-full py-2">Checkout</Button>
              </Link>
            </div>
          )}

          {!isLoggedIn && (
            <div className="text-center mt-4 text-sm text-gray-500">
              Please log in to add to cart or wishlist.
            </div>
          )}
        </div>
      </>
    );
  };

  const MobilePurchaseCard = () => (
    <div className="lg:hidden mt-6">
      <BuyDetails />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <nav className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1.5 overflow-hidden">
        <Link
          href="/"
          className="hover:text-primary dark:hover:text-primary transition-colors flex-shrink-0"
        >
          Home
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />

        <Link
          href="/allproducts"
          className="hover:text-primary dark:hover:text-primary transition-colors flex-shrink-0"
        >
          Shop
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />

        <span className="text-gray-700 dark:text-gray-300 flex-shrink-0">
          {productData.category?.name || "Category"}
        </span>

        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />

        <span
          className="font-medium text-gray-900 dark:text-white min-w-0 w-full truncate"
          title={productData.name}
        >
          {productData.name || "Product Details"}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: gallery (span 7) */}
        <div className="lg:col-span-7">
          <div className="flex gap-4">
            {/* vertical thumbnails on lg */}
            {hasImages && (
              <div className="hidden lg:flex flex-col gap-3 w-[88px] overflow-auto">
                {productData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => onThumbClick(img.url, idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border transition-all ${
                      selectedImage === img.url
                        ? "border-primary ring-1 ring-primary"
                        : "border-gray-200"
                    }`}
                    aria-label={`Thumbnail ${idx + 1}`}
                  >
                    <Image
                      src={img.url}
                      alt={`${productData.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1">
              <div
                className="relative w-full h-[520px] bg-white border rounded-xl overflow-hidden shadow-md cursor-zoom-in"
                onClick={onOpenGalleryModal}
              >
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={productData.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              {/* mobile thumbnails */}
              {hasImages && (
                <div className="mt-4 flex gap-3 lg:hidden overflow-x-auto pb-2">
                  {productData.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => onThumbClick(img.url, idx)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all ${
                        selectedImage === img.url
                          ? "ring-2 ring-primary"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      aria-label={`Thumbnail ${idx + 1}`}
                    >
                      <Image
                        src={img.url}
                        alt={`thumb ${idx}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: show purchase card immediately after gallery (so actions come first on small screens) */}
          <MobilePurchaseCard />

          {/* Tabs content (Description / Reviews) */}
          <div className="mt-10">
            <div className="flex gap-6 border-b border-gray-100 pb-3">
              {["Product Details", "Rating & Reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {activeTab === "Product Details" && (
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: productData.description }}
                />
              )}

              {activeTab === "Rating & Reviews" && (
                <div>
                  <ReviewForm productId={productData.id} userId={userId} />

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviewsData.slice(0, reviewsToShow).map((review, idx) => (
                      <article
                        key={idx}
                        className="p-5 border rounded-lg bg-white shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={review.user?.image}
                                alt={review.user?.name || "User"}
                              />
                              <AvatarFallback>
                                {review.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-800">
                                  {review.user?.name || "Anonymous"}
                                </h4>
                                <div className="flex items-center text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(review.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 mt-4 text-sm leading-relaxed">
                          {review.content}
                        </p>

                        {review.images && review.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {review.images.slice(0, 4).map((imgObj, i) => (
                              <button
                                key={i}
                                className="relative w-24 h-24 rounded-md overflow-hidden border"
                                onClick={() =>
                                  openImageModal(
                                    review.images.map((im) => im.url),
                                    i
                                  )
                                }
                                aria-label={`Open review image ${i + 1}`}
                              >
                                <Image
                                  src={imgObj.url}
                                  alt={`review image ${i + 1}`}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-110"
                                />
                                {i === 3 && review.images.length > 4 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm font-semibold">
                                    +{review.images.length - 4}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    {reviewsToShow < reviewsCount && (
                      <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        className="px-6"
                      >
                        Load More Reviews
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: purchase card for desktop ONLY (hidden on mobile because we show MobilePurchaseCard) */}
        <aside className="lg:col-span-5 hidden lg:block">
          <div className="sticky top-24">
            <BuyDetails />
          </div>
        </aside>
      </div>

      {/* Image modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={
          hasImages
            ? productData.images.map((i) => i.url)
            : [productData.mainImage]
        }
        initialIndex={currentImageIndex}
      />
    </div>
  );
}
