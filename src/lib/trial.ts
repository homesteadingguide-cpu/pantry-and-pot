export const TRIAL_DAYS = 7;

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
