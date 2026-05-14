"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { motion } from "framer-motion";

// Animation variants for the text content
const contentVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

// Animation variants for individual text elements (h1, p, div)
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Updated DotButton for primary theme consistency
const DotButton = ({ selected, onClick }) => (
  <button
    className={`w-2.5 h-2.5 rounded-full mx-1.5 transition-all duration-300 ring-2 ring-white/70 ${
      selected
        ? "bg-primary scale-125 ring-offset-2 ring-offset-black/50"
        : "bg-gray-300/70 hover:bg-white/90"
    }`}
    onClick={onClick}
    aria-label="Go to slide"
  />
);

export default function HeroSection({ sliderProducts }) {
  const autoplayOptions = useRef({ delay: 5000, stopOnInteraction: true });
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay(autoplayOptions.current),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    const handleResize = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      window.removeEventListener("resize", handleResize);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{ height: "90vh", minHeight: "600px" }}
    >
      {/* Slider */}
      <div
        className="embla__viewport h-full"
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Product and promotion gallery"
      >
        <div className="embla__container h-full flex" aria-live="polite">
          {sliderProducts.map((slide, index) => (
            <div
              className="embla__slide flex-[0_0_100%] h-full relative"
              key={slide.id}
            >
              {/* Background Image - Use motion.div wrapper for hover animation */}
              <motion.div
                className="absolute inset-0"
                whileHover={{ scale: 1.05 }} // Subtle zoom on hover
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Image
                  src={slide.mainImage}
                  alt={slide.name}
                  fill
                  priority
                  className="object-cover object-center"
                />
              </motion.div>

              {/* Darker, softer overlay for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>

              {/* Text Content - Apply entrance animation via motion.div */}
              <motion.div
                className="absolute inset-0 flex items-center px-8 md:px-24"
                initial="hidden"
                animate={index === selectedIndex ? "visible" : "hidden"} // Only animate content if slide is active
                variants={contentVariants}
              >
                <div className="max-w-3xl text-white space-y-7 z-10">
                  {/* Title */}
                  <motion.h1
                    className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-lg"
                    variants={itemVariants}
                  >
                    {slide.name}
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    className="text-xl md:text-2xl text-gray-100 font-light drop-shadow"
                    variants={itemVariants}
                  >
                    {slide.shortDescription}
                  </motion.p>

                  {/* Button and Price */}
                  <motion.div
                    className="flex flex-col sm:flex-row items-start gap-6 pt-6"
                    variants={itemVariants}
                  >
                    <Link href={`/${slide.slug}`} legacyBehavior passHref>
                      <Button className="w-fit bg-primary text-primary-foreground px-10 py-3 md:py-7 rounded-lg text-lg font-bold uppercase tracking-wider shadow-xl hover:bg-primary/90 transition-all duration-300 ring-2 ring-transparent hover:ring-white/50">
                        Shop Now
                      </Button>
                    </Link>

                    {/* Price styling refined for emphasis */}
                    <div className="flex items-center text-white font-sans">
                      <span className="text-4xl font-extrabold">
                        ৳{slide.price}
                      </span>
                      {slide.oldPrice && (
                        <span className="line-through text-gray-400 text-xl ml-4 opacity-80">
                          ৳{slide.oldPrice}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-4 md:px-10">
        <Button
          onClick={scrollPrev}
          className="p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors duration-300 shadow-xl opacity-75 hover:opacity-100"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
        </Button>
        <Button
          onClick={scrollNext}
          className="p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors duration-300 shadow-xl opacity-75 hover:opacity-100"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
        </Button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex p-2 rounded-full bg-black/20 backdrop-blur-[1px]">
        {sliderProducts.map((_, index) => (
          <DotButton
            key={index}
            selected={index === selectedIndex}
            onClick={() => emblaApi.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
}
