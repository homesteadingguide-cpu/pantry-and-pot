import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { seedDemoDataForUser } from "@/lib/seed";

// Client-safe trial helpers live in trial.ts so this file never reaches the browser bundle.
export { TRIAL_DAYS, isTrialActive, trialDaysLeft } from "@/lib/trial";

// Passcodes come only from env vars, never from source (this repo is public).
const TRIAL_PASSCODE = process.env.TRIAL_PASSCODE;
const PAID_PASSCODE = process.env.PAID_PASSCODE;
// When a paid user signs in, set paidUntil to this far in the future.
// Year 2126 — effectively "lifetime" but still a date we can extend later.
const PAID_UNTIL_YEARS = 100;

export interface AppUser {
  id: string;
  email: string;
  trialStartedAt: string;
  paidUntil: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        passcode: { label: "Passcode", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const passcode = credentials?.passcode;
        if (!email || !passcode || !TRIAL_PASSCODE || !PAID_PASSCODE) return null;

        // Determine access type from the passcode the user entered.
        const isPaid = passcode === PAID_PASSCODE;
        const isTrial = passcode === TRIAL_PASSCODE;
        if (!isPaid && !isTrial) return null; // wrong passcode

        let user = await db.user.findUnique({ where: { email } });
        if (!user) {
          user = await db.user.create({
            data: { email, trialStartedAt: new Date() },
          });
          // Seed a copy of demo data for this new user so they have something to play with.
          await seedDemoDataForUser(user.id);
        }

        // If they used the PAID passcode, mark their account as paid
        // (extends paidUntil to 100 years from now). This is idempotent —
        // signing in again with the paid passcode just re-extends it.
        if (isPaid) {
          const paidUntil = new Date();
          paidUntil.setFullYear(paidUntil.getFullYear() + PAID_UNTIL_YEARS);
          user = await db.user.update({
            where: { id: user.id },
            data: { paidUntil },
          });
        }

        return {
          id: user.id,
          email: user.email,
          trialStartedAt: user.trialStartedAt.toISOString(),
          paidUntil: user.paidUntil?.toISOString() ?? null,
        } as AppUser & { id: string };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AppUser & { id: string };
        token.uid = u.id;
        token.email = u.email;
        token.trialStartedAt = u.trialStartedAt;
        token.paidUntil = u.paidUntil;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session) {
        (session as unknown as { user: AppUser }).user = {
          id: token.uid as string,
          email: token.email as string,
          trialStartedAt: token.trialStartedAt as string,
          paidUntil: (token.paidUntil as string | null) ?? null,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
