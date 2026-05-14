import React from "react";
import ShowNewArrivals from "../NewArrivals/ShowNewArrivals";
import { Button } from "@/components/ui/button";

const getCatProduct = async () => {
  try {
    const res = await fetch(
      `${process.env.BASE_URL}/api/admin/categories/categoryproduct`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    return data.category || null;
  } catch (error) {
    return null;
  }
};

const CatProduct = async () => {
  const data = await getCatProduct();

  if (
    !data ||
    typeof data.name === "undefined" ||
    typeof data.products === "undefined"
  ) {
    return (
      <section className="py-8 text-center text-gray-500">
        Could not load category products.
      </section>
    );
  }

  const { name, products: p } = data;

  const productsWithCategory = p.map((product) => ({
    ...product,
    category: {
      name: name,
    },
  }));

  return (
    <>
      <section className="py-8">
        <div className="container mx-auto ">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-3 space-y-3 ">
              <h2 className="text-3xl font-extrabold   uppercase tracking-wider leading-none">
                {name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Explore our featured products in this category.
              </p>
              <Button className="py-3  px-4 bg-black cursor-pointer text-white transition duration-150 rounded-md font-semibold">
                VIEW ALL PRODUCTS
              </Button>
            </div>
            <div className="col-span-12 lg:col-span-9">
              <ShowNewArrivals
                products={productsWithCategory}
                isHeading={false}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CatProduct;
