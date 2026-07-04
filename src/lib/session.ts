import { getServerSession } from "next-auth";
import { authOptions, isTrialActive, type AppUser } from "@/lib/auth";

export interface SessionInfo {
  user: AppUser | null;
  canMutate: boolean; // true if signed in AND trial active (or paid)
  trialActive: boolean;
}

export async function getSessionInfo(): Promise<SessionInfo> {
  const session = await getServerSession(authOptions);
  const user = (session as unknown as { user?: AppUser })?.user ?? null;
  const trialActive = user
    ? isTrialActive(user.trialStartedAt, user.paidUntil)
    : false;
  return {
    user,
    canMutate: !!user && trialActive,
    trialActive,
  };
}
