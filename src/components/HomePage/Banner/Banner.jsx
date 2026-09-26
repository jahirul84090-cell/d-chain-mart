import React from "react";
import HeroSection from "./HeroSection";
import { getProductsByFlag, safely } from "@/lib/storefront";

const Banner = async () => {
  const sliderProducts = await safely(getProductsByFlag("isSlider"), []);

  // Hide the hero entirely instead of showing an empty full-screen block.
  if (sliderProducts.length === 0) return null;

  return <HeroSection sliderProducts={sliderProducts} />;
};

export default Banner;
