import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";
import { cookies } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // You can add custom logic here to verify users
      // For example, check if email domain is allowed
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("New user created:", user.email);
    },
    async signIn({ user }) {
      console.log("User signed in:", user.email);
    },
    async signOut() {
      // Clear all auth-related cookies on sign out
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();

      for (const cookie of allCookies) {
        if (
          cookie.name.startsWith("authjs.") ||
          cookie.name.startsWith("__Secure-authjs.") ||
          cookie.name.startsWith("next-auth.")
        ) {
          cookieStore.delete(cookie.name);
        }
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
});
