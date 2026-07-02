export type TaskCategory = "general" | "animals" | "garden" | "maintenance" | "harvest";
export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type TaskPriority = "low" | "normal" | "high";
export type PlantingStatus =
  | "planned"
  | "seeded"
  | "transplanted"
  | "growing"
  | "harvest-ready"
  | "harvested";

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
  bed: string | null;
  status: PlantingStatus;
  datePlanted: string | null;
  expectedHarvest: string | null;
  actualHarvest: string | null;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

export const TASK_CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: "general", label: "General", icon: "Leaf" },
  { value: "animals", label: "Animals", icon: "Egg" },
  { value: "garden", label: "Garden", icon: "Sprout" },
  { value: "maintenance", label: "Maintenance", icon: "Hammer" },
  { value: "harvest", label: "Harvest", icon: "Apple" },
];

export const TASK_RECURRENCES: TaskRecurrence[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export const TASK_PRIORITIES: TaskPriority[] = ["low", "normal", "high"];

export const PLANTING_STATUSES: { value: PlantingStatus; label: string; tone: string }[] = [
  { value: "planned", label: "Planned", tone: "muted" },
  { value: "seeded", label: "Seeded", tone: "info" },
  { value: "transplanted", label: "Transplanted", tone: "info" },
  { value: "growing", label: "Growing", tone: "primary" },
  { value: "harvest-ready", label: "Harvest Ready", tone: "accent" },
  { value: "harvested", label: "Harvested", tone: "secondary" },
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
