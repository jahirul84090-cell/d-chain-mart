"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { data } from "./Dashboard-Kit/app-sidebar";

// Page names for admin routes, derived from the sidebar plus detail pages.
const EXTRA = [
  ["/dashboard/order/", "Order details", "/dashboard/order/manage", "Orders"],
  ["/dashboard/users/", "Customer details", "/dashboard/users", "Customers"],
  ["/dashboard/product/edit/", "Edit product", "/dashboard/product/manage", "Products"],
  ["/dashboard/inventory-sales", "Sales", "/dashboard/inventory", "Inventory"],
  ["/dashboard/inventory-reports", "Reports", "/dashboard/inventory", "Inventory"],
];

function resolve(pathname) {
  const extra = EXTRA.find(([prefix]) => pathname.startsWith(prefix));
  if (extra) return { parent: { title: extra[3], url: extra[2] }, title: extra[1] };
  for (const item of data.navMain) {
    if (item.url === pathname) return { title: item.title };
    const sub = item.items?.find((s) => s.url === pathname);
    if (sub) return { parent: { title: item.title, url: item.items[0].url }, title: sub.title };
  }
  return { title: "Dashboard" };
}

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  const { parent, title } = resolve(pathname);
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {parent && (
          <>
            <li className="hidden sm:block">
              <Link href={parent.url} className="text-gray-500 hover:text-gray-900">
                {parent.title}
              </Link>
            </li>
            <li className="hidden sm:block" aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            </li>
          </>
        )}
        <li className="truncate font-medium text-gray-900" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}
