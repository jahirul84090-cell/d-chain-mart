// components/QuickViewModal.js
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Minus,
  Plus,
  Star,
  Facebook,
  X,
  Pin,
  Link as LinkIcon,
  CheckCircle,
  Zap,
  ArrowRight,
  Check,
  Heart,
  Loader2,
} from "lucide-react";
import { useCartWithSession } from "@/lib/cartStore";
import useWishlistStore from "@/lib/wishlistStore";
import { useSession, signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";

const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return 0;
  }
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return parseFloat((totalRating / reviews.length).toFixed(1));
};

const SizeSelector = ({ sizes, selectedSize, setSelectedSize }) => {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-base font-semibold text-gray-700 dark:text-gray-300 min-w-[70px]">
        Size:
      </span>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <Button
            key={size}
            variant="outline"
            size="sm"
            onClick={() => setSelectedSize(size)}
            className={`h-8 w-auto min-w-[32px] text-xs font-medium border transition-colors ${
              selectedSize === size
                ? "border-primary bg-primary text-white hover:bg-primary/90"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
};

const ColorSelector = ({ colors, selectedColor, setSelectedColor }) => {
  const getBackgroundColor = (colorName) => {
    switch (colorName.toLowerCase()) {
      case "black":
        return "bg-gray-900";
      case "white":
        return "bg-gray-100 border border-gray-400";
      case "red":
        return "bg-red-600";
      case "blue":
        return "bg-blue-600";
      case "green":
        return "bg-green-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-base font-semibold text-gray-700 dark:text-gray-300 min-w-[70px]">
        Color:
      </span>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = selectedColor === color;
          const bgColorClass = getBackgroundColor(color);
          const style = !bgColorClass.startsWith("bg-")
            ? { backgroundColor: color }
            : {};

          return (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-7 h-7 rounded-full cursor-pointer p-[2px] transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-2"
                  : "ring-1 ring-transparent"
              }`}
              title={color}
            >
              <div
                className={`w-full h-full rounded-full ${bgColorClass} flex items-center justify-center`}
                style={style}
              >
                {isSelected && (
                  <Check
                    className={`w-4 h-4 ${
                      color.toLowerCase() === "white"
                        ? "text-gray-800"
                        : "text-white"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuantitySelector = ({
  stockAmount,
  quantity,
  setQuantity,
  isUpdating,
}) => {
  const maxQuantity = stockAmount || 100;

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const newQty = prev + delta;
      if (newQty < 1) return 1;
      if (newQty > maxQuantity) return maxQuantity;
      return newQty;
    });
  };

  const handleInputChange = (e) => {
    let newQty = parseInt(e.target.value, 10);
    if (isNaN(newQty) || newQty < 1) {
      newQty = 1;
    } else if (newQty > maxQuantity) {
      newQty = maxQuantity;
    }
    setQuantity(newQty);
  };

  return (
    <div className="flex items-center ml-2">
      {isUpdating ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="flex items-center border border-gray-300 rounded-lg divide-x divide-gray-300 dark:divide-gray-600 dark:border-gray-600 overflow-hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="w-10 h-10 border-none bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-0 rounded-none transition-colors"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            min="1"
            max={maxQuantity}
            className="w-16 h-10 text-center font-semibold text-base border-none focus-visible:ring-0 dark:bg-gray-800 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= maxQuantity}
            className="w-10 h-10 border-none bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-0 rounded-none transition-colors"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const ProductShare = ({ productSlug }) => {
  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${productSlug}`
      : `/${productSlug}`;

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        productUrl
      )}`,
    },
    {
      name: "X (Twitter)",
      icon: X,
      color: "text-gray-900 dark:text-white",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        productUrl
      )}&text=Check out this product!`,
    },
    {
      name: "Pinterest",
      icon: Pin,
      color: "text-red-600",
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
        productUrl
      )}`,
    },
  ];

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(productUrl);
      toast.success("Product link copied to clipboard!");
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Share this product:
      </h4>
      <div className="flex items-center space-x-3">
        {shareOptions.map((option) => (
          <a
            key={option.name}
            href={option.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full border border-gray-200 hover:border-gray-400 transition-colors dark:border-gray-700 dark:hover:border-gray-500 ${option.color}`}
            aria-label={`Share on ${option.name}`}
          >
            <option.icon className="w-5 h-5" />
          </a>
        ))}
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyLink}
          className="p-2 rounded-full border border-gray-200 hover:border-gray-400 transition-colors dark:border-gray-700 dark:hover:border-gray-500 text-gray-500 hover:text-primary"
          aria-label="Copy product link"
        >
          <LinkIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

