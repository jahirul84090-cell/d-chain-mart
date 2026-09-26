import { Suspense } from "react";
import OrderManagement from "@/components/Admin/Dashboard/Order/ManageOrder";

export const metadata = { title: "Orders" };

// The list keeps its filters in the URL, which needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <OrderManagement />
    </Suspense>
  );
}
