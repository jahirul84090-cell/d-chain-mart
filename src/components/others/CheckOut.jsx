// src/app/(main)/order-now/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowLeft,
  ShoppingBasket,
  AlertCircle,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";
import useCartStore from "@/lib/cartStore";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the validation schema using Zod
const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  company: z.string().optional(),
  country: z.string().min(1, { message: "Country is required." }),
  streetAddress: z.string().min(1, { message: "Street address is required." }),
  apartment: z.string().optional(),
  town: z.string().min(1, { message: "Town/City is required." }),
  state: z.string().min(1, { message: "State/Division is required." }),
  zip: z.string().min(1, { message: "ZIP Code/Postal Code is required." }),
  phone: z.string().min(1, { message: "Phone number is required." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .min(1, { message: "Email address is required." }),
  createAccount: z.boolean().optional(),
  shipToDifferent: z.boolean().optional(),
  orderNotes: z.string().optional(),
});

export default function OrderNowPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { cartItems, cartId, clearCart } = useCartStore();
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      country: "Bangladesh",
      streetAddress: "",
      apartment: "",
      town: "",
      state: "Dhaka",
      zip: "",
      phone: "",
      email: "",
      createAccount: false,
      shipToDifferent: false,
      orderNotes: "",
    },
  });

  const country = watch("country");
  const state = watch("state");

  const fetchAddresses = async () => {
    try {
      const addressResponse = await fetch("/api/profile/address");
      if (!addressResponse.ok) {
        throw new Error("Failed to fetch addresses");
      }
      const { addresses: fetchedAddresses } = await addressResponse.json();
      setAddresses(fetchedAddresses);
      if (fetchedAddresses.length) {
        const defaultAddress =
          fetchedAddresses.find((addr) => addr.isDefault) ||
          fetchedAddresses[0];
        reset({
          firstName: defaultAddress.firstName || "",
          lastName: defaultAddress.lastName || "",
          company: defaultAddress.company || "",
          country: defaultAddress.country || "Bangladesh",
          streetAddress: defaultAddress.street || "",
          apartment: defaultAddress.apartment || "",
          town: defaultAddress.city || "",
          state: defaultAddress.state || "Dhaka",
          zip: defaultAddress.zipCode || "",
          phone: defaultAddress.phoneNumber || "",
          email: defaultAddress.email || "",
          createAccount: false,
          shipToDifferent: false,
          orderNotes: "",
        });
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses: " + error.message);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [paymentResponse, deliveryFeeResponse] = await Promise.all([
          fetch("/api/admin/payment-methods"),
          fetch("/api/admin/delivery-fees"),
        ]);

        if (!paymentResponse.ok) {
          throw new Error("Failed to fetch payment methods");
        }
        if (!deliveryFeeResponse.ok) {
          throw new Error("Failed to fetch delivery fee");
        }

        const { paymentMethods } = await paymentResponse.json();
        const { deliveryFees } = await deliveryFeeResponse.json();

        setPaymentMethods(paymentMethods);
        if (paymentMethods.length) {
          setSelectedPaymentMethodId(paymentMethods[0].id);
        }

        setDeliveryFees(deliveryFees);
        await fetchAddresses();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reset]);

  const handleAddressSelect = (addressId) => {
    const selectedAddress = addresses.find((addr) => addr.id === addressId);
    if (selectedAddress) {
      reset({
        firstName: selectedAddress.firstName || "",
        lastName: selectedAddress.lastName || "",
        company: selectedAddress.company || "",
        country: selectedAddress.country || "Bangladesh",
        streetAddress: selectedAddress.street || "",
        apartment: selectedAddress.apartment || "",
        town: selectedAddress.city || "",
        state: selectedAddress.state || "Dhaka",
        zip: selectedAddress.zipCode || "",
        phone: selectedAddress.phoneNumber || "",
        email: selectedAddress.email || "",
        createAccount: false,
        shipToDifferent: false,
        orderNotes: "",
      });
    }
  };

  const onSaveAddress = async (data) => {
    setIsSavingAddress(true);
    try {
      const response = await fetch("/api/profile/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save address.");
      }

      await fetchAddresses();
      toast.success("Address saved successfully!");
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address: " + error.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const getDeliveryFee = (currentCountry, currentState) => {
    const matchedFee = deliveryFees.find(
      (fee) =>
        fee.country?.toLowerCase() === currentCountry?.toLowerCase() &&
        (!fee.city || fee.city?.toLowerCase() === currentState?.toLowerCase())
    );
    return matchedFee?.amount || 150;
  };

  const onPlaceOrder = async (data) => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions.");
      return;
    }
    if (!selectedPaymentMethodId) {
      toast.error("Please select a payment method");
      return;
    }
    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }
    if (!transactionNumber) {
      toast.error("Please enter a transaction number");
      return;
    }

    setSubmitting(true);
    try {
      const deliveryFee = getDeliveryFee(data.country, data.state);
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          shippingAddress: data,
          paymentMethodId: selectedPaymentMethodId,
          transactionNumber,
          cartItems,
          deliveryFee,
        }),
      });
      if (!response.ok) throw new Error("Failed to place order");
      const { order } = await response.json();
      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPaymentMethod = paymentMethods.find(
    (pm) => pm.id === selectedPaymentMethodId
  );
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const currentDeliveryFee = getDeliveryFee(country, state);
  const totalAmount = (subtotal + currentDeliveryFee).toFixed(2);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center min-h-screen items-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Checkout Header */}
        <div className="mb-8 sm:mb-12 flex items-center">
          <Link href="/cart" passHref>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full mr-4 text-gray-500 hover:text-purple-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Checkout
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Billing Details Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Billing Details
            </h2>
            {addresses.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select a saved address
                </label>
                <Select
                  value={
                    addresses.find((addr) =>
                      Object.keys(addr).every((key) => {
                        const formKey = {
                          firstName: "firstName",
                          lastName: "lastName",
                          company: "company",
                          country: "country",
                          street: "streetAddress",
                          apartment: "apartment",
                          city: "town",
                          state: "state",
                          zipCode: "zip",
                          phoneNumber: "phone",
                          email: "email",
                        }[key];
                        if (formKey) {
                          const formValue = watch(formKey);
                          return (
                            String(formValue || "") === String(addr[key] || "")
                          );
                        }
                        return true;
                      })
                    )?.id || ""
                  }
                  onValueChange={handleAddressSelect}
                >
                  <SelectTrigger className="w-full p-3 rounded-lg border-gray-300">
                    <SelectValue placeholder="Select a saved address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        {`${address.firstName} ${address.lastName} - ${address.street}, ${address.city}, ${address.state}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    {...register("firstName")}
                    className={`w-full p-3 rounded-lg ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.firstName && (
                    <div className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.firstName.message}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    {...register("lastName")}
                    className={`w-full p-3 rounded-lg ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.lastName && (
                    <div className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.lastName.message}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company name (optional)
                </label>
                <Input
                  type="text"
                  {...register("company")}
                  className="w-full p-3 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country / Region <span className="text-red-500">*</span>
                </label>
                <Select
                  name="country"
                  onValueChange={(value) =>
                    reset({ ...watch(), country: value })
                  }
                  value={country}
                >
                  <SelectTrigger className="w-full p-3 rounded-lg border-gray-300">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="USA">United States (US)</SelectItem>
                    <SelectItem value="CAN">Canada</SelectItem>
                    <SelectItem value="MEX">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    {...register("streetAddress")}
                    placeholder="House number and street name"
                    className={`w-full p-3 rounded-lg ${
                      errors.streetAddress
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.streetAddress && (
                    <div className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.streetAddress.message}
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    type="text"
                    {...register("apartment")}
                    placeholder="Apartment, suite, unit, etc. (optional)"
                    className="w-full p-3 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Town / City <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  {...register("town")}
                  className={`w-full p-3 rounded-lg ${
                    errors.town ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.town && (
                  <div className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.town.message}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State / Division <span className="text-red-500">*</span>
                </label>
                <Select
                  name="state"
                  onValueChange={(value) => reset({ ...watch(), state: value })}
                  value={state}
                >
                  <SelectTrigger className="w-full p-3 rounded-lg border-gray-300">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dhaka">Dhaka</SelectItem>
                    <SelectItem value="Chattogram">Chattogram</SelectItem>
                    <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                    <SelectItem value="Khulna">Khulna</SelectItem>
                    <SelectItem value="Barishal">Barishal</SelectItem>
                    <SelectItem value="Sylhet">Sylhet</SelectItem>
                    <SelectItem value="Mymensingh">Mymensingh</SelectItem>
                    <SelectItem value="Rangpur">Rangpur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code / Postal Code <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  {...register("zip")}
                  className={`w-full p-3 rounded-lg ${
                    errors.zip ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.zip && (
                  <div className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.zip.message}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  {...register("phone")}
                  className={`w-full p-3 rounded-lg ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.phone && (
                  <div className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.phone.message}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  {...register("email")}
                  className={`w-full p-3 rounded-lg ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.email && (
                  <div className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email.message}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createAccount"
                  {...register("createAccount")}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="createAccount"
                  className="text-sm font-medium text-gray-700"
                >
                  Create an account?
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="shipToDifferent"
                  {...register("shipToDifferent")}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="shipToDifferent"
                  className="text-sm font-medium text-gray-700"
                >
                  Ship to a different address?
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order notes (optional)
                </label>
                <textarea
                  {...register("orderNotes")}
                  placeholder="Notes about your order, e.g. special notes for delivery."
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                ></textarea>
              </div>
              <Button
                onClick={handleSubmit(onSaveAddress)}
                type="button"
                className="w-full rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3"
                disabled={isSavingAddress}
              >
                {isSavingAddress ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Address
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Your Order Section */}
          <div>
            <Card className="shadow-lg border border-gray-200 rounded-2xl bg-white sticky top-4">
              <CardHeader className="p-6 sm:p-8 rounded-t-2xl border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left font-bold text-gray-700 pb-2">
                        Product
                      </th>
                      <th className="text-right font-bold text-gray-700 pb-2">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <td className="py-4 text-sm text-gray-700">
                          <div className="flex items-center space-x-4">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Quantity: {item.quantity}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Price: ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">
                      Subtotal
                    </span>
                    <span className="text-gray-900 font-bold">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">
                      Shipping
                    </span>
                    <div className="text-right">
                      <span className="text-gray-700">
                        ${currentDeliveryFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-lg font-extrabold text-gray-900">
                    <span>Total</span>
                    <span>${totalAmount}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4 mb-6">
                  <Select
                    value={selectedPaymentMethodId}
                    onValueChange={setSelectedPaymentMethodId}
                  >
                    <SelectTrigger className="w-full p-3 rounded-lg">
                      <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPaymentMethod && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">
                        {selectedPaymentMethod.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Account Number: {selectedPaymentMethod.accountNumber}
                      </p>
                      {selectedPaymentMethod.instructions && (
                        <p className="text-sm text-gray-600">
                          Instructions: {selectedPaymentMethod.instructions}
                        </p>
                      )}
                      <Input
                        placeholder={`Enter ${selectedPaymentMethod.name} transaction number`}
                        value={transactionNumber}
                        onChange={(e) => setTransactionNumber(e.target.value)}
                        className="mt-2"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mb-8">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I have read and agree to the website{" "}
                    <a href="#" className="text-purple-600 hover:underline">
                      terms and conditions
                    </a>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
              </CardContent>
              <CardFooter className="p-6 sm:p-8">
                <Button
                  onClick={handleSubmit(onPlaceOrder)}
                  className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
                  disabled={
                    submitting ||
                    !cartItems.length ||
                    !agreedToTerms ||
                    !selectedPaymentMethodId ||
                    !transactionNumber ||
                    !isValid
                  }
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <>
                      <ShoppingBasket className="h-5 w-5 mr-2" />
                      Place order
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
