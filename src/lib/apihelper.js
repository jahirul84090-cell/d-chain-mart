export const fetchProductsByFilter = async (filter = {}) => {
  const url = new URL(`${process.env.BASE_URL}/api/admin/product`);

  const effectiveFilter = {
    isActive: true,
    ...filter,
  };

  Object.keys(effectiveFilter).forEach((key) =>
    url.searchParams.append(key, effectiveFilter[key])
  );

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [] };
  }
};
