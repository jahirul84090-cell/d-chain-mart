// app/(main)/cart/page.js

import CartPage from "@/components/website/cart/Cart";
import React from "react";

export const metadata = {
  title: "Your Shopping Cart",
  description:
    "Review and manage the items you've added to your cart. Proceed to checkout to complete your purchase.",
  keywords: ["shopping cart", "cart", "checkout", "e-commerce cart", "my cart"],
};

const page = () => {
  return (
    <>
      <CartPage />
    </>
  );
};

export default page;
