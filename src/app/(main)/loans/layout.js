import { Suspense } from "react";
import PageLoader from "@/components/others/PageLoader";

export const metadata = {
  title: "EMI & Loans",
  robots: { index: false, follow: false },
};

export default function LoansLayout({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
