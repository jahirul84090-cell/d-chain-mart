// app/components/CategoryManagement.js
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import ImageViewer from "../../Media/ImageViewer";

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingCategoryId, setUpdatingCategoryId] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      id: "",
      name: "",
      slug: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const { categories } = await response.json();
      setCategories(categories);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
      setLoading(false);
    }
  }

  async function handleCreateOrUpdate(data) {
    const isUpdate = !!data.id;
    setCreating(isUpdate ? false : true);
    setUpdatingCategoryId(isUpdate ? data.id : null);
    try {
      const response = await fetch("/api/admin/categories", {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newCategory = await response.json();
        if (isUpdate) {
          setCategories(
            categories.map((cat) => (cat.id === data.id ? newCategory : cat))
          );
          setEditOpen(false);
        } else {
          setCategories([...categories, newCategory]);
          setCreateOpen(false);
        }
        toast.success(
          `Category ${isUpdate ? "updated" : "created"} successfully`
        );
        form.reset();
      } else {
        const { error } = await response.json();
        throw new Error(
          error || `Failed to ${isUpdate ? "update" : "create"} category`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isUpdate ? "updating" : "creating"} category:`,
        error
      );
      toast.error(
        error.message || `Failed to ${isUpdate ? "update" : "create"} category`
      );
    } finally {
      setCreating(false);
      setUpdatingCategoryId(null);
    }
  }

  async function handleDeleteCategory(categoryId) {
    setDeletingCategoryId(categoryId);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId }),
      });
      if (response.ok) {
        setCategories(categories.filter((cat) => cat.id !== categoryId));
        toast.success("Category deleted successfully");
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    } finally {
      setDeletingCategoryId(null);
    }
  }

  function openEditDialog(category) {
    form.setValue("id", category.id);
    form.setValue("name", category.name);
    form.setValue("slug", category.slug);
    form.setValue("imageUrl", category.imageUrl || "");
    setEditOpen(true);
  }

  function handleSelectImage(url) {
    form.setValue("imageUrl", url);
    setImageViewerOpen(false);
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Category Management
            </CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                  <DialogDescription>
                    Enter details for the new category.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleCreateOrUpdate)}
                    className="space-y-4"
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
                              placeholder="Category name"
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
                              placeholder="category-slug"
                              className="border-gray-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                {...field}
                                placeholder="Select an image"
                                className="border-gray-300"
                                readOnly
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setImageViewerOpen(true)}
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
                                  alt="Selected category image"
                                />
                                <AvatarFallback>CI</AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setCreateOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating || updatingCategoryId}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {creating ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-md" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No categories found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center space-x-4">
                    {category.imageUrl ? (
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={category.imageUrl}
                          alt={`${category.name} image`}
                        />
                        <AvatarFallback>
                          {category.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {category.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      <span className="font-medium">Slug:</span> {category.slug}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Image:</span>{" "}
                      {category.imageUrl ? (
                        <a
                          href={category.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Image
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => openEditDialog(category)}
                          className="border-gray-300"
                          disabled={updatingCategoryId === category.id}
                        >
                          {updatingCategoryId === category.id ? (
                            <Skeleton className="h-4 w-[60px]" />
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Category</DialogTitle>
                          <DialogDescription>
                            Update the category details.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(handleCreateOrUpdate)}
                            className="space-y-4"
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
                                      placeholder="Category name"
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
                                      placeholder="category-slug"
                                      className="border-gray-300"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        {...field}
                                        placeholder="Select an image"
                                        className="border-gray-300"
                                        readOnly
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setImageViewerOpen(true)}
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
                                          alt="Selected category image"
                                        />
                                        <AvatarFallback>CI</AvatarFallback>
                                      </Avatar>
                                    </div>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  form.reset();
                                  setEditOpen(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={updatingCategoryId}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {updatingCategoryId ? "Updating..." : "Update"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={deletingCategoryId === category.id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deletingCategoryId === category.id ? (
                            <Skeleton className="h-4 w-[60px]" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete the category{" "}
                            {category.name}? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deletingCategoryId === category.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingCategoryId === category.id
                              ? "Deleting..."
                              : "Confirm"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl p-0 border-0">
          <ImageViewer
            onSelect={handleSelectImage}
            onClose={() => setImageViewerOpen(false)}
            maxSelection={1}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
