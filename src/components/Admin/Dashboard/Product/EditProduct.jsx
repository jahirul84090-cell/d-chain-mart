// components/admin/products/EditProduct.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "react-toastify";
import { Loader2, ArrowLeft, Trash2, ImagePlus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import ImageViewer from "../Media/ImageViewer";

// Dynamically import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function EditProduct() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mainImageViewerOpen, setMainImageViewerOpen] = useState(false);
  const [imagesViewerOpen, setImagesViewerOpen] = useState(false);
  const router = useRouter();
  const { id } = useParams();

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      shortdescription: "",
      price: "",
      oldPrice: "",
      discount: 0,
      stockAmount: "",
      availableSizes: "",
      availableColors: "",
      isFeatured: false,
      isPopular: false,
      isNewArrival: false,
      isSlider: false,
      isActive: true, // New Field
      categoryId: "",
      mainImage: "",
      images: [],
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        toast.error("Product ID is missing.");
        router.push("/admin/products");
        return;
      }

      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/product/${id}`),
          fetch("/api/admin/categories"),
        ]);

        if (!productRes.ok) {
          throw new Error("Failed to fetch product");
        }
        if (!categoriesRes.ok) {
          throw new Error("Failed to fetch categories");
        }

        const { product } = await productRes.json();
        const { categories } = await categoriesRes.json();

        if (!product) {
          toast.error("Product not found");
          router.push("/admin/products");
          return;
        }

        // Set form values
        setValue("name", product.name);
        setValue("slug", product.slug);
        setValue("description", product.description || "");
        setValue("shortdescription", product.shortdescription || "");
        setValue("price", product.price?.toString() || "");
        setValue("oldPrice", product.oldPrice?.toString() || "");
        setValue("discount", product.discount || 0);
        setValue("stockAmount", product.stockAmount?.toString() || "");
        setValue("availableSizes", product.availableSizes);
        setValue("availableColors", product.availableColors);
        setValue("isFeatured", product.isFeatured);
        setValue("isPopular", product.isPopular);
        setValue("isNewArrival", product.isNewArrival);
        setValue("isSlider", product.isSlider);
        setValue("isActive", product.isActive); // Set new field
        setValue("categoryId", product.categoryId);
        setValue("mainImage", product.mainImage);
        setValue(
          "images",
          product.images.map((img) => img.url)
        );

        setCategories(categories);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, setValue, router]);

  // Effect for automatic discount calculation
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "price" || name === "oldPrice") {
        const price = parseFloat(value.price);
        const oldPrice = parseFloat(value.oldPrice);

        if (oldPrice > price && !isNaN(price) && !isNaN(oldPrice)) {
          const discount = ((oldPrice - price) / oldPrice) * 100;
          setValue("discount", Math.round(discount));
        } else {
          setValue("discount", 0);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const images = watch("images");
  const mainImage = watch("mainImage");

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      const payload = {
        id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortdescription: data.shortdescription,
        price: parseFloat(data.price),
        oldPrice: data.oldPrice ? parseFloat(data.oldPrice) : null,
        discount: data.discount,
        stockAmount: parseInt(data.stockAmount),
        availableSizes: data.availableSizes,
        availableColors: data.availableColors,
        isFeatured: data.isFeatured,
        isPopular: data.isPopular,
        isNewArrival: data.isNewArrival,
        isSlider: data.isSlider,
        isActive: data.isActive, // New field
        categoryId: data.categoryId,
        mainImage: data.mainImage,
        images: data.images,
      };

      const response = await fetch("/api/admin/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Product updated successfully! 🚀");
        router.push("/dashboard/product/manage");
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to update product.");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleSelectMainImage = (urls) => {
    setValue("mainImage", urls);
    setMainImageViewerOpen(false);
  };

  const handleSelectImages = (urls) => {
    setValue("images", urls);
    setImagesViewerOpen(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setValue("images", newImages);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-full bg-gray-100 min-h-screen font-sans">
        <Card className="shadow-2xl border-none rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-600 p-6">
            <Skeleton className="h-8 w-48 bg-gray-500 rounded-lg" />
          </CardHeader>
          <CardContent className="p-6 bg-white space-y-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24 bg-gray-200 rounded-md" />
                <Skeleton className="h-10 w-full bg-gray-200 rounded-lg" />
              </div>
            ))}
            <div className="flex justify-end space-x-3 mt-8">
              <Skeleton className="h-10 w-24 bg-gray-200 rounded-lg" />
              <Skeleton className="h-10 w-36 bg-gray-200 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-full bg-gray-100 min-h-screen font-sans text-gray-800">
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full h-10 w-10 text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Edit Product
        </h1>
      </div>

      <Card className="shadow-2xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-600 p-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-gray-900 font-medium">
                  Slug
                </Label>
                <Input
                  id="slug"
                  {...register("slug", { required: "Slug is required" })}
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.slug.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="shortdescription"
                className="text-gray-900 font-medium"
              >
                Short Description
              </Label>
              <Textarea
                id="shortdescription"
                {...register("shortdescription")}
                rows={3}
                maxLength={200}
                placeholder="A brief summary of the product (max 200 characters)"
                className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
              />
              {errors.shortdescription && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.shortdescription.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-gray-900 font-medium"
              >
                Description
              </Label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <ReactQuill
                    id="description"
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    className="bg-white rounded-lg"
                  />
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-gray-900 font-medium">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", {
                    required: "Price is required",
                    min: { value: 0, message: "Price must be positive" },
                    onChange: (e) => {
                      setValue("price", e.target.value);
                      trigger("oldPrice");
                    },
                  })}
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldPrice" className="text-gray-900 font-medium">
                  Old Price
                </Label>
                <Input
                  id="oldPrice"
                  type="number"
                  step="0.01"
                  {...register("oldPrice", {
                    min: {
                      value: 0,
                      message: "Old price must be non-negative",
                    },
                    validate: (value) =>
                      !value ||
                      parseFloat(value) >= parseFloat(watch("price")) ||
                      "Old price must be greater than or equal to current price",
                  })}
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                />
                {errors.oldPrice && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.oldPrice.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-gray-900 font-medium">
                  Discount (%)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  {...register("discount")}
                  readOnly
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="stockAmount"
                  className="text-gray-900 font-medium"
                >
                  Stock Amount
                </Label>
                <Input
                  id="stockAmount"
                  type="number"
                  {...register("stockAmount", {
                    required: "Stock amount is required",
                    min: { value: 0, message: "Stock must be non-negative" },
                  })}
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                />
                {errors.stockAmount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.stockAmount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="categoryId"
                  className="text-gray-900 font-medium"
                >
                  Category
                </Label>
                <Controller
                  name="categoryId"
                  control={form.control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="categoryId"
                        className="border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm"
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="availableSizes"
                  className="text-gray-900 font-medium"
                >
                  Available Sizes (comma-separated)
                </Label>
                <Input
                  id="availableSizes"
                  {...register("availableSizes")}
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                  placeholder="e.g., S, M, L, XL"
                />
                {errors.availableSizes && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.availableSizes.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="availableColors"
                  className="text-gray-900 font-medium"
                >
                  Available Colors (comma-separated)
                </Label>
                <Input
                  id="availableColors"
                  {...register("availableColors")}
                  className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
                  placeholder="e.g., Red, Blue, Black"
                />
                {errors.availableColors && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.availableColors.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 items-center pt-2 pb-2">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isFeatured"
                  className="text-gray-900 font-medium"
                >
                  Featured
                </Label>
                <Switch
                  id="isFeatured"
                  checked={watch("isFeatured")}
                  onCheckedChange={(checked) => setValue("isFeatured", checked)}
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isPopular"
                  className="text-gray-900 font-medium"
                >
                  Popular
                </Label>
                <Switch
                  id="isPopular"
                  checked={watch("isPopular")}
                  onCheckedChange={(checked) => setValue("isPopular", checked)}
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="isNewArrival"
                  className="text-gray-900 font-medium"
                >
                  New Arrival
                </Label>
                <Switch
                  id="isNewArrival"
                  checked={watch("isNewArrival")}
                  onCheckedChange={(checked) =>
                    setValue("isNewArrival", checked)
                  }
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="isSlider" className="text-gray-900 font-medium">
                  Slider
                </Label>
                <Switch
                  id="isSlider"
                  checked={watch("isSlider")}
                  onCheckedChange={(checked) => setValue("isSlider", checked)}
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="isActive" className="text-gray-900 font-medium">
                  Active
                </Label>
                <Switch
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainImage" className="text-gray-900 font-medium">
                Main Image
              </Label>
              <div className="flex items-center space-x-3">
                <Avatar className="h-16 w-16 border-2 border-gray-200 shadow-sm">
                  {mainImage ? (
                    <AvatarImage
                      src={mainImage}
                      alt="Main product image"
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-gray-600 font-semibold">
                      <ImagePlus className="h-8 w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMainImageViewerOpen(true)}
                  className="flex-grow justify-start border-gray-300 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-colors text-gray-700"
                >
                  {mainImage ? (
                    <span className="truncate">
                      {mainImage.split("/").pop()}
                    </span>
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5 mr-2" /> Select Main Image
                    </>
                  )}
                </Button>
                {mainImage && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => setValue("mainImage", "")}
                    className="rounded-lg shadow-sm"
                    aria-label="Remove main image"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
              {errors.mainImage && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.mainImage.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="images" className="text-gray-900 font-medium">
                Additional Images (up to 5)
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setImagesViewerOpen(true)}
                className="w-full justify-start border-gray-300 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-colors text-gray-700"
              >
                {images.length > 0 ? (
                  `${images.length} image(s) selected`
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5 mr-2" /> Select Additional
                    Images
                  </>
                )}
              </Button>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {images.map((url, index) => (
                    <div key={index} className="relative group flex-shrink-0">
                      <img
                        src={url}
                        alt={`Additional image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-md border border-gray-300 shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        onClick={() => handleRemoveImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/product/manage")}
                className="border-gray-300 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-all duration-200"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className=" rounded-lg font-medium shadow-sm transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />{" "}
                    Updating...
                  </>
                ) : (
                  "Update Product"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Conditional rendering of ImageViewer modals */}
      {mainImageViewerOpen && (
        <ImageViewer
          onSelect={handleSelectMainImage}
          onClose={() => setMainImageViewerOpen(false)}
          maxSelection={1}
        />
      )}
      {imagesViewerOpen && (
        <ImageViewer
          onSelect={handleSelectImages}
          onClose={() => setImagesViewerOpen(false)}
          maxSelection={10}
        />
      )}
    </div>
  );
}
