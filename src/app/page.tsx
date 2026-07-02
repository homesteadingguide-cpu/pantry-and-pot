"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, ListTodo, Sprout, Sparkles, Database } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/homestead/header";
import { Dashboard } from "@/components/homestead/dashboard";
import { Chores } from "@/components/homestead/chores";
import { Plantings } from "@/components/homestead/plantings";
import {
  type Planting,
  type PlantingStatus,
  type Task,
  type TaskCategory,
  type TaskPriority,
  type TaskRecurrence,
} from "@/components/homestead/types";

type TabKey = "dashboard" | "chores" | "plantings";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return (await r.json()) as T;
}

export default function Home() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [seeded, setSeeded] = useState(false);

  // Seed demo data ONLY if the DB is empty, so we don't wipe user work on refresh.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/tasks", { cache: "no-store" });
        const tasks = r.ok ? await r.json() : [];
        if (Array.isArray(tasks) && tasks.length === 0) {
          const p = await fetch("/api/plantings", { cache: "no-store" });
          const plants = p.ok ? await p.json() : [];
          if (Array.isArray(plants) && plants.length === 0) {
            await fetch("/api/seed", { method: "POST" });
            qc.invalidateQueries({ queryKey: ["tasks"] });
            qc.invalidateQueries({ queryKey: ["plantings"] });
          }
        }
      } finally {
        setSeeded(true);
      }
    })();
  }, [qc]);

  const tasksQ = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetchJson<Task[]>("/api/tasks"),
    enabled: seeded,
  });
  const plantingsQ = useQuery({
    queryKey: ["plantings"],
    queryFn: () => fetchJson<Planting[]>("/api/plantings"),
    enabled: seeded,
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const r = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!r.ok) throw new Error("toggle failed");
      return r.json();
    },
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).map((t) =>
          t.id === id
            ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error("Could not update task.");
    },
    onSuccess: (_d, vars) => {
      // If a recurring task was just completed, re-create the next occurrence
      // with a fresh due date so the chore keeps showing up.
      const current = qc.getQueryData<Task[]>(["tasks"])?.find((t) => t.id === vars.id);
      if (current && current.recurrence !== "none") {
        const next = nextDueDate(current.recurrence, current.dueDate);
        createTask.mutate({
          title: current.title,
          notes: current.notes ?? undefined,
          category: current.category,
          recurrence: current.recurrence,
          priority: current.priority,
          dueDate: next ?? undefined,
        });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("delete failed");
      return r.json();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error("Could not delete task.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const createTask = useMutation({
    mutationFn: async (data: {
      title: string;
      notes?: string;
      category: TaskCategory;
      recurrence: TaskRecurrence;
      priority: TaskPriority;
      dueDate?: string;
    }) => {
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("create task failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const createPlanting = useMutation({
    mutationFn: async (data: {
      crop: string;
      variety?: string;
      bed?: string;
      status: PlantingStatus;
      quantity: number;
      notes?: string;
      datePlanted?: string;
      expectedHarvest?: string;
    }) => {
      const r = await fetch("/api/plantings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("create planting failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["plantings"] }),
  });

  const changePlantingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PlantingStatus }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "harvested") {
        patch.actualHarvest = new Date().toISOString();
      }
      const r = await fetch(`/api/plantings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error("update planting failed");
      return r.json();
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["plantings"] });
      const prev = qc.getQueryData<Planting[]>(["plantings"]);
      qc.setQueryData<Planting[]>(["plantings"], (old) =>
        (old ?? []).map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                actualHarvest:
                  status === "harvested" ? new Date().toISOString() : p.actualHarvest,
              }
            : p,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["plantings"], ctx.prev);
      toast.error("Could not update planting.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["plantings"] }),
  });

  const deletePlanting = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/plantings/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("delete planting failed");
      return r.json();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["plantings"] });
      const prev = qc.getQueryData<Planting[]>(["plantings"]);
      qc.setQueryData<Planting[]>(["plantings"], (old) =>
        (old ?? []).filter((p) => p.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["plantings"], ctx.prev);
      toast.error("Could not delete planting.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["plantings"] }),
  });

  const reseed = () => {
    fetch("/api/seed", { method: "POST" })
      .then(() => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
        qc.invalidateQueries({ queryKey: ["plantings"] });
        toast.success("Demo data restored.");
      })
      .catch(() => toast.error("Could not reseed."));
  };

  const tasks = tasksQ.data ?? [];
  const plantings = plantingsQ.data ?? [];
  const loading = tasksQ.isLoading || plantingsQ.isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background paper-texture">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger value="dashboard" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="chores" className="gap-1.5">
                <ListTodo className="h-3.5 w-3.5" />
                Chores
                {tasks.filter((t) => !t.completed).length > 0 && (
                  <span className="ml-1 rounded-full bg-accent/20 px-1.5 text-[10px] font-medium text-accent-foreground">
                    {tasks.filter((t) => !t.completed).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="plantings" className="gap-1.5">
                <Sprout className="h-3.5 w-3.5" />
                Plantings
              </TabsTrigger>
            </TabsList>

            <Button
              variant="ghost"
              size="sm"
              onClick={reseed}
              className="text-muted-foreground"
              title="Reset the demo data"
            >
              <Database className="mr-1.5 h-3.5 w-3.5" />
              Reset demo data
            </Button>
          </div>

          <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
            {loading ? (
              <LoadingCard />
            ) : (
              <Dashboard
                tasks={tasks}
                plantings={plantings}
                onGoToChores={() => setTab("chores")}
              />
            )}
          </TabsContent>

          <TabsContent value="chores" className="m-0 focus-visible:outline-none">
            {loading ? (
              <LoadingCard />
            ) : (
              <Chores
                tasks={tasks}
                onToggle={(id, completed) => toggleTask.mutate({ id, completed })}
                onDelete={(id) => deleteTask.mutate(id)}
                onCreate={(data) => {
                  createTask.mutate(data, {
                    onSuccess: () => toast.success("Chore added to the ledger."),
                    onError: () => toast.error("Could not add chore."),
                  });
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="plantings" className="m-0 focus-visible:outline-none">
            {loading ? (
              <LoadingCard />
            ) : (
              <Plantings
                plantings={plantings}
                onCreate={(data) => {
                  createPlanting.mutate(data, {
                    onSuccess: () => toast.success("Planting added to the field log."),
                    onError: () => toast.error("Could not add planting."),
                  });
                }}
                onStatusChange={(id, status) =>
                  changePlantingStatus.mutate({ id, status })
                }
                onDelete={(id) => deletePlanting.mutate(id)}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-auto border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-5 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary/70" />
            <span className="font-serif text-sm italic">Hearthstead</span>
            <span className="mx-1">·</span>
            A quiet ledger for the homestead.
          </p>
          <p>
            Data lives in a local SQLite file — refresh anytime with{' '}
            <button
              onClick={reseed}
              className="underline underline-offset-2 hover:text-foreground"
            >
              reset demo data
            </button>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 py-16 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary/60" />
        Warming the kettle and pulling the journal off the shelf…
      </div>
    </div>
  );
}

function nextDueDate(
  recurrence: TaskRecurrence,
  currentIso: string | null,
): string | null {
  const base = currentIso ? new Date(currentIso) : new Date();
  const next = new Date(base);
  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return next.toISOString();
}
