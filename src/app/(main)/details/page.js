// app/(main)/user/dashboard/page.js

import UserDashboard from "@/components/others/UserDashboard";
import React from "react";
import AccountShell from "@/components/User/AccountShell";

export const metadata = {
  title: "User Dashboard",
  description:
    "Welcome to your personal dashboard. Manage your account, view your orders, and track your activity.",
};

const page = () => {
  return (
    <>
      <AccountShell>
        <UserDashboard />
      </AccountShell>
    </>
  );
};

export default page;
