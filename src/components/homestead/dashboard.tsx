"use client";

import {
  Apple,
  CheckCircle2,
  Circle,
  Egg,
  Hammer,
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
  type Planting,
  type Task,
  type TaskCategory,
  formatRelative,
  priorityClass,
  statusToneClass,
  PLANTING_STATUSES,
} from "./types";

const CATEGORY_ICONS: Record<TaskCategory, React.ElementType> = {
  general: Leaf,
  animals: Egg,
  garden: Sprout,
  maintenance: Hammer,
  harvest: Apple,
};

interface Props {
  tasks: Task[];
  plantings: Planting[];
  onGoToChores?: () => void;
}

export function Dashboard({ tasks, plantings, onGoToChores }: Props) {
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
  const upcomingHarvest = plantings
    .filter((p) => p.expectedHarvest && p.status !== "harvested")
    .sort(
      (a, b) =>
        new Date(a.expectedHarvest!).getTime() -
        new Date(b.expectedHarvest!).getTime(),
    )
    .slice(0, 5);

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
          label="Today's chores"
          value={`${todaysTasks.length}`}
          hint={`${completedToday.length} already done`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Open tasks"
          value={`${openCount}`}
          hint="across all categories"
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
          icon={Apple}
          label="Ready to harvest"
          value={`${harvestReady.length}`}
          hint={`${growingCount} still growing`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's chores */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-2xl">Today at a glance</CardTitle>
              <CardDescription>
                Chores that need your hands before sundown.
              </CardDescription>
            </div>
            <Button
              asChild={false}
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
              <EmptyHint label="Nothing pressing today. Rest and the rows can wait." />
            ) : (
              todaysTasks.slice(0, 6).map((t) => {
                const Icon = CATEGORY_ICONS[t.category] ?? Leaf;
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

        {/* Harvest queue */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Coming to harvest</CardTitle>
            <CardDescription>Closest ripening rows first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingHarvest.length === 0 ? (
              <EmptyHint label="No ripening rows on the calendar." />
            ) : (
              upcomingHarvest.map((p) => {
                const meta = PLANTING_STATUSES.find((s) => s.value === p.status);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-card/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.crop}
                        {p.variety ? (
                          <span className="ml-1 text-muted-foreground">
                            · {p.variety}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.bed ?? "no bed"} · {formatRelative(p.expectedHarvest)}
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

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Done today</CardTitle>
          <CardDescription>The satisfaction of finished rows.</CardDescription>
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
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <Icon className="h-4 w-4 text-primary/70" />
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
