import Link from "next/link";
import Image from "next/image";

/**
 * Shared shell for every sign-in related page (login, signup, verify,
 * forgot/reset password, errors) so they look like one product.
 */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-flex items-center justify-center" aria-label="D Chin Mart home">
              <span className="inline-flex h-12 w-16 items-center justify-center rounded-xl bg-primary p-1.5">
                <Image src="/logo.png" alt="" width={56} height={30} className="h-auto w-full" />
              </span>
            </Link>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </section>
  );
}
