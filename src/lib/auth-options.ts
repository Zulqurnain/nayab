import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser, touchUser } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                redirect_uri: "https://zulqurnainj.com/chat/api/auth/callback/google",
              },
            },
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
          const user = await getUserByEmail(credentials.email.toLowerCase().trim());
          if (!user) return null;

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;

          touchUser(user.id).catch(() => {});

          return { id: user.id, email: user.email, plan: user.plan };
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
      if (account?.provider === "google" && user.email) {
        try {
          const existing = await getUserByEmail(user.email.toLowerCase());
          if (!existing) {
            const created = await createUser({
              email: user.email.toLowerCase(),
              passwordHash: "",
              plan: "free",
            });
            user.id = created.id;
          } else {
            user.id = existing.id;
            (user as { plan?: string }).plan = existing.plan;
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
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await getUserByEmail(token.email.toLowerCase());
          if (dbUser) {
            token.id = dbUser.id;
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
