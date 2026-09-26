import React from "react";
import ShowNewArrivals from "./ShowNewArrivals";
import { getProductsByFlag, safely } from "@/lib/storefront";

const NewArrivals = async () => {
  const products = await safely(getProductsByFlag("isNewArrival"), []);

  return (
    <>
      <ShowNewArrivals products={products} isHeading={true}/>
    </>
  );
};

export default NewArrivals;
