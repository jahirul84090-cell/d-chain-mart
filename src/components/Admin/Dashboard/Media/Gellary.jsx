"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "react-toastify";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 20;

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [totalImages, setTotalImages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(totalImages / ITEMS_PER_PAGE);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/upload?page=${page}&limit=${ITEMS_PER_PAGE}`
      );
      const data = await response.json();
      setImages(data.images);
      setTotalImages(data.total);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      toast.error("Failed to fetch images.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleImageClick = (imageUrl) => {
    navigator.clipboard
      .writeText(imageUrl)
      .then(() => {
        toast.success("Image URL copied to clipboard! ✨");
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
        toast.error("Failed to copy URL.");
      });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Image Gallery</h1>

      {loading ? (
        <GallerySkeleton count={ITEMS_PER_PAGE} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.length > 0 ? (
            images.map((image) => (
              <Card
                key={image.id}
                className="aspect-square cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleImageClick(image.imageUrl)}
              >
                <CardContent className="flex items-center justify-center p-0">
                  <Image
                    src={image.url}
                    alt={image.altText}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No images found.
            </p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                aria-disabled={page <= 1}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNumber)}
                    isActive={page === pageNumber}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                aria-disabled={page >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function GallerySkeleton({ count }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-lg" />
      ))}
    </div>
  );
}
