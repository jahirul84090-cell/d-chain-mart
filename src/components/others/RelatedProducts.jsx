"use client";

import React, { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import ShowNewArrivals from "../HomePage/NewArrivals/ShowNewArrivals";

/**
 * Related products. The product page passes `initialProducts` rendered on
 * the server, so the links are in the HTML search engines see; without them
 * the list is fetched in the browser.
 */
export default function RelatedProducts({ productId, initialProducts }) {
  const hasInitial = Array.isArray(initialProducts);
  const [relatedProducts, setRelatedProducts] = useState(initialProducts || []);
  const [isLoading, setIsLoading] = useState(!hasInitial);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasInitial || !productId) return;

    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `/api/admin/product/related?id=${encodeURIComponent(productId)}&limit=8`
        );
        if (!res.ok) throw new Error("Failed to load related products");
        const data = await res.json();
        setRelatedProducts(data.relatedProducts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [productId, hasInitial]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Loading related products…</span>
      </div>
    );
  }

  // Related products are optional: hide the section rather than show an error.
  if (error || !relatedProducts.length) return null;

  return (
    <section className="w-full pt-6" aria-labelledby="related-products-heading">
      <div className="container mx-auto px-4">
        <h2
          id="related-products-heading"
          className="text-xl font-bold text-gray-900 sm:text-2xl"
        >
          You may also like
        </h2>
      </div>
      <ShowNewArrivals products={relatedProducts} isHeading={false} />
    </section>
  );
}
