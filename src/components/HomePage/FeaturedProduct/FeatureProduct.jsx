import { getProductsByFlag, safely } from "@/lib/storefront";
import React from "react";
import ShowFeatureProduct from "./ShowFeatureProduct";

const FeatureProduct = async () => {
  const products = await safely(getProductsByFlag("isFeatured"), []);

  return (
    <>
      <ShowFeatureProduct products={products} />
    </>
  );
};

export default FeatureProduct;
