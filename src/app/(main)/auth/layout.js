import { Suspense } from "react";
import PageLoader from "@/components/others/PageLoader";

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
