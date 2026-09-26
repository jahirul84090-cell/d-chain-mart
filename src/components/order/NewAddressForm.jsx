"use client";

import AddressForm from "@/components/User/Address/AddressForm";

// Checkout wrapper around the shared address form.
export default function NewAddressForm({ onSave, onCancel }) {
  return <AddressForm onSaved={onSave} onCancel={onCancel} submitLabel="Save and use this address" />;
}
