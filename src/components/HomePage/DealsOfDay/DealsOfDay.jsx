import React from "react";
import ShowDealsOfDay from "./ShowDealsOfDay";
import { getProductsByFlag, safely } from "@/lib/storefront";

const DealsOfDay = async () => {
  const products = await safely(getProductsByFlag("isPopular"), []);

  return (
    <>
      <ShowDealsOfDay products={products} />
    </>
  );
};

export default DealsOfDay;
