/**
 * Layer 4: NextAuth handler for /api/auth/*
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
