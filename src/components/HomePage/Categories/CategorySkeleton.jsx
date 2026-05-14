import React from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming this is a shadcn/ui component

const CategoryCardSkeleton = () => {
  const skeletonCount = 6;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center p-4 text-center animate-pulse"
          >
            <Skeleton className="w-28 h-28 md:w-32 md:h-32 rounded-full mb-2" />
            <Skeleton className="w-24 h-4 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryCardSkeleton;
