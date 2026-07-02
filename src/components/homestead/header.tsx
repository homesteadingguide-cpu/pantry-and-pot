"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Leaf,
  Loader2,
  MapPin,
  Pencil,
  Search,
  Sprout,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Batch } from "./types";

const WEATHER_ICONS: Record<string, React.ElementType> = {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
};

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number;
  wind?: number;
}

interface GeoResult {
  label: string;
  lat: number;
  lon: number;
}

interface Props {
  batches: Batch[];
  onGoToCultures?: () => void;
}

export function Header({ batches, onGoToCultures }: Props) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const weatherQ = useQuery({
    queryKey: ["weather"],
    queryFn: async (): Promise<WeatherData> => {
      const r = await fetch("/api/weather", { cache: "no-store" });
      if (!r.ok) throw new Error("weather failed");
      return r.json();
    },
    staleTime: 10 * 60 * 1000, // 10 min
    retry: 1,
  });

  // Starter health — most recently fed active sourdough batch
  const starter = pickStarter(batches);
  const starterHealth = computeStarterHealth(starter);

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
                Hearthstead
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-foreground">
                The Apartment Homestead
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A quiet ledger for the balcony, the counter, and the jar on the shelf.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Chip icon={Calendar} tone="neutral">
              {dateLabel}
            </Chip>
            <WeatherChip weatherQ={weatherQ} />
            <StarterChip
              starter={starter}
              health={starterHealth}
              onClick={onGoToCultures}
            />
          </div>
        </div>
      </div>
    </header>
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

function WeatherChip({
  weatherQ,
}: {
  weatherQ: ReturnType<typeof useQuery<WeatherData>>;
}) {
  const [open, setOpen] = useState(false);

  if (weatherQ.isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-muted-foreground ring-1 ring-border">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Weather…
      </span>
    );
  }

  if (weatherQ.isError || !weatherQ.data) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-muted-foreground ring-1 ring-border transition hover:bg-secondary/60"
      >
        <Cloud className="h-3.5 w-3.5" />
        Weather unavailable
      </button>
    );
  }

  const w = weatherQ.data;
  const Icon = WEATHER_ICONS[w.icon] ?? Cloud;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-accent-foreground ring-1 ring-accent/30 transition hover:bg-accent/25"
        title="Click to change location"
      >
        <Icon className="h-3.5 w-3.5" />
        {w.condition} {w.temperature}°C
        <span className="ml-0.5 hidden text-xs text-muted-foreground sm:inline">
          · {w.location}
        </span>
        <Pencil className="h-3 w-3 opacity-60" />
      </button>
      <LocationDialog open={open} onOpenChange={setOpen} />
    </>
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

// ---------- Location dialog ----------

function LocationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const runSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const r = await fetch(
        `/api/weather?search=${encodeURIComponent(search.trim())}`,
        { cache: "no-store" },
      );
      if (!r.ok) throw new Error("search failed");
      const data = await r.json();
      setResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        toast.error("No matches — try a city name.");
      }
    } catch {
      toast.error("Could not search — check your connection.");
    } finally {
      setSearching(false);
    }
  };

  const save = async (geo: GeoResult) => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geo),
      });
      if (!r.ok) throw new Error("save failed");
      await qc.invalidateQueries({ queryKey: ["weather"] });
      toast.success(`Location set to ${geo.label}.`);
      onOpenChange(false);
      setSearch("");
      setResults([]);
    } catch {
      toast.error("Could not save location.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Set your location</DialogTitle>
          <DialogDescription>
            Used for live weather. Type a city name, pick a result, and save.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="e.g. Brooklyn, Auckland, Berlin…"
                className="pl-8"
                autoFocus
              />
            </div>
            <Button onClick={runSearch} disabled={searching || !search.trim()}>
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>
          {results.length > 0 && (
            <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-border bg-card">
              {results.map((r, i) => (
                <li key={`${r.label}-${i}`}>
                  <button
                    type="button"
                    onClick={() => save(r)}
                    disabled={saving}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-secondary/60 disabled:opacity-50"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="flex-1">{r.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.lat.toFixed(2)}, {r.lon.toFixed(2)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Thermometer className="h-3 w-3" />
            Temperature
            <Wind className="ml-2 h-3 w-3" />
            Wind
            <Cloud className="ml-2 h-3 w-3" />
            Conditions — all from Open-Meteo, no API key needed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
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
  if (!starter.startDate) {
    return { label: `${starter.name} — no feed date`, tone: "unknown" };
  }
  const last = new Date(starter.startDate).getTime();
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