const QuickViewContent = ({ product, setIsDialogOpen }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const { cartItems, addToCart, updateCartItemQuantity } = useCartWithSession();
  const { wishlist, toggleWishlist, fetchWishlist } = useWishlistStore();

  const availableSizes = product.availableSizes
    ? product.availableSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const availableColors = product.availableColors
    ? product.availableColors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  const [selectedColor, setSelectedColor] = useState(
    availableColors[0] || null
  );
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || null);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const itemIdentifier = `${product.id}-${selectedSize || "no-size"}-${
    selectedColor || "no-color"
  }`;
  const currentCartItem = cartItems.find((it) => it.id === itemIdentifier);
  const isInCart = !!currentCartItem;
  const isWishlisted = wishlist.some((it) => it.id === product.id);

  const quantity = isInCart ? currentCartItem.quantity : localQuantity;
  const isUpdating = currentCartItem?.isUpdating || false;

  const isSoldOut = product.stockAmount <= 0;
  const averageRating = calculateAverageRating(product.reviews);
  const reviewCount = product.reviews ? product.reviews.length : 0;

  const isAddButtonDisabled =
    isSoldOut ||
    isAdding ||
    isInCart ||
    (availableSizes.length > 0 && !selectedSize) ||
    (availableColors.length > 0 && !selectedColor);

  useEffect(() => {
    if (isInCart) {
      setLocalQuantity(currentCartItem.quantity);
    } else {
      if (localQuantity !== 1) setLocalQuantity(1);
    }
  }, [isInCart, currentCartItem?.quantity, currentCartItem?.id]);

  useEffect(() => {
    if (isLoggedIn) fetchWishlist();
  }, [isLoggedIn, fetchWishlist]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.info("Please log in to add items to your cart.");
      setIsDialogOpen(false);
      await signIn(undefined, { callbackUrl: pathname });
      return;
    }

    if (product.stockAmount <= 0) {
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
      await addToCart(product.id, localQuantity, selectedSize, selectedColor);
    } catch (err) {
      toast.error("Failed to add to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateQuantity = async (newQty) => {
    if (!currentCartItem || newQty < 1 || newQty > product.stockAmount) return;
    if (newQty === currentCartItem.quantity) return;

    await updateCartItemQuantity(
      currentCartItem.dbItemId,
      newQty,
      currentCartItem.id
    );
  };

  const handleToggleWishlist = () => {
    if (!isLoggedIn) {
      toast.info("Please log in to use the wishlist.");
      setIsDialogOpen(false);
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    toggleWishlist(product, isWishlisted);
    toast.success(
      isWishlisted ? "Item removed from wishlist." : "Item added to wishlist!"
    );
  };

  const getQuantitySetter = () => {
    if (isInCart) {
      return (newQtyOrUpdater) => {
        let finalNewQty;

        if (typeof newQtyOrUpdater === "function") {
          finalNewQty = newQtyOrUpdater(quantity);
        } else {
          finalNewQty = newQtyOrUpdater;
        }

        const max = product.stockAmount || 100;
        finalNewQty = Math.max(1, Math.min(finalNewQty, max));

        setLocalQuantity(finalNewQty);

        if (finalNewQty !== currentCartItem.quantity) {
          handleUpdateQuantity(finalNewQty);
        }
      };
    } else {
      return setLocalQuantity;
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      toast.info("Please log in to proceed to checkout.");
      setIsDialogOpen(false);
      await signIn(undefined, { callbackUrl: pathname });
      return;
    }

    if (product.stockAmount <= 0) {
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

    if (!isInCart) {
      setIsAdding(true);
      try {
        await addToCart(product.id, localQuantity, selectedSize, selectedColor);
      } catch (err) {
        toast.error("Failed to add to cart for Buy Now.");
        setIsAdding(false);
        return;
      } finally {
        setIsAdding(false);
      }
    }

    toast.info("Redirecting to checkout...");
    setIsDialogOpen(false);
    router.push("/checkout");
  };

  const {
    name,
    price,
    oldPrice,
    mainImage,
    slug,
    stockAmount,
    category,
    shortdescription,
  } = product;

  return (
    <div className="grid md:grid-cols-2 gap-8 p-6 sm:p-8 bg-white dark:bg-gray-800">
      <div className="flex justify-center items-center">
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 p-2 sm:p-4 bg-white shadow-lg group">
          <Image
            src={
              mainImage ||
              "https://placehold.co/600x600/E5E7EB/A2A9B0?text=No+Image"
            }
            alt={name}
            fill
            className="object-contain"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleWishlist}
            className={`absolute top-4 right-4 h-10 w-10 z-30 rounded-full transition-colors bg-white dark:bg-gray-800
                ${
                  isWishlisted
                    ? "text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    : "text-gray-500 hover:text-red-500 hover:border-red-500 dark:text-gray-400"
                }`}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <Heart
              className={`w-5 h-5 ${isWishlisted ? "fill-red-500" : ""}`}
            />
          </Button>

          <Link
            href={`/${slug}`}
            passHref
            onClick={() => setIsDialogOpen(false)}
          >
            <Button
              className="absolute bottom-0 left-0 w-full rounded-b-xl rounded-t-none bg-primary/90 text-white font-bold h-12 flex items-center justify-center
              transform translate-y-full opacity-0
              group-hover:translate-y-0 group-hover:opacity-100
              transition-all duration-300 ease-in-out z-20"
            >
              View Full Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <div
            className="absolute inset-0 bg-black/10 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none z-10"
            aria-hidden="true"
          ></div>
        </div>
        <div className="absolute top-2 right-2"></div>
      </div>

      <div className="flex flex-col space-y-4 sm:space-y-5">
        <h2 className="text-2xl font-normal text-gray-900 dark:text-white leading-snug">
          {name}
        </h2>

        <div className="space-y-3 border-b pb-4 dark:border-gray-700">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 fill-yellow-500 mr-1" />
              <span className="font-semibold">{averageRating}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">|</span>
            <span className="text-gray-600 dark:text-gray-300">
              {reviewCount} reviews
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-3xl sm:text-4xl font-bold text-primary">
              ৳ {price.toLocaleString("en-BD")}
            </span>
            {oldPrice > 0 && (
              <span className="text-lg sm:text-xl line-through text-gray-400 dark:text-gray-500">
                ৳ {oldPrice.toLocaleString("en-BD")}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">
          {shortdescription}
        </p>

        <div
          className={`text-sm font-semibold pt-1 flex items-center ${
            isSoldOut ? "text-red-500" : "text-green-600"
          }`}
        >
          <CheckCircle className="w-4 h-4 mr-1.5" />
          {isSoldOut ? "Out of Stock" : `${stockAmount} in stock`}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {!isSoldOut ? (
            <>
              <div className="space-y-3">
                {availableColors.length > 0 && (
                  <ColorSelector
                    colors={availableColors}
                    selectedColor={selectedColor}
                    setSelectedColor={setSelectedColor}
                  />
                )}
                {availableSizes.length > 0 && (
                  <SizeSelector
                    sizes={availableSizes}
                    selectedSize={selectedSize}
                    setSelectedSize={setSelectedSize}
                  />
                )}

                <div className="flex items-center py-1">
                  <span className="text-base font-semibold text-gray-700 dark:text-gray-300 min-w-[70px]">
                    Quantity:
                  </span>
                  <QuantitySelector
                    stockAmount={stockAmount}
                    quantity={quantity}
                    setQuantity={getQuantitySetter()}
                    isUpdating={isUpdating}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <Button
                  className={`uppercase font-bold py-6 flex-1 h-12 transition-colors text-base ${
                    isInCart
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  disabled={isAddButtonDisabled && isLoggedIn}
                  onClick={handleAddToCart}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : isInCart ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      In Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {isLoggedIn ? "Add to Cart" : "Log In to Add"}
                    </>
                  )}
                </Button>

                <Button
                  className="uppercase font-bold py-6 flex-1 h-12 bg-green-500 hover:bg-green-600 transition-colors text-base"
                  disabled={isSoldOut}
                  onClick={handleBuyNow}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isLoggedIn ? "Buy Now" : "Log In to Buy"}
                </Button>

                {/* NOTE: WISHLIST BUTTON WAS MOVED TO THE IMAGE BLOCK ABOVE */}
              </div>
            </>
          ) : (
            <Button disabled className="w-full bg-gray-400 py-6 h-12 text-base">
              Sold Out
            </Button>
          )}
        </div>

        <ProductShare productSlug={slug} />

        <div className="text-xs space-y-1 text-gray-500 dark:text-gray-400 pt-2">
          <p>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              slug:
            </span>{" "}
            {slug}
          </p>
          <p>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Categories:
            </span>{" "}
            {product.category?.name || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

const AccessibleDialogTitle = () => (
  <DialogTitle className="sr-only">Product Quick View</DialogTitle>
);

export const QuickViewModal = ({ product, isDialogOpen, setIsDialogOpen }) => {
  if (!product) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent
        className="p-0 max-h-[95vh] w-[95vw] md:w-[70vw] lg:w-[55vw] max-w-[none] overflow-hidden"
        style={{ maxWidth: "95vw" }}
      >
        <AccessibleDialogTitle />
        <div className="overflow-y-auto max-h-[95vh]">
          <QuickViewContent
            product={product}
            setIsDialogOpen={setIsDialogOpen}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
