// app/(main)/user/dashboard/page.js

import UserDashboard from "@/components/others/UserDashboard";
import React from "react";

export const metadata = {
  title: "User Dashboard",
  description:
    "Welcome to your personal dashboard. Manage your account, view your orders, and track your activity.",
};

const page = () => {
  return (
    <>
      <UserDashboard />
    </>
  );
};

export default page;
