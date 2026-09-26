"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import AddressForm from "@/components/User/Address/AddressForm";

// Add a new address, or edit one with ?id=<addressId>.
export default function AddAddress() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/profile/address?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInitial(d?.address || null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <section className="container mx-auto max-w-2xl px-4 py-10">
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to my account
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{id ? "Edit address" : "Add a new address"}</h1>
      <p className="mt-1 text-sm text-gray-600">We deliver to every district in Bangladesh.</p>
      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="flex justify-center py-10" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading address…</span>
          </div>
        ) : (
          <AddressForm
            initial={initial}
            onSaved={() => router.push("/profile")}
            onCancel={() => router.push("/profile")}
          />
        )}
      </div>
    </section>
  );
}
