"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

// NewAddressForm component for adding a new address
const NewAddressForm = ({ onSave, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    if (
      !data.street ||
      !data.city ||
      !data.zipCode ||
      !data.country ||
      !data.phoneNumber
    ) {
      return toast.error("All required fields must be filled out.");
    }

    try {
      const response = await fetch("/api/profile/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add address");
      }
      const { address } = await response.json();
      onSave(address);
      reset();
      toast.success("Address added successfully");
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        placeholder="Street Address"
        className="rounded-full"
        {...register("street", { required: "Street is required" })}
        aria-invalid={!!errors.street}
      />
      {errors.street && (
        <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
      )}

      <Input
        placeholder="City"
        className="rounded-full"
        {...register("city", { required: "City is required" })}
        aria-invalid={!!errors.city}
      />
      {errors.city && (
        <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
      )}

      <Input
        placeholder="State"
        className="rounded-full"
        {...register("state")}
      />

      <Input
        placeholder="Zip Code"
        type="text"
        className="rounded-full"
        {...register("zipCode", { required: "Zip Code is required" })}
        aria-invalid={!!errors.zipCode}
      />
      {errors.zipCode && (
        <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
      )}

      <Input
        placeholder="Country"
        className="rounded-full"
        {...register("country", { required: "Country is required" })}
        aria-invalid={!!errors.country}
      />
      {errors.country && (
        <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
      )}

      <Input
        placeholder="Phone Number"
        type="tel"
        className="rounded-full"
        {...register("phoneNumber", { required: "Phone number is required" })}
        aria-invalid={!!errors.phoneNumber}
      />
      {errors.phoneNumber && (
        <p className="text-red-500 text-sm mt-1">
          {errors.phoneNumber.message}
        </p>
      )}

      <div className="flex space-x-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className=" text-white rounded-sm font-semibold"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save Address"
          )}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="rounded-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default NewAddressForm;
