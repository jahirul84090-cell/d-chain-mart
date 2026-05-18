import React from "react";
import ShowNewArrivals from "./ShowNewArrivals";
import { fetchProductsByFilter } from "@/lib/apihelper";

const NewArrivals = async () => {
  const { products } = await fetchProductsByFilter({
    isNewArrival: true,
  });

  return (
    <>
      <ShowNewArrivals products={products} isHeading={true}/>
    </>
  );
};

export default NewArrivals;
