"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  Trash2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { useCartWithSession } from "@/lib/cartStore";

const CartPage = () => {
  const {
    cartItems,
    totalPrice,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
  } = useCartWithSession();

  const subtotal = totalPrice;
  const total = subtotal;

  const handleUpdateQuantity = (item, newQuantity) => {
    if (newQuantity < 1 || item.isUpdating) return;

    updateCartItemQuantity(item.dbItemId, newQuantity, item.id);
  };

  const handleRemove = (item) => {
    if (item.isUpdating) return;
    removeFromCart(item.dbItemId, item.id);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 sm:mb-12 flex-wrap gap-4 border-b pb-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-end">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Shopping Cart
            </h1>
            <span className="text-gray-500 font-normal text-sm sm:text-xl ml-2 sm:ml-4 dark:text-gray-400">
              ({cartItems.length} items)
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button
                variant="outline"
                className="rounded-lg h-10 sm:h-11 px-5 sm:px-6 font-medium border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors shadow-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-lg h-10 sm:h-11 px-5 sm:px-6 font-medium border-red-300 text-red-500 hover:bg-red-50 transition-colors shadow-sm dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={clearCart}
              disabled={cartItems.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 sm:p-24 bg-white dark:bg-gray-800 rounded-3xl shadow-xl text-center border border-gray-200 dark:border-gray-700">
            <ShoppingCart className="w-12 h-12 text-primary mb-4" />
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium mb-6">
              Your cart is currently empty.
            </p>
            <Link href="/">
              <Button className="rounded-full h-12 px-8 font-semibold bg-primary hover:bg-primary/90 transition-colors shadow-md text-white">
                Start Shopping Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card
                  key={item.id}
                  className="flex flex-col sm:flex-row p-4 items-start sm:items-center rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                >
                  {/* Image */}
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 mb-4 sm:mb-0 mr-4 sm:mr-6 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>

                  {/* Item Details and Controls */}
                  <div className="flex-grow flex flex-col sm:flex-row sm:items-center w-full">
                    {/* Name and Attributes */}
                    <div className="flex-grow mb-4 sm:mb-0">
                      <h2 className="font-bold text-base text-gray-800 dark:text-white mb-1 leading-tight hover:text-primary transition-colors">
                        <Link href={`/${item.slug || "#"}`}>{item.name}</Link>
                      </h2>
                      {(item.selectedSize || item.selectedColor) && (
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.selectedSize && (
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              Color:
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500"
                                style={{
                                  backgroundColor:
                                    item.selectedColor.toLowerCase(),
                                }}
                              ></div>
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        ${item.price.toFixed(2)} per item
                      </p>
                    </div>

                    {/* Quantity Control, Subtotal, and Remove */}
                    <div className="flex items-center space-x-4 sm:ml-auto w-full sm:w-auto justify-between sm:justify-start">
                      {/* Quantity Selector */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                          onClick={() =>
                            handleUpdateQuantity(item, item.quantity - 1)
                          }
                          disabled={item.isUpdating || item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </Button>

                        <div className="w-6 text-center">
                          {item.isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                          ) : (
                            <span className="text-sm font-medium text-gray-800 dark:text-white">
                              {item.quantity}
                            </span>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                          onClick={() =>
                            handleUpdateQuantity(item, item.quantity + 1)
                          }
                          disabled={item.isUpdating}
                        >
                          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </Button>
                      </div>

                      {/* Subtotal and Remove Button */}
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-primary text-right min-w-[70px]">
                          {(item.price * item.quantity).toLocaleString("en-BD")}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors rounded-full dark:hover:bg-red-900/20"
                          onClick={() => handleRemove(item)}
                          disabled={item.isUpdating}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary Card */}
            <div className="lg:col-span-1">
              <Card className="rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-4">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between items-center text-base">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ৳{subtotal.toLocaleString("en-BD")}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center font-extrabold text-xl sm:text-2xl border-t border-gray-300 dark:border-gray-600 pt-5 mt-5">
                    <span className="text-gray-900 dark:text-white">
                      Order Total
                    </span>
                    <span className=" text-primary ">
                      <span className="text-xl font-bold">৳ </span>
                      {total.toLocaleString("en-BD")}
                    </span>
                  </div>
                </CardContent>

                {/* Checkout Button */}
                <CardFooter className="bg-gray-50 dark:bg-gray-900 rounded-b-2xl p-6 sm:p-8 border-t border-gray-200 dark:border-gray-700">
                  <Link href="/checkout" className="w-full">
                    <Button
                      className="w-full h-12 sm:h-14 cursor-pointer text-base sm:text-lg rounded-xl font-bold bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 text-white"
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
