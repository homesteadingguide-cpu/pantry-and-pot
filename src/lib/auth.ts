import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { seedDemoDataForUser } from "@/lib/seed";

const TRIAL_PASSCODE = process.env.TRIAL_PASSCODE || "PANTRY&POT";
export const TRIAL_DAYS = 7;

export interface AppUser {
  id: string;
  email: string;
  trialStartedAt: string;
  paidUntil: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Trial access",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        passcode: { label: "Passcode", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const passcode = credentials?.passcode;
        if (!email || !passcode) return null;
        if (passcode !== TRIAL_PASSCODE) return null;

        let user = await db.user.findUnique({ where: { email } });
        if (!user) {
          user = await db.user.create({
            data: { email, trialStartedAt: new Date() },
          });
          // Seed a copy of demo data for this new user so they have something to play with.
          await seedDemoDataForUser(user.id);
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

export function isTrialActive(
  trialStartedAt: string | null,
  paidUntil: string | null,
): boolean {
  if (paidUntil && new Date(paidUntil) > new Date()) return true;
  if (!trialStartedAt) return false;
  const end = new Date(trialStartedAt);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return new Date() < end;
}

export function trialDaysLeft(
  trialStartedAt: string | null,
  paidUntil: string | null,
): number {
  if (paidUntil && new Date(paidUntil) > new Date()) return Infinity;
  if (!trialStartedAt) return 0;
  const end = new Date(trialStartedAt);
  end.setDate(end.getDate() + TRIAL_DAYS);
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
