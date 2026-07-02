export type TaskCategory =
  | "general"
  | "kitchen"
  | "balcony"
  | "pantry"
  | "brewing";
export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type TaskPriority = "low" | "normal" | "high";

export type PlantingStatus =
  | "planned"
  | "seeded"
  | "sprouted"
  | "growing"
  | "harvest-ready"
  | "harvested";

export type BatchType =
  | "kombucha"
  | "sourdough"
  | "kraut"
  | "kefir"
  | "kimchi"
  | "vinegar"
  | "miso"
  | "other";

export type BatchStatus =
  | "active"
  | "fermenting"
  | "bottling"
  | "ready"
  | "consumed"
  | "discarded";

export type PantryCategory =
  | "dry"
  | "ferment"
  | "preserve"
  | "canned"
  | "frozen"
  | "spice"
  | "supply";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  category: TaskCategory;
  recurrence: TaskRecurrence;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  priority: TaskPriority;
  createdAt: string;
}

export interface Planting {
  id: string;
  crop: string;
  variety: string | null;
  spot: string | null;
  status: PlantingStatus;
  datePlanted: string | null;
  expectedHarvest: string | null;
  actualHarvest: string | null;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

export interface Batch {
  id: string;
  type: BatchType;
  name: string;
  status: BatchStatus;
  startDate: string | null;
  expectedEnd: string | null;
  actualEnd: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  quantity: number;
  unit: string;
  lowStockAt: number | null;
  location: string | null;
  dateAdded: string;
  notes: string | null;
  createdAt: string;
}

export const TASK_CATEGORIES: {
  value: TaskCategory;
  label: string;
  icon: string;
}[] = [
  { value: "general", label: "General", icon: "Leaf" },
  { value: "kitchen", label: "Kitchen", icon: "Croissant" },
  { value: "balcony", label: "Balcony", icon: "Sprout" },
  { value: "pantry", label: "Pantry", icon: "Archive" },
  { value: "brewing", label: "Brewing", icon: "FlaskConical" },
];

export const TASK_RECURRENCES: TaskRecurrence[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export const TASK_PRIORITIES: TaskPriority[] = ["low", "normal", "high"];

export const PLANTING_STATUSES: {
  value: PlantingStatus;
  label: string;
  tone: string;
}[] = [
  { value: "planned", label: "Planned", tone: "muted" },
  { value: "seeded", label: "Seeded", tone: "info" },
  { value: "sprouted", label: "Sprouted", tone: "info" },
  { value: "growing", label: "Growing", tone: "primary" },
  { value: "harvest-ready", label: "Ready to harvest", tone: "accent" },
  { value: "harvested", label: "Harvested", tone: "secondary" },
];

export const BATCH_TYPES: { value: BatchType; label: string }[] = [
  { value: "kombucha", label: "Kombucha" },
  { value: "sourdough", label: "Sourdough" },
  { value: "kraut", label: "Sauerkraut" },
  { value: "kefir", label: "Kefir" },
  { value: "kimchi", label: "Kimchi" },
  { value: "vinegar", label: "Vinegar" },
  { value: "miso", label: "Miso" },
  { value: "other", label: "Other" },
];

export const BATCH_STATUSES: {
  value: BatchStatus;
  label: string;
  tone: string;
  hint: string;
}[] = [
  { value: "active", label: "Active", tone: "info", hint: "Culture is awake and feeding" },
  { value: "fermenting", label: "Fermenting", tone: "primary", hint: "In the jar, doing its thing" },
  { value: "bottling", label: "Ready to bottle", tone: "accent", hint: "Time to jar or move to fridge" },
  { value: "ready", label: "Ready to enjoy", tone: "accent", hint: "Finished and waiting" },
  { value: "consumed", label: "Enjoyed", tone: "secondary", hint: "Eaten, drunk, gone" },
  { value: "discarded", label: "Discarded", tone: "muted", hint: "Did not work out" },
];

// Sensible default progression: active → fermenting → bottling → ready → consumed
export const BATCH_NEXT: Record<BatchStatus, BatchStatus | null> = {
  active: "fermenting",
  fermenting: "bottling",
  bottling: "ready",
  ready: "consumed",
  consumed: null,
  discarded: null,
};

export const PANTRY_CATEGORIES: {
  value: PantryCategory;
  label: string;
  tone: string;
}[] = [
  { value: "dry", label: "Dry goods", tone: "muted" },
  { value: "ferment", label: "Ferments", tone: "primary" },
  { value: "preserve", label: "Preserves", tone: "accent" },
  { value: "canned", label: "Canned", tone: "info" },
  { value: "frozen", label: "Frozen", tone: "info" },
  { value: "spice", label: "Spices", tone: "accent" },
  { value: "supply", label: "Supplies", tone: "secondary" },
];

export const PANTRY_UNITS: string[] = [
  "jar",
  "bag",
  "bottle",
  "pack",
  "kg",
  "g",
  "L",
  "ml",
  "loaf",
  "head",
];

export function statusToneClass(tone: string): string {
  switch (tone) {
    case "primary":
      return "bg-primary/15 text-primary border-primary/30";
    case "accent":
      return "bg-accent/20 text-accent-foreground border-accent/40";
    case "info":
      return "bg-secondary text-secondary-foreground border-secondary-foreground/20";
    case "secondary":
      return "bg-muted text-muted-foreground border-border";
    case "muted":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function priorityClass(p: TaskPriority): string {
  switch (p) {
    case "high":
      return "text-accent";
    case "low":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "no date";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  if (diff < 7) return `in ${diff} days`;
  if (diff < 14) return "next week";
  return formatDate(iso);
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function seasonOf(date = new Date()): string {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "Spring";
  if (m >= 5 && m <= 7) return "Summer";
  if (m >= 8 && m <= 10) return "Autumn";
  return "Winter";
}

export function isLowStock(item: PantryItem): boolean {
  if (item.lowStockAt == null) return false;
  return item.quantity <= item.lowStockAt;
}
