// This is the equivalent of your Passport.js config in an Express app —
// it defines HOW users can log in (which providers) and WHAT happens
// when they do (callbacks that shape the session object).

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter persists Google sign-ins into your User/Account tables.
  // This works alongside JWT sessions fine — the adapter controls user
  // creation/linking, `session.strategy` only controls where session data
  // itself lives. This combo (adapter + JWT) is the standard way to mix
  // OAuth and Credentials providers together.
  adapter: PrismaAdapter(prisma),
  providers: [
    // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from .env.local automatically
    // — NextAuth v5 infers these from the provider name, no need to pass
    // clientId/clientSecret explicitly.
    Google,

    // Email + password login. This is where YOUR code checks the password
    // — NextAuth doesn't store or hash passwords for you, you own that logic.
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // No user, or this user signed up via Google only (no password set)
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        // Whatever is returned here ends up on the JWT/session (see
        // callbacks below) — keep it minimal, never return the password hash.
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  // IMPORTANT: Credentials provider requires JWT sessions — NextAuth does
  // not support database-backed sessions when Credentials is one of the
  // providers. Google OAuth works fine with JWT too, so we use JWT for both
  // to keep the auth flow consistent regardless of how the user logged in.
  session: { strategy: "jwt" },

  callbacks: {
    // Runs whenever a JWT is created/updated. We stash the user's DB id
    // on the token so we can put it on the session below.
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // Runs whenever session data is read (e.g. via `auth()` in a server
    // component, or `useSession()` on the client). This is what makes
    // `session.user.id` available everywhere in your app.
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
