// components/ReviewForm.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

const ReviewForm = ({ productId, userId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      reviewText: "",
      rating: 5,
    },
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(null);
  const fileInputRef = useRef(null);
  const rating = watch("rating");

  // Check review eligibility
  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!userId) {
        setCanReview({
          eligible: false,
          message: "Please log in to submit a review.",
        });
        return;
      }
      try {
        const response = await fetch(
          `/api/reviews/eligibility?productId=${productId}&userId=${userId}`
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to check eligibility");
        setCanReview(data);
      } catch (error) {
        setCanReview({ eligible: false, message: error.message });
        toast.error(error.message, { toastId: "eligibility-error" });
      }
    };
    checkReviewEligibility();
  }, [productId, userId]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 10 * 1024 * 1024;
    const maxFiles = 5;

    if (files.length + uploadedImages.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed.`, {
        toastId: "image-count",
      });
      return;
    }

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(
          `File type not allowed: ${file.name}. Only JPG, PNG, and JPEG files are supported.`,
          { toastId: "image-type" }
        );
        return;
      }
      if (file.size > maxSize) {
        toast.error(
          `File size too large: ${file.name}. Each file must be under 10MB.`,
          { toastId: "image-size" }
        );
        return;
      }
    }

    const newImages = files.slice(0, maxFiles - uploadedImages.length);
    newImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages((prev) => [
          ...prev,
          { file, preview: reader.result, uploading: false },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (!canReview.eligible) {
      toast.error(canReview.message, { toastId: "review-ineligible" });
      return;
    }
    if (!data.reviewText.trim() && uploadedImages.length === 0) {
      toast.error("Please provide a review or upload at least one image.", {
        toastId: "form-error",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadedImages((prev) =>
      prev.map((img) => ({ ...img, uploading: true }))
    );

    const formData = new FormData();
    formData.append("reviewText", data.reviewText.trim());
    formData.append("title", data.title.trim());
    formData.append("rating", data.rating);
    formData.append("productId", productId);
    formData.append("userId", userId);
    uploadedImages.forEach((image) => {
      formData.append("images", image.file);
    });

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to submit review");

      reset();
      setUploadedImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Review submitted successfully!", {
        toastId: "submit-success",
      });
      setCanReview({
        eligible: false,
        message: "You have already reviewed this product.",
      });
    } catch (error) {
      console.error("Submission error:", error);
      const message = error.message.includes("Network")
        ? "Network error. Please check your connection."
        : error.message || "Failed to submit review.";
      toast.error(message, { toastId: "submit-error" });
    } finally {
      setIsSubmitting(false);
      setUploadedImages((prev) =>
        prev.map((img) => ({ ...img, uploading: false }))
      );
    }
  };

  if (canReview === null) {
    return (
      <div className="flex justify-center">
        <svg
          className="animate-spin h-8 w-8 text-primary"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (!canReview.eligible) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg mx-auto text-center text-gray-600">
        {canReview.message}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg mx-auto transition-all duration-300 mb-8">
      <div className="flex justify-between items-center border-b pb-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Write a Review</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="text-base font-semibold text-gray-700">
            Your Rating
          </label>
          <div className="flex space-x-2 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                role="button"
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                className={`h-8 w-8 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary rounded-full ${
                  star <= rating
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
                onClick={() =>
                  setValue("rating", star, { shouldValidate: true })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setValue("rating", star, { shouldValidate: true });
                  }
                }}
                tabIndex={0}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <input
              type="hidden"
              {...register("rating", {
                required: "Rating is required",
                min: 1,
                max: 5,
              })}
            />
          </div>
          {errors.rating && (
            <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="review-title"
            className="text-base font-semibold text-gray-700"
          >
            Review Title (Optional)
          </label>
          <input
            id="review-title"
            type="text"
            className={`mt-2 block w-full border ${
              errors.title ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm p-3 focus:ring-2 focus:ring-primary focus:border-primary text-base transition-all duration-200`}
            placeholder="Give your review a title..."
            {...register("title", {
              maxLength: {
                value: 100,
                message: "Title must be 100 characters or less",
              },
            })}
            disabled={isSubmitting}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && (
            <p id="title-error" className="text-red-500 text-sm mt-1">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="review-text"
            className="text-base font-semibold text-gray-700"
          >
            Your Review
          </label>
          <textarea
            id="review-text"
            rows="6"
            className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-primary focus:border-primary text-base transition-all duration-200"
            placeholder="Tell us about your experience..."
            {...register("reviewText")}
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div>
          <label className="text-base font-semibold text-gray-700">
            Upload Images (up to 5)
          </label>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative w-full h-20">
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className={`object-cover rounded-lg border w-full h-full ${
                    image.uploading ? "opacity-50" : ""
                  }`}
                />
                {image.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-6 w-6 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
                {!image.uploading && (
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-black bg-opacity-60 text-white rounded-full flex items-center justify-center hover:bg-black focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {uploadedImages.length < 5 && (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary"
              >
                <svg
                  className="h-8 w-8 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14m7-7H5" />
                </svg>
                <span className="text-sm text-gray-500 mt-1">
                  ({uploadedImages.length}/5)
                </span>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  ref={fileInputRef}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="submit"
            className={`relative bg-primary text-white  rounded-sm text-base px-6 py-3 transition-all duration-200 focus:outline-none focus:ring-2  ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
            aria-label="Submit review"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
