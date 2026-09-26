"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BD_DISTRICTS, validateAddress } from "@/lib/address";

/**
 * The one address form used at checkout and in the profile.
 * Creates a new address, or updates `initial` when it has an id.
 */
export default function AddressForm({ initial, onSaved, onCancel, submitLabel = "Save address" }) {
  const [values, setValues] = useState({
    street: initial?.street || "",
    city: initial?.city && BD_DISTRICTS.includes(initial.city) ? initial.city : "",
    state: initial?.state || "",
    zipCode: initial?.zipCode || "",
    phoneNumber: initial?.phoneNumber || "",
    isDefault: initial?.isDefault || false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) =>
    setValues((v) => ({ ...v, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const check = validateAddress(values);
    if (check.error) {
      setError(check.error);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile/address", {
        method: initial?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...(initial?.id ? { id: initial.id } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the address.");
      toast.success(initial?.id ? "Address updated." : "Address saved.");
      onSaved?.(data.address);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="addr-street">Street address *</Label>
        <Input
          id="addr-street"
          autoComplete="street-address"
          placeholder="House 12, Road 5, Dhanmondi"
          value={values.street}
          onChange={set("street")}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="addr-city">District *</Label>
          <select
            id="addr-city"
            value={values.city}
            onChange={set("city")}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Select district</option>
            {BD_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-state">Area / Thana</Label>
          <Input
            id="addr-state"
            autoComplete="address-level3"
            placeholder="e.g. Mirpur"
            value={values.state}
            onChange={set("state")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="addr-phone">Mobile number *</Label>
          <Input
            id="addr-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01712345678"
            value={values.phoneNumber}
            onChange={set("phoneNumber")}
            required
          />
          <p className="text-xs text-gray-500">The delivery person will call this number.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-zip">Postcode (optional)</Label>
          <Input
            id="addr-zip"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="1205"
            maxLength={4}
            value={values.zipCode}
            onChange={set("zipCode")}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={values.isDefault}
          onChange={set("isDefault")}
          className="h-4 w-4 rounded border-gray-300 accent-[#2ea7f2]"
        />
        Use as my default address
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
