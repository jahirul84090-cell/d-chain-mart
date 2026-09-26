"use client";

import { usePathname } from "next/navigation";

// Hides its children on the given route prefixes (e.g. the footer at checkout).
export default function HideOnRoutes({ routes, children }) {
  const pathname = usePathname() || "";
  return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`)) ? null : children;
}
