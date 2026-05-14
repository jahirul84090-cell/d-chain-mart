"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  PlusCircle,
  Trash2,
  Save,
  Users,
  Truck,
  ShoppingCart,
  DollarSign,
  CreditCard,
  MapPin,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Combobox } from "@/components/ui/combobox";

// Helper function for currency formatting (Bangladeshi Taka - BDT)
const formatCurrency = (amount) => {
  return (
    (amount || 0).toLocaleString("en-BD", {
      style: "currency",
      currency: "BDT",
    }) || "৳0.00"
  );
};

// --- Component Start ---

export default function ManualInvoiceCreatorPage() {
  const router = useRouter();

  // --- State Management (Omitted for brevity) ---
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZipCode, setShippingZipCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingPhoneNumber, setShippingPhoneNumber] = useState("");
  const [lineItems, setLineItems] = useState([
    {
      id: Date.now(),
      productId: "",
      productName: "",
      quantity: 1,
      price: 0,
      snapshot: {},
    },
  ]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [selectedPaymentMethodName, setSelectedPaymentMethodMethodName] =
    useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);

  // Memoized product list for Combobox
  const productComboboxItems = useMemo(() => {
    return availableProducts.map((p) => ({
      label: `${p.name} (${formatCurrency(p.price)})`,
      value: p.id,
    }));
  }, [availableProducts]);

  // Memoized payment methods for Combobox
  const paymentMethodComboboxItems = useMemo(() => {
    return availablePaymentMethods.map((pm) => ({
      label: pm.name,
      value: pm.name,
    }));
  }, [availablePaymentMethods]);

  // --- Data Fetching Effects (Omitted for brevity) ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await fetch("/api/admin/product");
        if (!response.ok) {
          throw new Error("Failed to fetch products.");
        }
        const data = await response.json();
        setAvailableProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products: " + error.message);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoadingPaymentMethods(true);
      try {
        const response = await fetch("/api/admin/payment-methods");
        if (!response.ok) {
          throw new Error("Failed to fetch payment methods.");
        }
        const data = await response.json();
        setAvailablePaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast.error("Failed to load payment methods: " + error.message);
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  // --- Handlers ---
  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now(),
        productId: "",
        productName: "",
        quantity: 1,
        price: 0,
        snapshot: {},
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    const newLineItems = lineItems.filter((item) => item.id !== id);
    setLineItems(newLineItems);
  };

  const handleItemChange = (itemId, field, value) => {
    const newLineItems = [...lineItems];
    const index = newLineItems.findIndex((item) => item.id === itemId);

    if (index === -1) return;

    if (field === "productId") {
      const selectedProduct = availableProducts.find((p) => p.id === value);
      if (selectedProduct) {
        newLineItems[index].productId = selectedProduct.id;
        newLineItems[index].productName = selectedProduct.name;
        newLineItems[index].price = selectedProduct.price || 0;
        newLineItems[index].snapshot = {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price || 0,
          imageUrl: selectedProduct.mainImage,
          category: selectedProduct.category?.name,
        };
      } else {
        newLineItems[index].productId = "";
        newLineItems[index].productName = "";
        newLineItems[index].price = 0;
        newLineItems[index].snapshot = {};
      }
    } else if (field === "price" || field === "quantity") {
      newLineItems[index][field] = +value >= 0 ? +value : 0;
    } else {
      newLineItems[index][field] = value;
    }
    setLineItems(newLineItems);
  };

  // --- Calculations ---
  const calculateSubtotal = () => {
    return lineItems.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const fee = parseFloat(deliveryFee) || 0;
    return subtotal + fee;
  };

  // --- Submission Handler (Omitted for brevity) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const requiredFields = [
      customerEmail,
      customerName,
      shippingStreet,
      shippingCity,
      shippingZipCode,
      shippingCountry,
      shippingPhoneNumber,
      selectedPaymentMethodName,
    ];

    const hasEmptyField = requiredFields.some((field) => !field);
    const hasInvalidLineItem = lineItems.some(
      (item) => !item.productId || item.quantity <= 0 || item.price <= 0
    );
    const hasNoLineItems = lineItems.length === 0;

    if (hasEmptyField || hasInvalidLineItem || hasNoLineItems) {
      toast.error(
        "Please complete all customer and shipping fields, and ensure all line items have a selected product, quantity > 0, and price > 0."
      );
      setIsSubmitting(false);
      return;
    }

    const payload = {
      customerEmail,
      customerName,
      shippingAddress: {
        street: shippingStreet,
        city: shippingCity,
        state: shippingState,
        zipCode: shippingZipCode,
        country: shippingCountry,
        phoneNumber: shippingPhoneNumber,
      },
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        snapshot: item.snapshot,
      })),
      deliveryFee: parseFloat(deliveryFee) || 0,
      paymentMethod: selectedPaymentMethodName,
    };

    try {
      const response = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invoice.");
      }

      const { newOrder } = await response.json();
      toast.success(`Invoice for Order #${newOrder.id} created successfully!`);
      router.push(`/dashboard/order/manage`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Creation Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl min-h-screen">
      <ToastContainer position="top-center" autoClose={5000} />
      <Card className="shadow-2xl border-2 border-gray-100 rounded-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gray-800 text-white p-6 sm:p-8">
          <CardTitle className="text-3xl font-extrabold tracking-tight flex items-center">
            <Save className="mr-3 h-8 w-8 text-indigo-400" /> Manual Order &amp;
            Invoice Creator
          </CardTitle>
          <CardDescription className="text-gray-400 mt-1">
            Generate a new sales order and associated invoice for a customer.
          </CardDescription>
        </CardHeader>
        {/* Content */}
        <CardContent className="p-6 md:p-8 space-y-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Card (omitted for brevity) */}
              <Card className="bg-white border border-gray-200 shadow-md">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <Users className="mr-2 h-6 w-6 text-indigo-600" /> Customer
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      Customer Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">
                      Customer Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g., john.doe@example.com"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Card (omitted for brevity) */}
              <Card className="bg-white border border-gray-200 shadow-md">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <MapPin className="mr-2 h-6 w-6 text-indigo-600" /> Shipping
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-full">
                      <Label htmlFor="street">
                        Street Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="street"
                        value={shippingStreet}
                        onChange={(e) => setShippingStreet(e.target.value)}
                        placeholder="123 Main St"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="Anytown"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        placeholder="CA"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">
                        Zip / Postal Code{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="zipCode"
                        value={shippingZipCode}
                        onChange={(e) => setShippingZipCode(e.target.value)}
                        placeholder="12345"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="country"
                        value={shippingCountry}
                        onChange={(e) => setShippingCountry(e.target.value)}
                        placeholder="Bangladesh"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={shippingPhoneNumber}
                        onChange={(e) => setShippingPhoneNumber(e.target.value)}
                        placeholder="+8801XXXXXXXXX"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-8" />

            {/* Line Items - NEW: Added z-20 for higher stacking context */}
            <Card className="bg-white border border-gray-200 shadow-lg relative z-20">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <ShoppingCart className="mr-2 h-6 w-6 text-indigo-600" /> Line
                  Items
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="font-semibold text-indigo-600 border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    // Retain relative positioning here for z-index to work
                    className="relative flex flex-col md:flex-row items-end gap-4 p-4 rounded-lg border border-gray-300 bg-gray-50"
                    style={{ overflow: "hidden" }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                      <div
                        className="space-y-2 col-span-1 md:col-span-2 relative overflow-hidden"
                        // Setting a very high Z-index on the Combobox container, descending for later items.
                        style={{ zIndex: 50 - index }}
                      >
                        <Label>
                          Product <span className="text-red-500">*</span>
                        </Label>
                        {isLoadingProducts ? (
                          <div className="flex h-10 items-center justify-center rounded-md bg-white border border-gray-300">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                          </div>
                        ) : (
                          <Combobox
                            items={productComboboxItems}
                            value={item.productId}
                            onValueChange={(value) =>
                              handleItemChange(item.id, "productId", value)
                            }
                            placeholder="Search or select product..."
                          />
                        )}
                      </div>

                      {/* Quantity Input */}
                      <div className="space-y-2">
                        <Label>
                          Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          min="1"
                          required
                          placeholder="1"
                        />
                      </div>
                      {/* Price Input */}
                      <div className="space-y-2">
                        <Label>
                          Unit Price ({formatCurrency(0).slice(0, 1)}){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(item.id, "price", e.target.value)
                          }
                          min="0.01"
                          step="0.01"
                          required
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-2 shrink-0 h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {lineItems.length === 0 && (
                  <p className="text-center text-gray-500 py-4 border-dashed border-2 rounded-lg">
                    No items added. Please add at least one product.
                  </p>
                )}
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Payment and Summary (Omitted for brevity) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-white border border-gray-200 shadow-md">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <CreditCard className="mr-2 h-6 w-6 text-indigo-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">
                      Payment Method Name{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    {isLoadingPaymentMethods ? (
                      <div className="flex h-10 items-center justify-center rounded-md bg-gray-100 border border-gray-300">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      </div>
                    ) : (
                      <Combobox
                        items={paymentMethodComboboxItems}
                        value={selectedPaymentMethodName}
                        onValueChange={setSelectedPaymentMethodMethodName}
                        placeholder="Select payment method..."
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-md flex flex-col justify-between">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <DollarSign className="mr-2 h-6 w-6 text-indigo-600" />{" "}
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between text-lg text-gray-600">
                    <div>Subtotal:</div>
                    <div>{formatCurrency(calculateSubtotal())}</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryFee">
                      Delivery Fee ({formatCurrency(0).slice(0, 1)})
                    </Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center justify-between text-3xl font-extrabold text-gray-900 border-t pt-4">
                    <div>Total:</div>
                    <div>{formatCurrency(calculateTotal())}</div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || lineItems.length === 0}
                    className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Invoice...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Create Order &amp; Invoice
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
