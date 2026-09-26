// app/(main)/profile/page.js

import UserProfile from "@/components/User/Profile/Profile";
import React from "react";
import AccountShell from "@/components/User/AccountShell";

export const metadata = {
  title: "My Profile",
  description:
    "Manage your account settings, view order history, and update your personal information.",
  keywords: [
    "user profile",
    "my account",
    "account settings",
    "order history",
    "personal information",
  ],
};

const page = () => {
  return (
    <>
      <AccountShell>
        <UserProfile />
      </AccountShell>
    </>
  );
};

export default page;
