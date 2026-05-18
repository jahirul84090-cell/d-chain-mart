// app/admin/delivery-fees/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

// Helper function to format date for better readability
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function AdminDeliveryFeesPage() {
  const router = useRouter();

  const [deliveryFees, setDeliveryFees] = useState([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [formState, setFormState] = useState({
    id: null,
    city: "",
    country: "",
    amount: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetches delivery fees from the API
  const fetchDeliveryFees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (countryFilter) {
        params.append("country", countryFilter);
      }
      const response = await fetch(
        `/api/admin/delivery-fees?${params.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch delivery fees.");
      }
      const { deliveryFees: fees } = await response.json();
      setDeliveryFees(fees);
    } catch (error) {
      toast.error(`Error loading delivery fees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryFees();
  }, [countryFilter]);

  // Handles changes to form input fields
  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  // Validates the form data before submission
  const validateForm = () => {
    const errors = {};
    if (!formState.country.trim()) {
      errors.country = "Country is required.";
    }
    if (!formState.amount) {
      errors.amount = "Amount is required.";
    } else if (parseFloat(formState.amount) < 0) {
      errors.amount = "Amount cannot be negative.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handles form submission for both creating and updating a delivery fee
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const isEditing = !!formState.id;
    const method = isEditing ? "PATCH" : "POST";

    const body = {
      ...formState,
      amount: parseFloat(formState.amount),
    };

    try {
      const response = await fetch("/api/admin/delivery-fees", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditing ? "update" : "create"} delivery fee.`
        );
      }

      const { deliveryFee } = await response.json();
      setDeliveryFees((prev) =>
        isEditing
          ? prev.map((fee) => (fee.id === deliveryFee.id ? deliveryFee : fee))
          : [deliveryFee, ...prev]
      );

      toast.success(
        `Delivery fee ${isEditing ? "updated" : "created"} successfully.`
      );
      resetForm();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Populates the form with data for editing
  const handleEdit = (fee) => {
    setFormState({
      id: fee.id,
      city: fee.city || "",
      country: fee.country,
      amount: fee.amount.toString(),
    });
    setFormErrors({});
  };

  // Opens the delete confirmation dialog
  const handleDeleteConfirmation = (id) => {
    setDeleteId(id);
  };

  // Executes the deletion of a delivery fee
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/delivery-fees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: deleteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete delivery fee.");
      }

      setDeliveryFees((prev) => prev.filter((fee) => fee.id !== deleteId));
      toast.success("Delivery fee deleted successfully.");
      setDeleteId(null);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Resets the form to its initial state
  const resetForm = () => {
    setFormState({ id: null, city: "", country: "", amount: "" });
    setFormErrors({});
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const formButtonLabel = formState.id ? "Update Fee" : "Add Fee";

  return (
    <div className="container mx-auto p-6 max-w-7xl bg-gray-100 min-h-screen">
      <Card className="shadow-lg border-none rounded-xl overflow-hidden mb-8">
        <CardHeader className="bg-gray-800 p-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">
            {formState.id ? "Edit Delivery Fee" : "Add Delivery Fee"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="space-y-2">
              <Label htmlFor="country" className="font-medium text-gray-700">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                id="country"
                value={formState.country}
                onChange={handleFormChange}
                placeholder="e.g., Bangladesh"
                className={formErrors.country ? "border-red-500" : ""}
                aria-invalid={!!formErrors.country}
                aria-describedby="country-error"
              />
              {formErrors.country && (
                <p id="country-error" className="text-sm text-red-500">
                  {formErrors.country}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="font-medium text-gray-700">
                City (Optional)
              </Label>
              <Input
                id="city"
                value={formState.city}
                onChange={handleFormChange}
                placeholder="e.g., Dhaka"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-medium text-gray-700">
                Amount (৳) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formState.amount}
                onChange={handleFormChange}
                placeholder="e.g., 100"
                className={formErrors.amount ? "border-red-500" : ""}
                aria-invalid={!!formErrors.amount}
                aria-describedby="amount-error"
              />
              {formErrors.amount && (
                <p id="amount-error" className="text-sm text-red-500">
                  {formErrors.amount}
                </p>
              )}
            </div>
            <div className="col-span-full flex space-x-4 mt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {formButtonLabel}
              </Button>
              {formState.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <hr className="my-8 border-gray-300" />

      <Card className="shadow-lg border-none rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-800 p-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">
            Manage Delivery Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="mb-6">
            <Label
              htmlFor="countryFilter"
              className="font-medium text-gray-700"
            >
              Filter by Country
            </Label>
            <Input
              id="countryFilter"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              placeholder="e.g., Bangladesh"
              className="mt-1 w-full md:w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-gray-700">ID</TableHead>
                  <TableHead className="text-gray-700">Country</TableHead>
                  <TableHead className="text-gray-700">City</TableHead>
                  <TableHead className="text-gray-700 text-right">
                    Amount (৳)
                  </TableHead>
                  <TableHead className="text-gray-700">Created At</TableHead>
                  <TableHead className="text-gray-700 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryFees.length > 0 ? (
                  deliveryFees.map((fee) => (
                    <TableRow
                      key={fee.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-mono">
                        {fee.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{fee.country}</TableCell>
                      <TableCell>{fee.city || "N/A"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ৳ {fee.amount.toLocaleString("en-BD")}
                      </TableCell>
                      <TableCell>{formatDate(fee.createdAt)}</TableCell>
                      <TableCell className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(fee)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteConfirmation(fee.id)}
                          disabled={isSubmitting || isDeleting}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500 py-6"
                    >
                      No delivery fees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this delivery fee? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row-reverse sm:space-x-2 sm:space-x-reverse">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
