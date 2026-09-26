import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { getCurrentUser } from "@/lib/user";

export const metadata = {
  title: "Track Your Order",
  description: "See the status of your orders.",
  alternates: { canonical: "/track-order" },
};

// Signed-in customers go straight to their orders; guests are asked to sign in.
export default async function TrackOrderPage() {
  const user = await getCurrentUser();
  if (user) redirect("/orders");

  return (
    <section className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PackageSearch className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-gray-900">Track your order</h1>
      <p className="mt-3 text-gray-600">
        Sign in to see the status of all your orders. Need help with an order placed by phone?
        Contact our support team with your order number.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/auth/login?callbackUrl=%2Forders"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Sign in to track
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Contact support
        </Link>
      </div>
    </section>
  );
}
