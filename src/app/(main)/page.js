// src/app/(main)/page.js

import Banner from "@/components/HomePage/Banner/Banner";
import CategoryCardSkeleton from "@/components/HomePage/Categories/CategorySkeleton";
import TopCategories from "@/components/HomePage/Categories/TopCategories";
import CatProduct from "@/components/HomePage/CatProduct/CatProduct";
import DealsOfDay from "@/components/HomePage/DealsOfDay/DealsOfDay";
import DealsOfDaySkeleton from "@/components/HomePage/DealsOfDay/DealsOfDaySkeleton";

import FeatureProduct from "@/components/HomePage/FeaturedProduct/FeatureProduct";
import FeatureProductSkeleton from "@/components/HomePage/FeaturedProduct/FeatureProductSkeleton";

import NewArrivals from "@/components/HomePage/NewArrivals/NewArrivals";
import NewArrivalsSkeleton from "@/components/HomePage/NewArrivals/NewArrivalsSkeleton";

import React, { Suspense } from "react";

const page = async () => {
  return (
    <>
      <Suspense fallback={<CategoryCardSkeleton />}>
        <TopCategories />
      </Suspense>
      <Banner />

      <Suspense fallback={<NewArrivalsSkeleton />}>
        <NewArrivals />
      </Suspense>

      <Suspense fallback={<FeatureProductSkeleton />}>
        <FeatureProduct />
      </Suspense>
      <Suspense fallback={<DealsOfDaySkeleton />}>
        <DealsOfDay />
      </Suspense>
      <CatProduct />
    </>
  );
};

export default page;
