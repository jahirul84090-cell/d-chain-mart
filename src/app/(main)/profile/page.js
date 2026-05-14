// app/(main)/profile/page.js

import UserProfile from "@/components/User/Profile/Profile";
import React from "react";

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
      <UserProfile />
    </>
  );
};

export default page;
