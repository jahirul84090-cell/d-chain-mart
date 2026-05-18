// NewProductCard.js
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Eye, Ban, CheckCircle } from "lucide-react";
import { QuickViewModal } from "./QuickViewModal";

const NewProductCard = ({ product, tags, buttonText }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isSoldOut = product.stockAmount <= 0;

  return (
    <>
      <div className="flex-none w-[calc(80%-1rem)] sm:w-[calc(40%-1rem)] md:w-[calc(25%-1rem)] lg:w-[calc(20%-1rem)] xl:w-[calc(20%-1rem)] m-2 bg-white rounded-lg shadow-md border border-gray-200 grid grid-rows-[auto,1fr,auto] transition-all duration-300 group hover:shadow-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
          <Image
            src={
              product.mainImage ||
              "https://placehold.co/400x300/E5E7EB/A2A9B0?text=No+Image"
            }
            alt={product.name}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-110"
          />

          <div className="absolute top-0 left-0 w-full flex justify-between p-2 z-10">
            <div className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-md">
              {tags}
            </div>
            {product.discount > 0 && (
              <div className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-md">
                -{product.discount}%
              </div>
            )}
          </div>

          <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 ease-out z-20">
            <div className="flex flex-col items-center gap-3 bg-white rounded-md p-2 shadow-xl backdrop-blur-sm border border-gray-200 dark:bg-gray-700/80 dark:border-gray-600">
              <button
                aria-label="Add to wishlist"
                className="p-2 transition-all"
              >
                <Heart className="w-5 cursor-pointer hover:text-primary h-5 transition-colors dark:text-white dark:hover:text-primary" />
              </button>

              <button
                aria-label="Quick View"
                className="p-2 "
                onClick={() => setIsDialogOpen(true)}
              >
                <Eye className="w-5 h-5 cursor-pointer hover:text-primary transition-colors dark:text-white dark:hover:text-primary" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
            <div className="bg-black/80 text-white text-xs rounded-md py-1 px-3 mb-3 shadow-lg">
              Quick Actions
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col justify-between space-y-2">
          <h3 className="text-sm font-medium line-clamp-2 dark:text-white">
            {product.name}
          </h3>

          <div className="mt-1 text-sm text-gray-600 flex items-center space-x-1 dark:text-gray-400">
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
          <div className="flex items-baseline space-x-2">
            <span className="text-base text-primary font-bold">
              <span className="text-xl font-bold">৳ </span>{" "}
              {product.price.toLocaleString("en-BD")}
            </span>
            {product.oldPrice > 0 && (
              <span className="text-sm line-through dark:text-gray-400">
                {product.oldPrice.toLocaleString("en-BD")}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {isSoldOut ? (
            <Button
              disabled
              className="w-full bg-gray-400 text-white font-semibold rounded-full cursor-not-allowed"
            >
              Sold Out
            </Button>
          ) : (
            <Link href={`/${product.slug}`} passHref>
              <Button className="group relative w-full rounded-sm overflow-hidden transition-all duration-300 hover:bg-primary/80 cursor-pointer py-5 flex items-center justify-center">
                <span className="inline-block uppercase font-semibold text-sm transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:opacity-0">
                  {buttonText}
                </span>

                <span className="absolute inset-0 flex items-center justify-center opacity-0 transform translate-y-6 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <ShoppingCart style={{ width: "20px", height: "20px" }} />
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      <QuickViewModal
        product={product}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
};

export default NewProductCard;
