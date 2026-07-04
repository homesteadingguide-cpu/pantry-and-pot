"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Leaf,
  Loader2,
  Sparkles,
  Sprout,
} from "lucide-react";
import { type Batch } from "./types";

interface Props {
  batches: Batch[];
  onGoToCultures?: () => void;
  auth?: {
    status: "loading" | "authenticated" | "unauthenticated";
    daysLeft: number | null; // null = unauthenticated; Infinity = paid; number = trial days left
    onSignIn: () => void;
    onSignOut: () => void;
  };
}

export function Header({ batches, onGoToCultures, auth }: Props) {
  // Render the date client-side only — otherwise SSR (UTC) and the browser
  // (user's locale, e.g. Pacific/Auckland) disagree on the day and React
  // throws a hydration mismatch.
  const [dateLabel, setDateLabel] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: client-only to avoid hydration mismatch
    setDateLabel(fmt());
    // Refresh at local midnight so a long-open tab doesn't show yesterday.
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const t = setTimeout(() => setDateLabel(fmt()), msUntilMidnight + 1000);
    return () => clearTimeout(t);
  }, []);

  // Starter health — most recently fed active sourdough batch.
  // Computed client-side only because it depends on Date.now() and would
  // otherwise cause hydration mismatches (server time vs client time).
  const starter = pickStarter(batches);
  const [starterHealth, setStarterHealth] = useState({
    label: "—",
    tone: "unknown" as "ok" | "warning" | "critical" | "unknown",
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: client-only to avoid hydration mismatch
    setStarterHealth(computeStarterHealth(starter));
    // Refresh every 5 minutes so "fed Xh ago" stays roughly current.
    const t = setInterval(
      () => setStarterHealth(computeStarterHealth(starter)),
      5 * 60 * 1000,
    );
    return () => clearInterval(t);
  }, [starter]);

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Pantry and Pot
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-foreground">
                Your Kitchen Counter Journal
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A quiet ledger for the balcony, the counter, and the jar on the shelf.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2 text-sm">
            <Chip icon={Calendar} tone="neutral">
              {dateLabel || "—"}
            </Chip>
            <StarterChip
              starter={starter}
              health={starterHealth}
              onClick={onGoToCultures}
            />
            {auth && <AuthChip auth={auth} />}
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------- Auth chip ----------

function AuthChip({
  auth,
}: {
  auth: NonNullable<Props["auth"]>;
}) {
  if (auth.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-muted-foreground ring-1 ring-border">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }
  if (auth.status === "unauthenticated") {
    return (
      <button
        type="button"
        onClick={auth.onSignIn}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-primary-foreground ring-1 ring-primary transition hover:bg-primary/90"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Sign in
      </button>
    );
  }
  // Authenticated
  const daysLeft = auth.daysLeft;
  let label: string;
  let tone: "primary" | "accent";
  if (daysLeft === Infinity) {
    label = "Subscribed";
    tone = "primary";
  } else if (daysLeft !== null && daysLeft <= 0) {
    label = "Trial ended";
    tone = "accent";
  } else if (daysLeft !== null) {
    label = `Trial: ${daysLeft}d left`;
    tone = daysLeft <= 2 ? "accent" : "primary";
  } else {
    label = "Signed in";
    tone = "primary";
  }
  const cls =
    tone === "primary"
      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
      : "bg-accent/20 text-accent-foreground ring-1 ring-accent/40";
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${cls}`}>
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </span>
      <button
        type="button"
        onClick={auth.onSignOut}
        className="inline-flex items-center rounded-full bg-muted px-2.5 py-1.5 text-xs text-muted-foreground ring-1 ring-border transition hover:bg-secondary/60"
        title="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}

// ---------- Chips ----------

function Chip({
  icon: Icon,
  tone,
  children,
}: {
  icon: React.ElementType;
  tone: "neutral" | "primary" | "accent";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
      : tone === "accent"
        ? "bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
        : "bg-secondary/60 text-secondary-foreground ring-1 ring-border";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${toneClass}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function StarterChip({
  starter,
  health,
  onClick,
}: {
  starter: Batch | null;
  health: { label: string; tone: "ok" | "warning" | "critical" | "unknown" };
  onClick?: () => void;
}) {
  const toneClass =
    health.tone === "ok"
      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
      : health.tone === "warning"
        ? "bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
        : health.tone === "critical"
          ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
          : "bg-muted text-muted-foreground ring-1 ring-border";

  const Icon = Sprout;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${toneClass} ${
        onClick ? "hover:opacity-80" : "cursor-default"
      }`}
      title={starter ? `Last fed: ${starter.name}` : "No active sourdough starter"}
    >
      <Icon className="h-3.5 w-3.5" />
      {health.label}
    </button>
  );
}

// ---------- Starter health helpers ----------

function pickStarter(batches: Batch[]): Batch | null {
  // Look for the perpetual sourdough starter (named things like "Bubbles",
  // "the starter"), excluding one-off preferments like poolish/levain.
  const PREFERMENT_RE = /\b(poolish|levain|preferment|biga|sponge)\b/i;

  const sourdoughStarters = batches.filter(
    (b) =>
      b.status === "active" &&
      b.type === "sourdough" &&
      !PREFERMENT_RE.test(b.name),
  );
  if (sourdoughStarters.length > 0) {
    // Most recently fed wins (startDate = last feed).
    sourdoughStarters.sort((a, b) =>
      (b.startDate ?? "").localeCompare(a.startDate ?? ""),
    );
    return sourdoughStarters[0];
  }

  // Fall back to other active cultures: kefir grains, SCOBY hotel.
  const others = batches.filter(
    (b) =>
      b.status === "active" &&
      (b.type === "kefir" || b.type === "kombucha"),
  );
  if (others.length > 0) {
    others.sort((a, b) =>
      (b.startDate ?? "").localeCompare(a.startDate ?? ""),
    );
    return others[0];
  }

  return null;
}

function computeStarterHealth(starter: Batch | null): {
  label: string;
  tone: "ok" | "warning" | "critical" | "unknown";
} {
  if (!starter) {
    return { label: "No active starter", tone: "unknown" };
  }
  // Use lastFedAt (the most recent feeding) — fall back to startDate if never fed.
  const fedIso = starter.lastFedAt ?? starter.startDate;
  if (!fedIso) {
    return { label: `${starter.name} — no feed date`, tone: "unknown" };
  }
  const last = new Date(fedIso).getTime();
  const hours = (Date.now() - last) / 3_600_000;
  const shortName = starter.name.split("—")[0].trim().slice(0, 18);
  if (hours < 1) {
    return { label: `${shortName} fed just now`, tone: "ok" };
  }
  if (hours < 24) {
    const h = Math.floor(hours);
    return { label: `${shortName} fed ${h}h ago`, tone: "ok" };
  }
  if (hours < 48) {
    const h = Math.floor(hours);
    return { label: `${shortName} fed ${h}h ago — feed me!`, tone: "warning" };
  }
  const days = Math.floor(hours / 24);
  return {
    label: `${shortName} fed ${days}d ago — feed me!`,
    tone: "critical",
  };
}
