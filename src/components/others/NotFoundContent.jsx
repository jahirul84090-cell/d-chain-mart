import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFoundContent() {
  return (
    <section className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 text-gray-600">
        The page or product you&apos;re looking for doesn&apos;t exist or is no
        longer available.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Go to homepage
        </Link>
        <Link
          href="/allproducts"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
        >
          Browse products
        </Link>
      </div>
    </section>
  );
}
