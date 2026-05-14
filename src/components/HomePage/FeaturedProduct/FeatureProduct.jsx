import { fetchProductsByFilter } from "@/lib/apihelper";
import React from "react";
import ShowFeatureProduct from "./ShowFeatureProduct";

const FeatureProduct = async () => {
  const { products } = await fetchProductsByFilter({
    isFeatured: true,
  });

  return (
    <>
      <ShowFeatureProduct products={products} />
    </>
  );
};

export default FeatureProduct;
