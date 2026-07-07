"use client";

import {
  AlertTriangle,
  Apple,
  Croissant,
  CheckCircle2,
  Circle,
  FlaskConical,
  Archive,
  Leaf,
  Sprout,
  Sunrise,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  type Batch,
  type PantryItem,
  type Planting,
  type Task,
  type TaskCategory,
  BATCH_STATUSES,
  formatRelative,
  isLowStock,
  statusToneClass,
} from "./types";

const CATEGORY_ICONS_REAL: Record<TaskCategory, React.ElementType> = {
  general: Leaf,
  kitchen: Croissant,
  balcony: Sprout,
  pantry: Archive,
  brewing: FlaskConical,
};

interface Props {
  tasks: Task[];
  plantings: Planting[];
  batches: Batch[];
  pantry: PantryItem[];
  onGoToChores?: () => void;
  onGoToBatches?: () => void;
  onGoToPantry?: () => void;
}

export function Dashboard({
  tasks,
  plantings,
  batches,
  pantry,
  onGoToChores,
  onGoToBatches,
  onGoToPantry,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (iso: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const todaysTasks = tasks.filter(
    (t) => !t.completed && (isToday(t.dueDate) || t.recurrence === "daily"),
  );
  const completedToday = tasks.filter(
    (t) => t.completed && t.completedAt && isToday(t.completedAt),
  );

  const harvestReady = plantings.filter((p) => p.status === "harvest-ready");

  const readyBatches = batches.filter(
    (b) => b.status === "bottling" || b.status === "ready",
  );
  const activeBatches = batches.filter(
    (b) => b.status === "active" || b.status === "fermenting",
  );

  const lowStockItems = pantry.filter(isLowStock);

  const completionRate =
    todaysTasks.length + completedToday.length === 0
      ? 0
      : Math.round(
          (completedToday.length /
            (todaysTasks.length + completedToday.length)) *
            100,
        );

  const openCount = tasks.filter((t) => !t.completed).length;
  const growingCount = plantings.filter((p) => p.status === "growing").length;

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Sunrise}
          label="Today's routines"
          value={`${todaysTasks.length}`}
          hint={`${completedToday.length} already done`}
        />
        <StatCard
          icon={FlaskConical}
          label="Living cultures"
          value={`${activeBatches.length}`}
          hint={`${readyBatches.length} ready to bottle or enjoy`}
        />
        <StatCard
          icon={TrendingUp}
          label="Day completion"
          value={`${completionRate}%`}
          hint="of today's planned work"
        >
          <Progress value={completionRate} className="mt-2 h-1.5" />
        </StatCard>
        <StatCard
          icon={AlertTriangle}
          label="Pantry low"
          value={`${lowStockItems.length}`}
          hint="items running low"
          tone={lowStockItems.length > 0 ? "accent" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's routines */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-2xl">Today on the counter</CardTitle>
              <CardDescription>
                Today's small tasks — feed, water, check, repeat.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoToChores}
              disabled={!onGoToChores}
            >
              <span>Open list →</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaysTasks.length === 0 ? (
              <EmptyHint label="Nothing pressing today. Rest and the dough can wait." />
            ) : (
              todaysTasks.slice(0, 6).map((t) => {
                const Icon = CATEGORY_ICONS_REAL[t.category] ?? Leaf;
                return (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 rounded-md border border-border/70 bg-card/50 px-3 py-2.5"
                  >
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.title}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {t.category} · due {formatRelative(t.dueDate)}
                      </p>
                    </div>
                    {t.priority === "high" && (
                      <Badge variant="outline" className="border-accent/40 text-accent">
                        high
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Batches needing attention */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-xl">Jars to check</CardTitle>
              <CardDescription>Ready to bottle or move to the fridge.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoToBatches}
              disabled={!onGoToBatches}
            >
              <span>Open →</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {readyBatches.length === 0 ? (
              <EmptyHint label="No batches waiting on you today." />
            ) : (
              readyBatches.slice(0, 5).map((b) => {
                const meta = BATCH_STATUSES.find((s) => s.value === b.status);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-card/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {b.type} · {formatRelative(b.expectedEnd)}
                      </p>
                    </div>
                    {meta && (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusToneClass(meta.tone)}`}
                      >
                        {meta.label}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Low stock */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-xl">Running low</CardTitle>
              <CardDescription>Pantry items at or below their threshold.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoToPantry}
              disabled={!onGoToPantry}
            >
              <span>Open →</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockItems.length === 0 ? (
              <EmptyHint label="Pantry is well-stocked. Carry on." />
            ) : (
              lowStockItems.slice(0, 6).map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-accent/30 bg-accent/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.location ?? "no spot"} · reorder soon
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground ring-1 ring-accent/30">
                    {i.quantity} {i.unit}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ready on the sill */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Ready on the sill</CardTitle>
            <CardDescription>Balcony and windowsill crops ripe now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {harvestReady.length === 0 ? (
              <EmptyHint label="Nothing ready to harvest — patience." />
            ) : (
              harvestReady.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-card/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.crop}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.spot ?? "no spot"}
                    </p>
                  </div>
                  <Apple className="h-4 w-4 shrink-0 text-accent" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Done today */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Done today</CardTitle>
            <CardDescription>The quiet satisfaction of finished jars.</CardDescription>
          </CardHeader>
          <CardContent>
            {completedToday.length === 0 ? (
              <EmptyHint label="Nothing ticked off yet — go start." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {completedToday.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary ring-1 ring-primary/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.title}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  children,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
  tone?: "accent";
}) {
  return (
    <Card className={tone === "accent" ? "border-accent/40 bg-accent/5" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <Icon
            className={`h-4 w-4 ${tone === "accent" ? "text-accent" : "text-primary/70"}`}
          />
        </div>
        <p className="mt-2 font-serif text-3xl font-semibold text-foreground">
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
