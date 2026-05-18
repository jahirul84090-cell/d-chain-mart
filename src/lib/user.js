// lib/auth.js
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    

    if (!session || !session.user || !session.user.id) {
      return null;
    }
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || null,
      image: session.user.image || null,
      role: session?.user?.role || null,
    };
  } catch (error) {
    return null;
  }
}
