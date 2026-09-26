import { Suspense } from "react";
import AddAddress from "@/components/User/Profile/Address/CreateAddress";
import PageLoader from "@/components/others/PageLoader";

export const metadata = {
  title: "Manage Address",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AddAddress />
    </Suspense>
  );
}
