import React from "react";
import ShowDealsOfDay from "./ShowDealsOfDay";
import { fetchProductsByFilter } from "@/lib/apihelper";

const DealsOfDay = async () => {
  const { products } = await fetchProductsByFilter({
    isPopular: true,
  });

  return (
    <>
      <ShowDealsOfDay products={products} />
    </>
  );
};

export default DealsOfDay;
