import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Auth foundation runs server-side
const BACKEND_URL = process.env.NEXT_PUBLIC_AUTOFOLIO_API_BASE_URL || 'http://127.0.0.1:3001';

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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Verify via backend server-side
          const response = await fetch(`${BACKEND_URL}/auth/verify-credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email.toLowerCase().trim(),
              password: credentials.password
            }),
          });

          if (!response.ok) {
            return null;
          }

          const user = await response.json();

          if (!user || !user.id) {
            return null;
          }

          // Return safe user object for JWT session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          console.error('[NextAuth] Credentials verification failed:', err);
          return null;
        }
      }
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

