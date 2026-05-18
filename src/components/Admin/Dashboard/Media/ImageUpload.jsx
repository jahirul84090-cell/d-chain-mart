"use client";
import { useState } from "react";
import Image from "next/image";
import GalleryViewer from "./Gellary";

export default function ImageUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleFiles = (newFiles) => {
    setError("");

    const totalFiles = [...selectedFiles, ...newFiles];
    const maxFiles = 10;
    if (totalFiles.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} images at a time.`);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 10 * 1024 * 1024;
    const validNewFiles = newFiles.filter((file) => {
      if (!validTypes.includes(file.type)) {
        setError(
          `File type not allowed: ${file.name}. Only JPG, PNG, and JPEG files are supported.`
        );
        return false;
      }
      if (file.size > maxSize) {
        setError(
          `File size too large: ${file.name}. Each file must be under 10MB.`
        );
        return false;
      }
      return true;
    });

    if (validNewFiles.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...validNewFiles]);
      setPreviews((prevPreviews) => [
        ...prevPreviews,
        ...validNewFiles.map((file) => URL.createObjectURL(file)),
      ]);
      setError("");
    }
  };

  const handleFileChange = (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    handleFiles(files);
    event.target.value = null;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one image to upload.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const images = await response.json();
        setUploadedImages(images);
        setSelectedFiles([]);
        setPreviews([]);
        setError(
          `Successfully uploaded ${selectedFiles.length} image${
            selectedFiles.length > 1 ? "s" : ""
          }.`
        );
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to upload images.");
      }
    } catch (error) {
      setError("Error uploading images: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 transform transition-all duration-300 hover:scale-[1.01]">
          <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-800">
            Image Uploader
          </h1>
          <p className="text-center text-sm text-gray-500 mb-8">
            Upload images with clear previews and feedback. Click to select
            files.
          </p>

          <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center transition-colors duration-300 hover:border-blue-500 cursor-pointer group">
            <input
              id="file-input"
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-400 mb-4 transition-colors duration-300 group-hover:text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                ></path>
              </svg>
              <p className="text-lg font-semibold text-gray-600">
                Click here to{" "}
                <span className="text-blue-500 group-hover:underline">
                  browse
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                (PNG, JPG, JPEG up to 10MB each)
              </p>
            </div>
          </div>

          {error && (
            <div
              className={`mt-6 p-4 rounded-xl text-center ${
                error.includes("Successfully")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              } transition-all duration-300 animate-fade-in`}
            >
              <p>{error}</p>
            </div>
          )}

          {previews.length > 0 && (
            <div className="mt-8 animate-slide-in-up">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Selected Images ({selectedFiles.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative rounded-xl overflow-hidden shadow-lg aspect-square"
                  >
                    <Image
                      src={preview}
                      alt={`Preview ${index}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className={`w-full max-w-sm px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform shadow-lg ${
                    isLoading
                      ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 active:scale-95 text-white"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="animate-spin h-5 w-5 text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    `Upload ${selectedFiles.length} Image${
                      selectedFiles.length > 1 ? "s" : ""
                    }`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <GalleryViewer />
    </>
  );
}
