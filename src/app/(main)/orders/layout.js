import { Suspense } from "react";
import PageLoader from "@/components/others/PageLoader";

export const metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
