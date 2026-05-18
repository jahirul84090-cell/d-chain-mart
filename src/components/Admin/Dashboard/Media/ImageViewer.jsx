// app/components/ImageViewer.js
"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Search } from "lucide-react";
import { debounce } from "lodash";

export default function ImageViewer({
  onSelect = () => {},
  onClose = () => {},
  maxSelection = 10,
}) {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const imagesPerPage = 20;

  // Debounced search handler
  const debouncedFetchImages = useCallback(
    debounce(async (query, pageNum) => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/upload?page=${pageNum}&limit=${imagesPerPage}&search=${encodeURIComponent(
            query
          )}`
        );
        if (response.ok) {
          const { images, total } = await response.json();
          setImages(images);
          setTotalPages(Math.ceil(total / imagesPerPage));
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch images.");
        }
      } catch (error) {
        setError("Error fetching images: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Fetch images when page or searchQuery changes
  useEffect(() => {
    debouncedFetchImages(searchQuery, page);
  }, [searchQuery, page, debouncedFetchImages]);

  // Handle image selection
  const handleImageClick = (image) => {
    setError("");
    if (maxSelection === 1) {
      // Single selection for categories
      if (selectedImages.some((img) => img.id === image.id)) {
        setSelectedImages([]);
      } else {
        setSelectedImages([image]);
      }
    } else {
      // Multiple selection for products
      if (selectedImages.some((img) => img.id === image.id)) {
        setSelectedImages(selectedImages.filter((img) => img.id !== image.id));
      } else {
        if (selectedImages.length >= maxSelection) {
          setError(`You can select a maximum of ${maxSelection} images.`);
          return;
        }
        setSelectedImages([...selectedImages, image]);
      }
    }
  };

  // Confirm selection and pass to parent
  const handleConfirm = () => {
    if (typeof onSelect === "function") {
      const result =
        maxSelection === 1
          ? selectedImages[0]?.url || ""
          : selectedImages.map((img) => img.url);
      onSelect(result);
    } else {
      console.warn("onSelect is not a function, skipping selection callback");
    }
    if (typeof onClose === "function") {
      onClose();
    } else {
      console.warn("onClose is not a function, skipping close callback");
    }
  };

  // Handle close action
  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    } else {
      console.warn("onClose is not a function, skipping close callback");
    }
  };

  // Handle page navigation
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000] p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Select{" "}
            {maxSelection === 1
              ? "Image"
              : `Images (${selectedImages.length}/${maxSelection})`}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search images by title or alt text"
              className="pl-10 border-gray-300"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-800 text-center text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(imagesPerPage)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            {searchQuery
              ? "No images match your search."
              : "No images available."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative rounded-md overflow-hidden shadow-md aspect-square cursor-pointer transition-transform duration-200 ${
                  selectedImages.some((img) => img.id === image.id)
                    ? "ring-2 ring-blue-500 scale-105"
                    : "hover:scale-105"
                }`}
                onClick={() => handleImageClick(image)}
              >
                <Image
                  src={image.url}
                  alt={image.altText || `Image ${image.id}`}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selectedImages.some((img) => img.id === image.id) && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={page === 1 || isLoading}
                className="text-gray-600"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={page === totalPages || isLoading}
                className="text-gray-600"
              >
                Next
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="text-gray-600"
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedImages.length === 0 || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
