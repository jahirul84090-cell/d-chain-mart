import React from "react";
import HeroSection from "./HeroSection";
import { fetchProductsByFilter } from "@/lib/apihelper";

const Banner = async () => {
  const { products: sliderProducts } = await fetchProductsByFilter({
    isSlider: true,
  });

  return (
    <div className="min-h-screen">
      {sliderProducts.length > 0 ? (
        <HeroSection sliderProducts={sliderProducts} />
      ) : (
        <div className="flex justify-center items-center h-full text-lg">
          No slider products available.
        </div>
      )}
    </div>
  );
};

export default Banner;
