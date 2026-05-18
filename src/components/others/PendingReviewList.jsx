"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";

const PendingReviewsList = () => {
  const API_ENDPOINT = "/api/reviews/pending?limit=5";

  const { status } = useSession();
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    const fetchPendingReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_ENDPOINT);
        const data = await response.json();

        if (response.ok) {
          setPendingProducts(data.products);
        } else {
          setError(data.error || "Failed to load pending reviews.");
        }
      } catch (e) {
        setError("An unexpected error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };
    fetchPendingReviews();
  }, [status]);

  const pendingCount = pendingProducts.length;

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-xl p-6 border-l-4 border-primary animate-pulse transition-all duration-300">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 rounded-xl shadow-md p-6 border-l-4 border-red-500 text-red-700 transition-all duration-300">
        <p className="font-medium">Error loading reviews:</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="w-full bg-blue-50 rounded-xl shadow-md p-6 border-l-4 border-blue-500 text-blue-700 transition-all duration-300">
        <p className="font-semibold">Authentication Required</p>
        <p className="text-sm mt-1">
          Please log in to view products awaiting your review.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-xl p-6 border-l-4 border-yellow-500 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <MessageSquare className="w-6 h-6 mr-3 text-yellow-600 flex-shrink-0" />
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">
            Reviews Pending
          </h3>
        </div>

        <div
          className={`text-4xl font-extrabold ${
            pendingCount > 0 ? "text-red-600" : "text-green-600"
          } flex-shrink-0`}
        >
          {pendingCount}
        </div>
      </div>

      <p className="text-sm text-gray-500 border-b pb-4">
        {pendingCount > 0
          ? `You have ${pendingCount} products ready for your valuable feedback. Click "Review Now" to start.`
          : "All caught up! No reviews are currently pending."}
      </p>

      {pendingCount > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-gray-500">
            Products
          </h4>
          {pendingProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden border">
                  <Image
                    src={product.imageUrl || "/placeholder.png"}
                    alt={product.name || "Product"}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="40px"
                  />
                </div>
                <span className="font-medium text-sm text-gray-700 truncate min-w-0 max-w-[calc(100%-60px)]">
                  {product.name}
                </span>
              </div>

              <Link
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0 ml-3"
                href={`/${product?.slug}`}
              >
                Review Now &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingReviewsList;
