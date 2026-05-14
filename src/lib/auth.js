import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

if (!prisma) {
  throw new Error("Prisma client is not initialized");
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
            throw new Error("Invalid email format");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("No account found with this email");
          }

          if (!user.emailVerified) {
            throw new Error(
              "Email not verified. Please check your email for the OTP or resend it at the verification page."
            );
          }

          if (!user.password) {
            throw new Error(
              "This account uses Google sign-in. Please use the Google sign-in option."
            );
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordValid) {
            throw new Error("Incorrect password");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { googleId: account.providerAccountId },
                { email: user.email },
              ],
            },
          });

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                googleId: account.providerAccountId,
                email: user.email,
                name: user.name,
                role: "USER",
                emailVerified: true,
              },
            });
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: "oauth",
                provider: "google",
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          } else if (!existingUser.googleId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: account.providerAccountId,
                emailVerified: true,
              },
            });
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
              },
            });
            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: "oauth",
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }
          }
          return true;
        } catch (error) {
          console.error("Google sign-in: Error", { message: error.message });
          return `/auth/error?error=GoogleSignInFailed`;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, email: true, name: true },
        });

        if (!dbUser) {
          return null;
        }
        token.role = dbUser.role;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.image = dbUser.image || "";
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.image = token.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret", // Ensure this is set
  debug: true,
};

export default NextAuth(authOptions);
