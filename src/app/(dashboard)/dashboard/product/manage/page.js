import { Suspense } from "react";
import ProductManagement from "@/components/Admin/Dashboard/Product/ManageProduct";

export const metadata = { title: "Products" };

// The list keeps its filters in the URL, which needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <ProductManagement />
    </Suspense>
  );
}
