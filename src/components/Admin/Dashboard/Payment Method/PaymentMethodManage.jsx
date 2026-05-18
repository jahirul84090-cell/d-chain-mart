"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  Banknote,
  CreditCard,
  Wallet,
} from "lucide-react";

// Helper component to render the correct icon
const PaymentIcon = ({ name }) => {
  const normalizedName = name.toLowerCase();
  if (normalizedName.includes("cash on delivery")) {
    return <Banknote className="h-5 w-5 mr-2 text-green-500" />;
  }
  if (normalizedName.includes("nagad")) {
    return <Banknote className="h-5 w-5 mr-2 text-orange-500" />;
  }
  if (normalizedName.includes("bkash")) {
    return <CreditCard className="h-5 w-5 mr-2 text-pink-500" />;
  }
  return <Wallet className="h-5 w-5 mr-2 text-gray-500" />;
};

export default function PaymentMethodManager() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMethod, setCurrentMethod] = useState({
    id: null,
    name: "",
    accountNumber: "",
    instructions: "",
    isActive: true,
    isCashOnDelivery: false,
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState(null);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/payment-methods");
      if (!response.ok) throw new Error("Failed to fetch payment methods");
      const { paymentMethods } = await response.json();
      setPaymentMethods(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to fetch payment methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!currentMethod.name.trim()) {
      toast.error("Payment method name  cannot be empty.");
      return;
    }
    if (typeof currentMethod.isCashOnDelivery !== "boolean") {
      toast.error("Cash on Delivery status must be a boolean.");
      return;
    }

    setLoading(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const body = JSON.stringify(currentMethod);
      const response = await fetch("/api/admin/payment-methods", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok)
        throw new Error(
          `Failed to ${isEditing ? "update" : "add"} payment method`
        );

      toast.success(
        `Payment method ${isEditing ? "updated" : "added"} successfully!`
      );
      fetchPaymentMethods();
      setCurrentMethod({
        id: null,
        name: "",
        accountNumber: "",
        instructions: "",
        isActive: true,
        isCashOnDelivery: false,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to ${isEditing ? "update" : "add"} payment method: ${
          error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id) => {
    setMethodToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!methodToDelete) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: methodToDelete }),
      });

      if (!response.ok) throw new Error("Failed to delete payment method");

      toast.success("Payment method deleted successfully!");
      fetchPaymentMethods();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete payment method: " + error.message);
    } finally {
      setLoading(false);
      setMethodToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  const startEdit = (method) => {
    setIsEditing(true);
    setCurrentMethod({
      id: method.id,
      name: method.name,
      accountNumber: method.accountNumber,
      instructions: method.instructions || "",
      isActive: method.isActive,
      isCashOnDelivery: method.isCashOnDelivery,
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentMethod({
      id: null,
      name: "",
      accountNumber: "",
      instructions: "",
      isActive: true,
      isCashOnDelivery: false,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen">
      <Card className="shadow-2xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-600 p-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">
            Payment Method Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form
            onSubmit={handleAddOrUpdate}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            <Input
              type="text"
              placeholder="Payment Method Name"
              value={currentMethod.name}
              onChange={(e) =>
                setCurrentMethod({ ...currentMethod, name: e.target.value })
              }
              className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
              disabled={loading}
              aria-label="Payment method name"
            />
            <Input
              type="text"
              placeholder="Account Number"
              value={currentMethod.accountNumber}
              onChange={(e) =>
                setCurrentMethod({
                  ...currentMethod,
                  accountNumber: e.target.value,
                })
              }
              className="border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
              disabled={loading}
              aria-label="Account number"
            />
            <Textarea
              placeholder="Instructions (e.g., Bank details, Mobile number)"
              value={currentMethod.instructions}
              onChange={(e) =>
                setCurrentMethod({
                  ...currentMethod,
                  instructions: e.target.value,
                })
              }
              className="col-span-1 md:col-span-2 border-gray-300 focus:ring-teal-500 rounded-lg shadow-sm"
              disabled={loading}
              aria-label="Payment instructions"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={currentMethod.isActive}
                onCheckedChange={(checked) =>
                  setCurrentMethod({ ...currentMethod, isActive: checked })
                }
                disabled={loading}
                aria-label="Is active"
              />
              <Label htmlFor="isActive">Is Active?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCashOnDelivery"
                checked={currentMethod.isCashOnDelivery}
                onCheckedChange={(checked) =>
                  setCurrentMethod({
                    ...currentMethod,
                    isCashOnDelivery: checked,
                  })
                }
                disabled={loading}
                aria-label="Is Cash on Delivery"
              />
              <Label htmlFor="isCashOnDelivery">Is Cash on Delivery?</Label>
            </div>
            <div className="flex gap-2 justify-end col-span-1 md:col-span-2">
              {isEditing ? (
                <>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="mr-2 h-4 w-4" />
                    )}
                    Update
                  </Button>
                  <Button
                    type="button"
                    onClick={cancelEdit}
                    variant="outline"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="submit" className="" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Add Method
                </Button>
              )}
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center my-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>COD</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell>
                          <PaymentIcon name={method.name} />
                        </TableCell>
                        <TableCell>{method.name}</TableCell>
                        <TableCell>{method.accountNumber}</TableCell>
                        <TableCell>{method.isActive ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          {method.isCashOnDelivery ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(method)}
                            className=""
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(method.id)}
                            disabled={loading}
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
                        className="text-center text-gray-500 py-8"
                      >
                        No payment methods found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              payment method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
              disabled={loading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
