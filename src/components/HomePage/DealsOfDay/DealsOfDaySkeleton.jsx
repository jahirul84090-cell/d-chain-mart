import { Card } from "@/components/ui/card";
import React from "react";

const FeaturedProductSkeleton = () => (
  <Card className="relative p-6 flex flex-col md:flex-row gap-6 border border-gray-200 animate-pulse">
    <div className="relative w-full md:w-1/2 h-[300px] md:h-[400px] bg-gray-200 rounded-lg"></div>
    <div className="w-full md:w-1/2 flex flex-col justify-between">
      <div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
      </div>
      <div className="mt-6">
        <div className="h-2 bg-gray-200 rounded-full w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="mt-6">
        <div className="h-10 bg-gray-200 rounded-full w-full"></div>
      </div>
    </div>
  </Card>
);

const SmallProductSkeleton = () => (
  <Card className="relative p-4 flex gap-4 items-center group border border-gray-200 animate-pulse">
    <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg"></div>
    <div className="flex-1 flex flex-col justify-between h-full">
      <div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="mt-2 flex justify-between">
        <div className="h-6 bg-gray-200 rounded-full w-1/4"></div>
      </div>
    </div>
  </Card>
);

const DealsOfDaySkeleton = () => {
  return (
    <>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <SmallProductSkeleton />
            <SmallProductSkeleton />
          </div>
          <div className="lg:col-span-2">
            <FeaturedProductSkeleton />
          </div>
        </div>
      </div>
    </>
  );
};

export default DealsOfDaySkeleton;
