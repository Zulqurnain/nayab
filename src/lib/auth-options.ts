/**
 * Layer 4: NextAuth v4 configuration.
 * Email + password auth with bcrypt, JWT sessions (stateless).
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb, users } from "./db";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const db = getDb();
          const result = db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email.toLowerCase().trim()))
            .all();

          if (result.length === 0) return null;
          const user = result[0];

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;

          // Update lastActiveAt
          db.update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, user.id))
            .run();

          return {
            id: String(user.id),
            email: user.email,
            plan: user.plan,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan ?? "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; plan?: string }).id = token.id as string;
        (session.user as { id?: string; plan?: string }).plan = token.plan as string ?? "free";
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.NEXTAUTH_SECRET ?? "change-me-in-production",
};
