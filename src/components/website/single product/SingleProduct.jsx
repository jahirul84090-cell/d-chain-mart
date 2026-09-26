"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Share2,
  Loader2,
  CheckCircle2,
  PackageX,
  Phone,
  MessageCircle,
  Truck,
  RotateCcw,
  Banknote,
  ZoomIn,
  ChevronLeft,
  CreditCard,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageModal from "@/components/others/Imagemodal";
import { useCartWithSession } from "@/lib/cartStore";
import useWishlistStore from "@/lib/wishlistStore";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import ReviewForm from "@/components/others/ReviewFrom";
import { useRouter, usePathname } from "next/navigation";
import { parseOptions } from "@/lib/product-options";
import { SUPPORT_PHONE, SUPPORT_WHATSAPP } from "@/lib/site";
import {
  ColorOptions,
  SizeOptions,
  QuantityStepper,
} from "@/components/productCard/VariantSelector";

/* ─── tiny helpers ─────────────────────────────────────────────────── */
const priceFormatted = (n) =>
  typeof n === "number" ? n.toLocaleString("en-BD") : n;
const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

/* ─── Star row ─────────────────────────────────────────────────────── */
function StarRow({ rating = 0, size = "sm" }) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sz} transition-colors ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
              ? "fill-amber-200 text-amber-200"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Rating bar ───────────────────────────────────────────────────── */
function RatingBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-4 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-400 text-xs shrink-0">
        {count}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function SingleProductDetail({ productData }) {
  /* stores */
  const { cartItems, addToCart, updateCartItemQuantity } = useCartWithSession();
  const { wishlist, toggleWishlist, fetchWishlist } = useWishlistStore();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userId = session?.user?.id;

  /* image state */
  const hasImages = productData?.images?.length > 0;
  const allImages = hasImages
    ? productData.images.map((i) => i.url).filter(Boolean)
    : productData?.mainImage
    ? [productData.mainImage]
    : [];

  const [activeImg, setActiveImg] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  /* variant state */
  const availableColors = parseOptions(productData?.availableColors);
  const availableSizes = parseOptions(productData?.availableSizes);

  const [selectedColor, setSelectedColor] = useState(
    availableColors[0] || null
  );
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || null);

  /* cart / wishlist */
  const itemIdentifier = `${productData.id}-${selectedSize || "no-size"}-${
    selectedColor || "no-color"
  }`;
  const currentCartItem = cartItems.find((it) => it.id === itemIdentifier);
  const isInCart = !!currentCartItem;
  const isWishlisted = wishlist.some((it) => it.id === productData.id);
  const quantity = currentCartItem?.quantity || 1;
  const isUpdating = currentCartItem?.isUpdating || false;

  const router = useRouter();
  const pathname = usePathname();
  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;
  const inStock = (productData.stockAmount ?? 0) > 0;
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  // Quantity chosen before adding to the cart.
  const [desiredQty, setDesiredQty] = useState(1);

  /* reviews */
  const reviewsData = productData?.reviews || [];
  const reviewsCount = reviewsData.length;
  const totalRating = reviewsData.reduce((s, r) => s + (r.rating || 0), 0);
  const averageRating =
    reviewsCount > 0 ? (totalRating / reviewsCount).toFixed(1) : 0;
  const [reviewsToShow, setReviewsToShow] = useState(6);
  const [activeTab, setActiveTab] = useState("details");

  // rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((n) => ({
    label: n,
    count: reviewsData.filter((r) => r.rating === n).length,
  }));

  useEffect(() => {
    if (isLoggedIn) fetchWishlist();
  }, [isLoggedIn, fetchWishlist]);

  /* ── actions ── */
  // Returns true when the selection is complete and the item can be added.
  const validateSelection = () => {
    if (!isLoggedIn) {
      toast.info("Please log in to continue.");
      router.push(loginHref);
      return false;
    }
    if (!inStock) { toast.warn("This product is sold out."); return false; }
    if (availableSizes.length > 0 && !selectedSize) { toast.warn("Please select a size."); return false; }
    if (availableColors.length > 0 && !selectedColor) { toast.warn("Please select a color."); return false; }
    return true;
  };

  const handleAddToCart = async () => {
    if (!validateSelection()) return;
    setIsAdding(true);
    try {
      await addToCart(productData.id, desiredQty, selectedSize, selectedColor);
      setDesiredQty(1);
    } finally {
      setIsAdding(false);
    }
  };

  // Adds the selection (if not already in the cart) and goes to checkout.
  const handleBuyNow = async () => {
    if (!validateSelection()) return;
    setIsBuying(true);
    try {
      const ok = isInCart
        ? true
        : await addToCart(productData.id, desiredQty, selectedSize, selectedColor, { silent: true });
      if (ok) router.push("/checkout");
    } finally {
      setIsBuying(false);
    }
  };

  const handleUpdateQuantity = async (newQty) => {
    if (!currentCartItem || newQty < 1) return;
    await updateCartItemQuantity(currentCartItem.dbItemId, newQty, currentCartItem.id);
  };

  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      toast.info("Please log in to save items.");
      router.push(loginHref);
      return;
    }
    setWishlistBusy(true);
    const ok = await toggleWishlist(productData, isWishlisted);
    setWishlistBusy(false);
    if (ok) toast.success(isWishlisted ? "Removed from wishlist." : "Added to wishlist!");
    else toast.error("Could not update your wishlist. Please try again.");
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: productData.name, text: productData.shortdescription, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.info("Link copied to clipboard.");
      }
    } catch { toast.error("Could not share."); }
  };

  const addButtonDisabled = isAdding || isBuying || !inStock;

  const discountPct = productData.discount > 0
    ? productData.discount
    : productData.oldPrice > 0 && productData.price > 0
    ? Math.round(((productData.oldPrice - productData.price) / productData.oldPrice) * 100)
    : 0;

  /* ── keyboard nav for gallery ── */
  const handleKeyGallery = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") setActiveImg((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setActiveImg((p) => Math.min(allImages.length - 1, p + 1));
    },
    [allImages.length]
  );

  /* ══ RENDER ══ */
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
            <Link href="/allproducts" className="hover:text-primary transition-colors">Shop</Link>
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
            {productData.category?.name && (
              <>
                <Link
                  href={`/category/${productData.category.slug || productData.category.name.toLowerCase()}`}
                  className="hover:text-primary transition-colors"
                >
                  {productData.category.name}
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
              </>
            )}
            <span className="text-gray-800 font-medium truncate max-w-[180px]" title={productData.name}>
              {productData.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="container mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ════ LEFT: Gallery ════ */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Main image */}
              <div
                className="relative w-full aspect-square overflow-hidden cursor-zoom-in group"
                onClick={() => { setModalIndex(activeImg); setIsImageModalOpen(true); }}
                onKeyDown={handleKeyGallery}
                tabIndex={0}
                aria-label="Product image, press arrow keys to navigate"
              >
                {allImages[activeImg] ? (
                  <Image
                    src={allImages[activeImg]}
                    alt={`${productData.name} — image ${activeImg + 1}`}
                    fill
                    priority
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                    No image
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {discountPct > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      -{discountPct}%
                    </span>
                  )}
                  {productData.stockAmount <= 0 && (
                    <span className="bg-gray-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4" />
                </div>

                {/* Arrow navigation */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImg((p) => Math.max(0, p - 1)); }}
                      disabled={activeImg === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center shadow-sm disabled:opacity-30 hover:bg-white transition"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImg((p) => Math.min(allImages.length - 1, p + 1)); }}
                      disabled={activeImg === allImages.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center shadow-sm disabled:opacity-30 hover:bg-white transition"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 border-t border-gray-50 overflow-x-auto">
                  {allImages.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImg === idx
                          ? "border-primary shadow-sm scale-105"
                          : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-200"
                      }`}
                    >
                      <Image src={url} alt={`thumb ${idx + 1}`} fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trust badges — desktop only */}
            <div className="hidden lg:grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: Shield, label: "Secure Payment", sub: "100% Protected" },
                { icon: BadgeCheck, label: "Genuine Product", sub: "Quality Assured" },
                { icon: RotateCcw, label: "Easy Returns", sub: "7 Day Policy" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                  <p className="text-[11px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ════ RIGHT: Purchase panel ════ */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7">

              {/* Category pill */}
              {productData.category?.name && (
                <Link
                  href={`/category/${productData.category.slug || productData.category.name.toLowerCase()}`}
                  className="inline-block text-xs font-semibold text-primary bg-primary/8 px-3 py-1 rounded-full mb-3 hover:bg-primary/15 transition-colors"
                >
                  {productData.category.name}
                </Link>
              )}

              {/* Product name */}
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-snug">
                {productData.name}
              </h1>

              {/* Rating row */}
              <div className="flex items-center gap-3 mt-3">
                <StarRow rating={parseFloat(averageRating)} />
                <span className="text-sm font-semibold text-gray-800">{averageRating}</span>
                <span className="text-sm text-gray-400">({reviewsCount} reviews)</span>
                <span className="ml-auto text-xs text-gray-400">SKU: {productData.id?.toString().slice(-6)}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-50 my-4" />

              {/* Price block */}
              <div className="flex items-end gap-3">
                <span className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                  ৳{priceFormatted(productData.price)}
                </span>
                {productData.oldPrice > 0 && (
                  <span className="text-base text-gray-400 line-through mb-1">
                    ৳{priceFormatted(productData.oldPrice)}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="mb-1 ml-1 inline-flex items-center bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    Save {discountPct}%
                  </span>
                )}
              </div>

              {/* Stock badge */}
              <div className="mt-3">
                {productData.stockAmount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In Stock · {productData.stockAmount} units available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                    <PackageX className="w-3.5 h-3.5" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Short description */}
              {productData.shortdescription && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {productData.shortdescription}
                </p>
              )}

              <div className="border-t border-gray-50 my-5" />

              {/* Variant selectors */}
              <ColorOptions
                colors={availableColors}
                value={selectedColor}
                onChange={setSelectedColor}
              />
              <SizeOptions
                sizes={availableSizes}
                value={selectedSize}
                onChange={setSelectedSize}
              />

              {/* ── Cart actions ── */}
              {inStock && !isInCart && (
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">Quantity</span>
                  <QuantityStepper
                    value={desiredQty}
                    onChange={setDesiredQty}
                    max={productData.stockAmount}
                    disabled={isAdding || isBuying}
                  />
                </div>
              )}
              <div className="flex items-stretch gap-3 mt-2">
                {!inStock ? (
                  <Button disabled className="flex-1 h-12 text-base rounded-xl opacity-60">
                    Sold Out
                  </Button>
                ) : isInCart ? (
                  <div className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 h-12">
                    <button
                      onClick={() => handleUpdateQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700" aria-live="polite">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        <>{quantity} in cart</>
                      )}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(quantity + 1)}
                      disabled={quantity >= productData.stockAmount}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    disabled={addButtonDisabled}
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold rounded-xl gap-2 border-primary text-primary hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.98]"
                  >
                    {isAdding ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
                    )}
                  </Button>
                )}

                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistBusy}
                  aria-pressed={isWishlisted}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                    isWishlisted
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
                </button>

                <button
                  onClick={handleShare}
                  aria-label="Share product"
                  className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all hover:scale-105 active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Buy now / in-cart links */}
              {inStock && (
                isInCart ? (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Link href="/cart">
                      <Button variant="outline" className="w-full h-11 rounded-xl text-sm">
                        View Cart
                      </Button>
                    </Link>
                    <Link href="/checkout">
                      <Button className="w-full h-11 rounded-xl text-sm">
                        Checkout
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={handleBuyNow}
                    disabled={isBuying || isAdding}
                    className="mt-3 w-full h-12 text-base font-semibold rounded-xl gap-2 active:scale-[0.98]"
                  >
                    {isBuying ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <>Buy Now</>
                    )}
                  </Button>
                )
              )}

              {!isLoggedIn && (
                <p className="text-center mt-3 text-xs text-gray-500">
                  <Link href={loginHref} className="text-primary font-medium hover:underline">Log in</Link> to buy, add to cart or save to wishlist.
                </p>
              )}

              <div className="border-t border-gray-50 my-5" />

              {/* Delivery / info strip */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { icon: Truck, label: "Fast Delivery", sub: "2–5 Days" },
                  { icon: Banknote, label: "Cash on Delivery", sub: "Available" },
                  { icon: RotateCcw, label: "7 Day Return", sub: "Easy Process" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-[11px] font-semibold text-gray-800">{label}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                ))}
              </div>

              {/* EMI */}
              <Link
                href={
                  isLoggedIn
                    ? `/loans/apply?slug=${encodeURIComponent(productData.slug)}`
                    : `/auth/login?callbackUrl=${encodeURIComponent(`/loans/apply?slug=${productData.slug}`)}`
                }
              >
                <Button variant="outline" className="w-full h-11 rounded-xl text-sm gap-2 mb-4 border-dashed">
                  <CreditCard className="w-4 h-4" />
                  {isLoggedIn ? "Apply for EMI / Loan" : "Log in to apply for EMI / Loan"}
                </Button>
              </Link>

              {/* Support card */}
              <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-4">
                <p className="text-sm font-semibold text-gray-800">Need help?</p>
                <p className="text-xs text-gray-500 mt-0.5">Support available 10 AM – 10 PM daily.</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a href={`tel:${SUPPORT_PHONE}`}>
                    <Button variant="outline" className="w-full h-10 rounded-xl text-xs gap-1.5 bg-white">
                      <Phone className="w-3.5 h-3.5" /> Call Now
                    </Button>
                  </a>
                  <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full h-10 rounded-xl text-xs gap-1.5 bg-green-500 hover:bg-green-600 text-white border-0">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════ TABS: Details + Reviews ════ */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {[
              { id: "details", label: "Product Details" },
              { id: "reviews", label: `Reviews (${reviewsCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 lg:p-8">
            {/* ── Details tab ── */}
            {activeTab === "details" && (
              <div
                className="
                  prose prose-sm max-w-none text-gray-700
                  prose-headings:font-semibold prose-headings:text-gray-900
                  prose-a:text-primary prose-img:rounded-xl
                  prose-ul:text-gray-600 prose-li:my-0.5
                "
                dangerouslySetInnerHTML={{ __html: productData.description }}
              />
            )}

            {/* ── Reviews tab ── */}
            {activeTab === "reviews" && (
              <div>
                {/* Summary row */}
                {reviewsCount > 0 && (
                  <div className="flex flex-col sm:flex-row gap-8 mb-8 pb-8 border-b border-gray-100">
                    {/* Big number */}
                    <div className="text-center sm:text-left">
                      <div className="text-6xl font-extrabold text-gray-900 leading-none">{averageRating}</div>
                      <StarRow rating={parseFloat(averageRating)} size="lg" />
                      <p className="text-sm text-gray-400 mt-1">{reviewsCount} reviews</p>
                    </div>
                    {/* Bars */}
                    <div className="flex-1 space-y-2">
                      {ratingDist.map(({ label, count }) => (
                        <RatingBar key={label} label={label} count={count} total={reviewsCount} />
                      ))}
                    </div>
                  </div>
                )}

                <ReviewForm productId={productData.id} userId={userId} />

                {/* Review cards */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewsData.slice(0, reviewsToShow).map((review, idx) => (
                    <article
                      key={idx}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={review.user?.image} alt={review.user?.name || "User"} />
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {review.user?.name || "Anonymous"}
                            </h4>
                            <time className="text-xs text-gray-400 shrink-0">
                              {formatDate(review.createdAt)}
                            </time>
                          </div>
                          <div className="mt-1">
                            <StarRow rating={review.rating} />
                          </div>
                        </div>
                      </div>

                      {review.content && (
                        <p className="text-sm text-gray-700 mt-3 leading-relaxed">{review.content}</p>
                      )}

                      {review.images?.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {review.images.slice(0, 4).map((imgObj, i) => (
                            <button
                              key={i}
                              onClick={() => { setModalIndex(i); setIsImageModalOpen(true); }}
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition"
                              aria-label={`Review image ${i + 1}`}
                            >
                              <Image src={imgObj.url} alt={`review image ${i + 1}`} fill className="object-cover" sizes="64px" />
                              {i === 3 && review.images.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
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

                {reviewsToShow < reviewsCount && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setReviewsToShow((p) => p + 6)}
                      className="px-8 rounded-xl"
                    >
                      Load More Reviews
                    </Button>
                  </div>
                )}

                {reviewsCount === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm font-medium">No reviews yet</p>
                    <p className="text-xs mt-1">Be the first to review this product.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={allImages}
        initialIndex={modalIndex}
      />
    </div>
  );
}