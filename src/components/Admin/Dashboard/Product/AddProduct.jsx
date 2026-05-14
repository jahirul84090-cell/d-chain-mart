"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";

// Import with dynamic
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import ImageViewer from "../Media/ImageViewer";
import { Textarea } from "@/components/ui/textarea";

// Use dynamic import to prevent server-side rendering
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

export default function AddProduct() {
  const [categories, setCategories] = useState([]);
  const [creating, setCreating] = useState(false);
  const [mainImageViewerOpen, setMainImageViewerOpen] = useState(false);
  const [imagesViewerOpen, setImagesViewerOpen] = useState(false);
  const router = useRouter();

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
      isActive: true, // New field for isActive
      categoryId: "",
      mainImage: "",
      images: [],
    },
  });

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const { categories } = await response.json();
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to fetch categories");
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "price" || name === "oldPrice") {
        const price = parseFloat(value.price);
        const oldPrice = parseFloat(value.oldPrice);

        if (oldPrice > price && !isNaN(price) && !isNaN(oldPrice)) {
          const discount = ((oldPrice - price) / oldPrice) * 100;
          form.setValue("discount", Math.round(discount));
        } else {
          form.setValue("discount", 0);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  async function handleCreate(data) {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        toast.success("Product created successfully");
        router.push("/dashboard/product/manage");
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setCreating(false);
    }
  }

  function handleSelectMainImage(url) {
    form.setValue("mainImage", url);
    setMainImageViewerOpen(false);
  }

  function handleSelectImages(urls) {
    form.setValue("images", urls);
    setImagesViewerOpen(false);
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Add Product
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/product/manage")}
              className="border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Product name"
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                rules={{ required: "Slug is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="product-slug"
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shortdescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="A brief summary of the product (max 200 characters)"
                        rows={3}
                        maxLength={200}
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Controller
                        name="description"
                        control={form.control}
                        render={({ field: { onChange, value } }) => (
                          <ReactQuill
                            theme="snow"
                            value={value}
                            onChange={onChange}
                            modules={quillModules}
                            placeholder="Product description"
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                rules={{
                  required: "Price is required",
                  min: { value: 0, message: "Price must be non-negative" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => {
                          field.onChange(e);
                          form.trigger("oldPrice");
                        }}
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oldPrice"
                rules={{
                  min: {
                    value: 0,
                    message: "Old price must be non-negative",
                  },
                  validate: (value) =>
                    !value ||
                    parseFloat(value) >= parseFloat(form.getValues("price")) ||
                    "Old price must be greater than or equal to current price",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Old Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00 (optional)"
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="0"
                        className="border-gray-300"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockAmount"
                rules={{
                  required: "Stock amount is required",
                  min: { value: 0, message: "Stock must be non-negative" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="0"
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableSizes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Sizes (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="S,M,L,XL (optional)"
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableColors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Colors (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Red,Blue,Green (optional)"
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mainImage"
                rules={{ required: "Main image is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Image</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          {...field}
                          placeholder="Select main image"
                          className="border-gray-300"
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMainImageViewerOpen(true)}
                        >
                          Choose Image
                        </Button>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={field.value}
                            alt="Main product image"
                          />
                          <AvatarFallback>PI</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Images (up to 10)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={
                            field.value.length
                              ? `${field.value.length} image(s) selected`
                              : ""
                          }
                          placeholder="Select additional images"
                          className="border-gray-300"
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setImagesViewerOpen(true)}
                        >
                          Choose Images
                        </Button>
                      </div>
                    </FormControl>
                    {field.value.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {field.value.map((url, index) => (
                          <Avatar key={index} className="h-12 w-12">
                            <AvatarImage
                              src={url}
                              alt={`Additional image ${index + 1}`}
                            />
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-4 space-y-3 flex-col md:flex-row">
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Featured</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Popular</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isNewArrival"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>New Arrival</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isSlider"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Slider</FormLabel>
                    </FormItem>
                  )}
                />
                {/* New isActive Switch */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/product/manage")}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="">
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

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
