// app/(main)/checkout/page.js

import OrderNowPage from "@/components/order/OrderNow";
import React from "react";

export const metadata = {
  title: "Checkout & Place Order",
  description:
    "Review your order details and complete the secure checkout process to finalize your purchase.",
};

const page = () => {
  return (
    <>
      <OrderNowPage />
    </>
  );
};

export default page;
