"use client";

import MergedProductCard from "@/components/productCard/MargedProductCard";

const ShowFeatureProduct = ({ products }) => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center w-full mb-8">
        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>

        <div className="mx-4 sm:mx-8 flex-shrink-0 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider leading-none">
            Featured
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Don’t miss these exclusive deals this week.
          </p>
        </div>

        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      <div className="grid grid-cols-1  sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <MergedProductCard
              key={product.id}
              tags="HOT"
              buttonText="ADD TO CART"
              product={product}
              isSlider={false}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No featured products found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowFeatureProduct;
