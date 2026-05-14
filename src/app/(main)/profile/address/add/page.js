// app/(main)/profile/address/create/page.js

import AddAddress from "@/components/User/Profile/Address/CreateAddress";
import React from "react";

export const metadata = {
  title: "Add New Address",
  description:
    "Add a new shipping or billing address to your account for faster and more convenient checkout.",
};

const page = () => {
  return (
    <>
      <AddAddress />
    </>
  );
};

export default page;
