"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { Loader2, MapPin } from "lucide-react";

export default function AddAddress() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      phoneNumber: "",
      isDefault: false,
    },
  });

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/profile/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        toast.success("Address added successfully");
        router.push("/profile");
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to add address");
      }
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error(error.message || "Failed to add address");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border-gray-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary p-6 sm:p-8 flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-white mr-4" />
              <CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Add New Address
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-800">
                    Address Name
                  </Label>
                  <Input
                    {...register("name", {
                      required: "Address name is required",
                    })}
                    className="border-gray-300 rounded-lg focus-visible:ring-primary transition-colors"
                    placeholder="e.g. Home, Work, Vacation Home"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-800">Street</Label>
                  <Input
                    {...register("street", { required: "Street is required" })}
                    className="border-gray-300 rounded-lg focus-visible:ring-primary  transition-colors"
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.street.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-800">City</Label>
                  <Input
                    {...register("city", { required: "City is required" })}
                    className="border-gray-300 rounded-lg focus-visible:ring-primary  transition-colors"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-800">
                    State / Province
                  </Label>
                  <Input
                    {...register("state")}
                    className="border-gray-300 rounded-lg focus-visible:ring-primary  transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-800">
                    Zip Code
                  </Label>
                  <Input
                    {...register("zipCode")}
                    className="border-gray-300 rounded-lg focus-visible:ring-primary  transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-800">Country</Label>
                  <Input
                    {...register("country", {
                      required: "Country is required",
                    })}
                    className="border-gray-300 rounded-lg focus-visible:ring-primary  transition-colors"
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.country.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-800">
                    Phone Number
                  </Label>
                  <Input
                    {...register("phoneNumber")}
                    className="border-gray-300 rounded-lg focus-visible:ring-primary  transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Label
                  htmlFor="isDefault"
                  className="font-semibold text-gray-800"
                >
                  Set as Default Address
                </Label>
                <Switch
                  id="isDefault"
                  checked={watch("isDefault")}
                  onCheckedChange={(checked) => setValue("isDefault", checked)}
                  className="data-[state=checked]:bg-primary transition-colors"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-gray-300 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-medium shadow-sm transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary rounded-lg font-medium shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Save Address"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
