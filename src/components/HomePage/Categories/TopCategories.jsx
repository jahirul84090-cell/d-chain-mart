import React from "react";
import Image from "next/image";
import Link from "next/link";

const getTopCategories = async () => {
  try {
    const res = await fetch(`${process.env.BASE_URL}/api/admin/categories`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};

const CategoryCard = ({ category }) => {
  return (
    <Link
      href={`/allproducts?categoryId=${category.id}`}
      className="flex flex-col items-center p-4 text-center group cursor-pointer transition-transform duration-300 transform hover:scale-105 "
    >
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3  flex items-center justify-center shadow-sm  transition-shadow duration-300">
        <Image
          src={
            category.imageUrl ||
            "https://ik.imagekit.io/obnmhirhl/589_Dk-sDMakN.png"
          }
          alt={category.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 12vw"
          className="object-cover rounded-full"
        />
      </div>
      <h3 className="text-base md:text-lg font-semibold  uppercase mt-1 line-clamp-2 transition-colors duration-200 group-hover:text-primary">
        {category.name}
      </h3>
    </Link>
  );
};

const TopCategories = async () => {
  const topCategories = await getTopCategories();

  return (
    <section className="">
      <div className="container mx-auto px-4">
        <div className="flex justify-center flex-row">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 justify-items-center">
            {topCategories.length > 0 ? (
              topCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No categories available.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopCategories;
