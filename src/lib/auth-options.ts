import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getDb, users } from "./db";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

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

          db.update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, user.id))
            .run();

          return { id: String(user.id), email: user.email, plan: user.plan };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    async signIn({ user, account }) {
      // Auto-provision Google users into the DB on first sign-in
      if (account?.provider === "google" && user.email) {
        try {
          const db = getDb();
          const existing = db.select().from(users)
            .where(eq(users.email, user.email.toLowerCase())).all();

          if (existing.length === 0) {
            const result = db.insert(users).values({
              email: user.email.toLowerCase(),
              passwordHash: "", // no password for OAuth users
              plan: "free",
              createdAt: new Date(),
              lastActiveAt: new Date(),
            }).returning({ id: users.id }).all();
            user.id = String(result[0]?.id ?? "");
          } else {
            user.id = String(existing[0].id);
            (user as { plan?: string }).plan = existing[0].plan;
          }
        } catch {
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan ?? "free";
      }
      // For Google sign-in, fetch plan from DB since it's not in the OAuth user object
      if (account?.provider === "google" && token.email) {
        try {
          const db = getDb();
          const dbUser = db.select({ id: users.id, plan: users.plan })
            .from(users).where(eq(users.email, token.email.toLowerCase())).get();
          if (dbUser) {
            token.id = String(dbUser.id);
            token.plan = dbUser.plan;
          }
        } catch { /* non-critical */ }
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
