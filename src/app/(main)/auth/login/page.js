import SignInPage from "@/components/Auth/Login";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Login to Your Account",
  description:
    "Sign in to your account to manage your profile, view orders, and access your wishlist.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  return (
    <>
      <SignInPage />
    </>
  );
}
