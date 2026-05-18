import React from "react";
import { Card } from "@/components/ui/card";

const FeatureProductsGrid = () => (
  <Card className="relative flex flex-col w-full overflow-hidden rounded-lg shadow-lg animate-pulse">
    <div className="relative w-full h-48 bg-gray-200 rounded-t-lg" />
    <div className="p-4 flex flex-col justify-between flex-1">
      <div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="h-10 w-10 bg-gray-200 rounded-full" />
      </div>
    </div>
    <div className="p-4 pt-0">
      <div className="h-2 bg-gray-200 rounded-full w-full" />
      <div className="flex justify-between text-xs mt-2">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </Card>
);

const FeatureProductSkeleton = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FeatureProductsGrid />
        <FeatureProductsGrid />
        <FeatureProductsGrid />
        <FeatureProductsGrid />
      </div>
    </div>
  );
};

export default FeatureProductSkeleton;
