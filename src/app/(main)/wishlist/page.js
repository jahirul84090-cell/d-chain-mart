// app/(main)/wishlist/page.js

import WishlistPage from "@/components/website/wishlist/Wishlist";
import React from "react";

export const metadata = {
  title: "My Wishlist",
  description:
    "View and manage the products you've added to your wishlist. Save your favorite items for later.",
  keywords: [
    "wishlist",
    "save for later",
    "my favorites",
    "e-commerce wishlist",
    "saved items",
  ],
};

const page = () => {
  return (
    <>
      <WishlistPage />
    </>
  );
};

export default page;
