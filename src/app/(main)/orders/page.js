// app/(main)/orders/page.js

import AllOrdersPage from "@/components/others/Allorders";
import React from "react";

export const metadata = {
  title: "My Orders",
  description:
    "View and track all your past and current orders. Check the status of your purchases and review your order history.",
};

const page = () => {
  return (
    <>
      <AllOrdersPage />
    </>
  );
};

export default page;
