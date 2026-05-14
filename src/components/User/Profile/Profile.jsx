"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  Loader2,
  Trash2,
  Edit,
  MapPin,
  ChevronDown,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", image: null },
  });

  const watchImage = watch("image");

  useEffect(() => {
    // This effect handles the image preview
    if (watchImage && watchImage.length > 0) {
      const file = watchImage[0];
      setImagePreview(URL.createObjectURL(file));
      return () => URL.revokeObjectURL(imagePreview); // Clean up the URL
    } else {
      setImagePreview(null);
    }
  }, [watchImage]);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const userResponse = await fetch("/api/profile");
        if (!userResponse.ok) throw new Error("Failed to fetch user profile");
        const { user } = await userResponse.json();
        setUser(user);
        setValue("name", user.name || "");
        setImagePreview(user.image || null); // Set initial image preview

        const params = new URLSearchParams({ search });
        const addressResponse = await fetch(`/api/profile/address?${params}`);
        if (!addressResponse.ok) throw new Error("Failed to fetch addresses");
        const { addresses } = await addressResponse.json();
        setAddresses(addresses);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [search, setValue]);

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });
      if (response.ok) {
        const updatedUser = await response.json();

        setUser((prevUser) => ({ ...prevUser, ...updatedUser.user }));
        toast.success("Profile updated successfully");
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  const openDeleteModal = (address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setAddressToDelete(null);
    setShowDeleteModal(false);
  };

  async function handleDelete() {
    if (!addressToDelete) return;
    try {
      const response = await fetch("/api/profile/address", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: addressToDelete.id }),
      });
      if (response.ok) {
        toast.success("Address deleted successfully");
        setAddresses(
          addresses.filter((address) => address.id !== addressToDelete.id)
        );
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error.message || "Failed to delete address");
    } finally {
      closeDeleteModal();
    }
  }

  if (loading || !user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* User Profile Card */}
        <Card className="shadow-lg border border-gray-200 rounded-2xl mb-10 bg-white">
          <CardHeader className="p-6 sm:p-8 rounded-t-2xl">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Profile Image Section */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-md">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        layout="fill"
                        objectFit="cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <Label
                    htmlFor="image"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm shadow-sm text-white bg-primary transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Change Photo
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg, image/png"
                    {...register("image", {
                      validate: (value) => {
                        const file = value?.[0];
                        if (!file) return true; // Allow no file
                        if (file.size > 1 * 1024 * 1024) {
                          return "File size must be under 1MB.";
                        }
                        const fileType = file.type;
                        const validTypes = [
                          "image/jpeg",
                          "image/png",
                          "image/jpg",
                        ];
                        if (!validTypes.includes(fileType)) {
                          return "Only JPEG and PNG and JPG files are accepted.";
                        }
                        return true;
                      },
                    })}
                    className="hidden"
                  />
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.image.message}
                    </p>
                  )}
                </div>
                {/* Profile Details Section */}
                <div className="flex-1 space-y-6 w-full">
                  <div>
                    <Label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-gray-100 border-gray-300 focus:border-gray-300 focus:ring-0 rounded-full"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      className="border-gray-300 focus:ring-primary rounded-full shadow-sm"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-7 rounded-sm bg-primary font-semibold shadow-lg transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Addresses Card */}
        <Card className="shadow-lg border border-gray-200 rounded-2xl bg-white">
          <CardHeader className="p-6 sm:p-8 rounded-t-2xl">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Your Addresses
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage your shipping and billing addresses.
            </p>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
              <Input
                placeholder="Search by city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-80 border-gray-300 focus:ring-primary rounded-full shadow-sm"
              />
              <Link href="/profile/address/add" className="w-full md:w-auto">
                <Button className="w-full h-11 px-7 rounded-sm bg-primary  font-semibold shadow-lg transition-colors">
                  <Plus className="h-4 w-4 mr-2" /> Add New Address
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : addresses.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    className="shadow-sm hover:shadow-md transition-shadow relative border border-gray-200 rounded-2xl bg-white"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-6 w-6 text-gray-500" />
                          <h3 className="font-semibold text-lg text-gray-900">
                            {address.street}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 rounded-full"
                            >
                              <span className="sr-only">Open menu</span>
                              <ChevronDown className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/profile/addresses/edit/${address.id}`
                                )
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteModal(address)}
                            >
                              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="text-gray-600 space-y-1 text-sm">
                        <p>
                          {address.city},{" "}
                          {address.state ? `${address.state}, ` : ""}
                          {address.zipCode}
                        </p>
                        <p>{address.country}</p>
                        {address.phoneNumber && (
                          <p>Phone: {address.phoneNumber}</p>
                        )}
                      </div>
                      {address.isDefault && (
                        <span className="mt-4 inline-block px-3 py-1 text-xs font-bold text-primary bg-purple-50 rounded-full">
                          Default Address
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500">
                <p>No addresses found. Add a new one to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the address at{" "}
                <span className="font-semibold">{addressToDelete?.street}</span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={closeDeleteModal}
                  variant="outline"
                  className="rounded-full font-semibold px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold px-6"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
