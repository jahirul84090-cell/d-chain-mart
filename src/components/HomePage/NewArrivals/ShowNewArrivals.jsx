"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

import MergedProductCard from "@/components/productCard/MargedProductCard";

export default function ShowNewArrivals({ products, isHeading }) {
  const autoplayOptions = useRef({ delay: 10000, stopOnInteraction: false });
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, containScroll: "trimSnaps" },
    [Autoplay(autoplayOptions.current)]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );
  const scrollTo = useCallback(
    (index) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  return (
    <div className="container mx-auto px-4 py-8 overflow-x-hidden">
      {isHeading && (
        <>
          <div className="flex items-center w-full mb-8">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>

            <div className="mx-4 sm:mx-8 flex-shrink-0 text-center">
              <h2 className="text-3xl font-extrabold   uppercase tracking-wider leading-none">
                New Arrivals
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Don’t miss these exclusive deals this week.
              </p>
            </div>

            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>
        </>
      )}

      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700"
          onClick={scrollPrev}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Carousel */}
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container flex">
            {products.length > 0 ? (
              products.map((product) => (
                <MergedProductCard
                  key={product.id}
                  tags="NEW"
                  buttonText="ADD TO CART"
                  product={product}
                  isSlider={true}
                />
              ))
            ) : (
              <div className="flex-1 text-center py-10 text-gray-600">
                No new products found.
              </div>
            )}
          </div>
        </div>

        {/* Right Arrow */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700"
          onClick={scrollNext}
          suppressHydrationWarning={true}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              suppressHydrationWarning={true}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === selectedIndex
                  ? "bg-primary scale-110"
                  : "bg-gray-400 dark:bg-gray-600"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
}
