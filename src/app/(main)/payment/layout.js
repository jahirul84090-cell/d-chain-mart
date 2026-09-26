import { Suspense } from "react";
import PageLoader from "@/components/others/PageLoader";

export const metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};

export default function PaymentLayout({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
