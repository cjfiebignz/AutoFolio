import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Normalize admin emails from env
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt", // Required for efficient token-based session tracking
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/", // Home page as sign-in
    error: "/",  // Fallback to home on error instead of standard auth pages
  },
  callbacks: {
    async jwt({ token, user }) {
      // 'user' is only available on the first call after sign in (initial session creation)
      if (user) {
        token.id = user.id;
        
        // Determine role: explicitly stored in DB OR dynamic override via env
        let assignedRole = user.role || "user";
        
        if (user.email) {
          const normalizedEmail = user.email.trim().toLowerCase();
          if (ADMIN_EMAILS.includes(normalizedEmail)) {
            assignedRole = "admin";
          }
        }
        token.role = assignedRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Safe assignment with fallbacks to ensure stable UI/Logic behaviour
        session.user.id = token.id || "";
        session.user.role = token.role || "user";
      }
      return session;
    },
  },
};

