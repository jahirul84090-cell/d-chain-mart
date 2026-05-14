import Signup from "@/components/Auth/Signup";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";

export const metadata = {
  title: "Create Your Account",
  description:
    "Join our community and create an account to start shopping, manage your profile, and save your favorite items.",
};

const page = async () => {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  return <Signup />;
};

export default page;
