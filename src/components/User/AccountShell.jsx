"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CreditCard, Heart, LayoutGrid, LogOut, MapPin, Package } from "lucide-react";

const LINKS = [
  { href: "/details", label: "Overview", icon: LayoutGrid },
  { href: "/orders", label: "My orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/loans/details", label: "EMI & loans", icon: CreditCard },
  { href: "/profile", label: "Profile & addresses", icon: MapPin },
];

/**
 * Shared frame for every "My account" page: side navigation on desktop,
 * a horizontally scrollable tab bar on mobile.
 */
export default function AccountShell({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="bg-gray-50/60">
      <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[230px_1fr] lg:py-10">
        <aside aria-label="My account">
          <div className="mb-4 hidden lg:block">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">My account</p>
            <p className="mt-1 truncate font-semibold text-gray-900">{session?.user?.name || "Welcome"}</p>
            <p className="truncate text-sm text-gray-500">{session?.user?.email}</p>
          </div>
          <nav className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(href)
                        ? "bg-primary text-white"
                        : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 lg:bg-transparent lg:ring-0"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
              <li className="shrink-0 lg:mt-2 lg:border-t lg:pt-2">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-600 ring-1 ring-gray-200 hover:bg-red-50 lg:bg-transparent lg:ring-0"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
