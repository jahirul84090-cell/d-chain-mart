"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import {
  Star,
  ShoppingCart,
  Plus,
  Minus,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";

import { useCartWithSession } from "@/lib/cartStore";

const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return 0;
  }
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
};

const FeaturedProductCard = ({
  product,
  isLoggedIn,
  cart,
  onAdd,
  onUpdateQuantity,
}) => {
  const [selectedSize, setSelectedSize] = useState(
    product?.availableSizes?.[0] || null
  );
  const [selectedColor, setSelectedColor] = useState(
    product?.availableColors?.[0] || null
  );

  const availableSizes = product.availableSizes
    ? product.availableSizes.split(",").map((s) => s.trim())
    : [];
  const availableColors = product.availableColors
    ? product.availableColors.split(",").map((c) => c.trim())
    : [];

  const itemIdentifier = `${product?.id || "no-id"}-${
    selectedSize || "no-size"
  }-${selectedColor || "no-color"}`;
  const isInCart = cart.some((item) => item.id === itemIdentifier);
  const currentCartItem = cart.find((item) => item.id === itemIdentifier);
  const isOutOfStock = product?.stockAmount === 0;
  const isLowStock = product?.stockAmount > 0 && product?.stockAmount <= 20;
  const reviewCount = product?.reviews?.length || 0;
  const averageRating = calculateAverageRating(product?.reviews);
  const totalStock = 100;
  const stockPercentage = (product?.stockAmount / totalStock) * 100;
  const [addCart, setAddCart] = useState(false);

  const buttonText = addCart ? "Adding" : "Add to cart";

  const handleAddToCartClick = async (e) => {
    e.stopPropagation();
    setAddCart(true);
    if (isLoggedIn) {
      await onAdd(product.id, 1, selectedSize, selectedColor);
      setAddCart(false);
    } else {
      toast.error("Please log in to add to cart.");
    }
  };

  const handleQuantityDecrement = (e) => {
    e.stopPropagation();
    if (currentCartItem.quantity > 1) {
      onUpdateQuantity(
        currentCartItem.dbItemId,
        currentCartItem.quantity - 1,
        itemIdentifier
      );
    } else {
      onUpdateQuantity(currentCartItem.dbItemId, 0, itemIdentifier);
    }
  };

  const handleQuantityIncrement = (e) => {
    e.stopPropagation();
    onUpdateQuantity(
      currentCartItem.dbItemId,
      currentCartItem.quantity + 1,
      itemIdentifier
    );
  };

  return (
    <Card className="relative p-6 flex flex-col md:flex-row gap-6 border border-primary">
      {/* Out of Stock or Discount Badge */}
      {isOutOfStock ? (
        <div className="absolute top-4 left-4 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
          Out of Stock
        </div>
      ) : (
        product?.discount > 0 && (
          <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
            {product.discount}%
          </div>
        )
      )}

      {/* Product Image and View Icon */}
      <div className="relative w-full md:w-1/2 flex items-center justify-center bg-gray-50 rounded-lg">
        <Image
          src={
            product?.mainImage ||
            "https://placehold.co/400x300/E5E7EB/A2A9B0?text=No+Image"
          }
          alt={product?.name || "Product image"}
          width={400}
          height={400}
          objectFit="contain"
          className="max-h-[300px] md:max-h-full"
        />
      </div>

      {/* Product Details */}
      <div className="w-full md:w-1/2 flex flex-col justify-between ">
        <div>
          <CardTitle className="text-sm font-semibold line-clamp-2 h-10 dark:text-white">
            {product?.name}
          </CardTitle>
          <div className="flex items-center mt-2">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(averageRating)
                      ? "fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {reviewCount > 0 ? (
              <span className="text-sm text-gray-500 ml-2">
                ({reviewCount} reviews)
              </span>
            ) : (
              <span className="text-sm text-gray-500 ml-2">
                (No reviews yet)
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 py-2">
            <span className="text-xl text-primary font-bold">
              <span className="text-xl font-bold">৳ </span>
              {product.price.toLocaleString("en-BD")}
            </span>
            {product.oldPrice > 0 && (
              <span className="text-xl line-through dark:text-gray-400">
                {product.oldPrice.toLocaleString("en-BD")}
              </span>
            )}
          </div>
          <CardDescription className="text-gray-600 mt-3 text-sm">
            {product?.shortdescription}
          </CardDescription>

          {/* Size and Color Selection */}
          <div className="mt-4 flex flex-col gap-3">
            {(availableSizes.length > 0 || availableColors.length > 0) && (
              <div className="flex flex-col space-y-3 mt-2">
                {availableSizes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Size:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <span
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`
                        cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                        ${
                          selectedSize === size
                            ? "bg-primary text-white shadow-lg border-primary"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                      `}
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {availableColors.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Color:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <div
                          key={color}
                          className="flex items-center space-x-1"
                        >
                          <span
                            onClick={() => setSelectedColor(color)}
                            className={`
                            cursor-pointer w-6 h-6 rounded-full border-2 transition-all duration-200
                            ${
                              selectedColor === color
                                ? "ring-2 ring-offset-2 ring-primary"
                                : "hover:ring-2 hover:ring-offset-2 hover:ring-gray-300"
                            }
                          `}
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          ></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stock Information with Shadcn Progress */}
        <div className="mt-6">
          {isLowStock && (
            <p className="text-orange-600 text-sm font-semibold mb-2">
              Only {product.stockAmount} left!
            </p>
          )}
          {!isOutOfStock && (
            <>
              <Progress
                value={stockPercentage}
                className={`h-2 ${isLowStock ? "bg-red-500" : "bg-purple-600"}`}
              />
              <p className="text-sm text-gray-600 mt-2">
                available: {product?.stockAmount}
              </p>
            </>
          )}
        </div>

        {/* Add to Cart / Quantity Controls */}
        <div className="mt-6 flex gap-4 flex-col">
          {isOutOfStock ? (
            <Button
              className="flex-1 w-full bg-gray-400 text-white font-semibold py-2 rounded-full cursor-not-allowed"
              disabled
            >
              Out of Stock
            </Button>
          ) : (
            <>
              <Link href={`/${product?.slug}`} passHref>
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer py-5 w-full flex items-center justify-center space-x-2 "
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4" />
                  <span>View Product</span>
                </Button>
              </Link>
              {isLoggedIn ? (
                isInCart ? (
                  <div className="flex-1 flex bg-gray-200 p-2 rounded-3xl items-center justify-between space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleQuantityDecrement}
                      className="rounded-full cursor-pointer border-gray-300 text-primary  hover:border-primary"
                      disabled={
                        currentCartItem?.isUpdating ||
                        currentCartItem?.quantity <= 1
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-bold flex items-center">
                      {currentCartItem?.isUpdating ? (
                        <Loader2 className="h-5  w-5 animate-spin text-primary" />
                      ) : (
                        currentCartItem?.quantity
                      )}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleQuantityIncrement}
                      className="rounded-full cursor-pointer border-gray-300 text-primary  hover:border-primary"
                      disabled={currentCartItem?.isUpdating}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // --- REPLACED BUTTON (Your exact requested button) ---
                  <Button
                    // Added background color and text color from the original "Add to cart" button
                    className="group relative w-full rounded-sm overflow-hidden transition-all duration-300 hover:bg-primary/80 cursor-pointer py-5 flex items-center justify-center bg-primary text-white"
                    onClick={handleAddToCartClick}
                    disabled={addCart}
                  >
                    <span className="inline-block uppercase font-semibold text-sm transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:opacity-0">
                      {buttonText}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-6 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <ShoppingCart className="w-5 h-5" />
                    </span>
                  </Button>
                  // --- END OF REPLACED BUTTON ---
                )
              ) : (
                <Button
                  className="flex-1 w-full bg-gray-400 text-white font-semibold py-3 rounded-sm cursor-not-allowed"
                  disabled
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.error("Please log in to add to cart.");
                  }}
                >
                  Log in to add to cart
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

// ... (SmallProductCard remains the same)

const SmallProductCard = ({ product }) => {
  const isOutOfStock = product?.stockAmount === 0;
  const reviewCount = product?.reviews?.length || 0;
  const averageRating = calculateAverageRating(product?.reviews);

  const availableSizes = product.availableSizes
    ? product.availableSizes.split(",").map((s) => s.trim())
    : [];
  const availableColors = product.availableColors
    ? product.availableColors.split(",").map((c) => c.trim())
    : [];

  const cardContent = (
    <Card className="relative p-4 flex gap-4 items-center group hover:shadow-md transition-shadow duration-200">
      {isOutOfStock ? (
        <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          Out of Stock
        </div>
      ) : (
        product?.discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            {product.discount}%
          </div>
        )
      )}

      {/* Product Image and View Icon */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image
          src={product?.mainImage}
          alt={product?.name || "Product image"}
          fill
          objectFit="contain"
          className="rounded-lg bg-gray-50"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 p-1 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-colors duration-200 opacity-0 group-hover:opacity-100"
                aria-label={`View ${product?.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="h-4 w-4 text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Product</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <span className="text-white text-sm font-semibold rotate-[-20deg]">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between h-full">
        <div>
          <CardTitle className="text-sm font-semibold line-clamp-2 h-10 dark:text-white">
            {product?.name}
          </CardTitle>
          <div className="flex items-center text-yellow-400 text-xs mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.round(averageRating)
                    ? "fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
            {reviewCount > 0 ? (
              <span className="text-gray-500 ml-1">({reviewCount})</span>
            ) : (
              <span className="text-gray-500 ml-1">(No reviews yet)</span>
            )}
          </div>
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

        <div className="mt-4 flex flex-col gap-3">
          {(availableSizes.length > 0 || availableColors.length > 0) && (
            <div className="flex flex-col space-y-3 mt-2">
              {availableSizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <span
                        key={size}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 bg-purple-600 text-white shadow-lg border-purple-600`}
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {availableColors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Color:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <div key={color} className="flex items-center space-x-1">
                        <span
                          className={`
                            w-6 h-6 rounded-full border-2 transition-all duration-200
                            
                          `}
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        ></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return isOutOfStock ? (
    <div>{cardContent}</div>
  ) : (
    <Link href={`/${product?.slug}`} passHref>
      {cardContent}
    </Link>
  );
};

const ShowDealsOfDay = ({ products }) => {
  const { cartItems, addToCart, updateCartItemQuantity } = useCartWithSession();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider leading-none">
            Deals Of The Day
          </h2>
          <CardDescription className="text-sm text-gray-600">
            The freshest greengrocer products are waiting for you
          </CardDescription>
        </div>
      </div>
      <hr />
      {/* Main Content: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {products?.length > 0 ? (
          <>
            {/* Small Product Cards */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {products.slice(1, 3).map((product) => (
                <SmallProductCard
                  key={product.id}
                  product={product}
                  isLoggedIn={isLoggedIn}
                  cart={cartItems}
                  onUpdateQuantity={updateCartItemQuantity}
                />
              ))}
            </div>

            <div className="lg:col-span-2">
              {products[0] && (
                <FeaturedProductCard
                  product={products[0]}
                  isLoggedIn={isLoggedIn}
                  cart={cartItems}
                  onAdd={addToCart}
                  onUpdateQuantity={updateCartItemQuantity}
                />
              )}
            </div>
          </>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg">
            <p className="text-xl font-semibold text-gray-700">
              No popular deals found.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Check back soon for new offers!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowDealsOfDay;
