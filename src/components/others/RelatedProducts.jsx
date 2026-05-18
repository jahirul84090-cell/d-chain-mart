"use client";

import React, { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import ShowNewArrivals from "../HomePage/NewArrivals/ShowNewArrivals";

export default function RelatedProducts({ productId }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `/api/admin/product/related?id=${productId}&limit=8`
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

    if (productId) fetchRelated();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary font-bold text-2xl" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-sm text-red-500 py-6">{error}</div>;
  }

  if (!relatedProducts.length) {
    return (
      <div className="text-center text-gray-500 text-sm py-6">
        No related products found.
      </div>
    );
  }

  return (
    <section className="w-full py-8">
      <ShowNewArrivals products={relatedProducts} isHeading={false} />
    </section>
  );
}
