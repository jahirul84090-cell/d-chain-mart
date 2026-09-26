import { getToken } from "next-auth/jwt";

export async function decodeJwtToken(request) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return { user: null, error: "Missing NEXTAUTH_SECRET" };
    }

    const token = await getToken({
      req: request,
      secret,
      secureCookie: process.env.NODE_ENV === "production",
    });
    if (!token) {
      return { user: null, error: "No token" };
    }

    if (!token.id || !token.email) {
      console.error("decodeJwtToken: token is missing id or email");
      return { user: null, error: "Invalid token payload" };
    }

    return {
      user: {
        id: token.id,
        email: token.email,
        name: token.name || null,
        role: token.role || "user",
        emailVerified: token.emailVerified || false,
      },
      error: null,
    };
  } catch (error) {
    console.error("decodeJwtToken: Error", {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString(),
    });
    return { user: null, error: error.message };
  }
}
