"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  Database,
  FlaskConical,
  LayoutDashboard,
  ListTodo,
  ShoppingCart,
  Sprout,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/homestead/header";
import { Dashboard } from "@/components/homestead/dashboard";
import { Chores } from "@/components/homestead/chores";
import { Plantings } from "@/components/homestead/plantings";
import { Batches } from "@/components/homestead/batches";
import { Pantry } from "@/components/homestead/pantry";
import { Shopping } from "@/components/homestead/shopping";
import {
  type Batch,
  type BatchStatus,
  type BatchType,
  type PantryCategory,
  type PantryItem,
  type Planting,
  type PlantingStatus,
  type ShoppingItem,
  type Task,
  type TaskCategory,
  type TaskPriority,
  type TaskRecurrence,
  isLowStock,
} from "@/components/homestead/types";

type TabKey = "dashboard" | "chores" | "plantings" | "batches" | "pantry" | "shopping";

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
          // Quick empty-check across all tables
          const [p, b, y] = await Promise.all([
            fetch("/api/plantings", { cache: "no-store" }).then((x) => x.json()).catch(() => []),
            fetch("/api/batches", { cache: "no-store" }).then((x) => x.json()).catch(() => []),
            fetch("/api/pantry", { cache: "no-store" }).then((x) => x.json()).catch(() => []),
          ]);
          if (
            (Array.isArray(p) && p.length === 0) ||
            (Array.isArray(b) && b.length === 0) ||
            (Array.isArray(y) && y.length === 0)
          ) {
            await fetch("/api/seed", { method: "POST" });
            qc.invalidateQueries({ queryKey: ["tasks"] });
            qc.invalidateQueries({ queryKey: ["plantings"] });
            qc.invalidateQueries({ queryKey: ["batches"] });
            qc.invalidateQueries({ queryKey: ["pantry"] });
            qc.invalidateQueries({ queryKey: ["shopping"] });
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
  const batchesQ = useQuery({
    queryKey: ["batches"],
    queryFn: () => fetchJson<Batch[]>("/api/batches"),
    enabled: seeded,
  });
  const pantryQ = useQuery({
    queryKey: ["pantry"],
    queryFn: () => fetchJson<PantryItem[]>("/api/pantry"),
    enabled: seeded,
  });
  const shoppingQ = useQuery({
    queryKey: ["shopping"],
    queryFn: () => fetchJson<ShoppingItem[]>("/api/shopping"),
    enabled: seeded,
  });

  // -------- Tasks --------
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
      const current = qc.getQueryData<Task[]>(["tasks"])?.find((t) => t.id === vars.id);
      if (current && current.recurrence !== "none") {
        const next = nextDueDate(current.recurrence, current.dueDate);
        if (next) {
          createTask.mutate({
            title: current.title,
            notes: current.notes ?? undefined,
            category: current.category,
            recurrence: current.recurrence,
            priority: current.priority,
            dueDate: next,
          });
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
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

  const editTask = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        title: string;
        notes?: string;
        category: TaskCategory;
        recurrence: TaskRecurrence;
        priority: TaskPriority;
        dueDate?: string;
      };
    }) => {
      const r = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("edit task failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // -------- Plantings --------
  const createPlanting = useMutation({
    mutationFn: async (data: {
      crop: string;
      variety?: string;
      spot?: string;
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

  const editPlanting = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        crop: string;
        variety?: string;
        spot?: string;
        status: PlantingStatus;
        quantity: number;
        notes?: string;
        datePlanted?: string;
        expectedHarvest?: string;
      };
    }) => {
      const r = await fetch(`/api/plantings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("edit planting failed");
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

  // -------- Batches --------
  const createBatch = useMutation({
    mutationFn: async (data: {
      type: BatchType;
      name: string;
      status: BatchStatus;
      startDate?: string;
      expectedEnd?: string;
      notes?: string;
    }) => {
      const r = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("create batch failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });

  const editBatch = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        type: BatchType;
        name: string;
        status: BatchStatus;
        startDate?: string;
        expectedEnd?: string;
        notes?: string;
      };
    }) => {
      const r = await fetch(`/api/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("edit batch failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });

  const advanceBatch = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BatchStatus }) => {
      const r = await fetch(`/api/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("update batch failed");
      return r.json();
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["batches"] });
      const prev = qc.getQueryData<Batch[]>(["batches"]);
      qc.setQueryData<Batch[]>(["batches"], (old) =>
        (old ?? []).map((b) => {
          if (b.id !== id) return b;
          const patch: Partial<Batch> = { status };
          if (status === "consumed" || status === "discarded") {
            patch.actualEnd = new Date().toISOString();
          }
          return { ...b, ...patch };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["batches"], ctx.prev);
      toast.error("Could not update batch.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });

  const feedBatch = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markFed: true }),
      });
      if (!r.ok) throw new Error("feed batch failed");
      return r.json();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["batches"] });
      const prev = qc.getQueryData<Batch[]>(["batches"]);
      const nowIso = new Date().toISOString();
      qc.setQueryData<Batch[]>(["batches"], (old) =>
        (old ?? []).map((b) =>
          b.id === id ? { ...b, lastFedAt: nowIso } : b,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["batches"], ctx.prev);
      toast.error("Could not mark as fed.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });

  const deleteBatch = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("delete batch failed");
      return r.json();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["batches"] });
      const prev = qc.getQueryData<Batch[]>(["batches"]);
      qc.setQueryData<Batch[]>(["batches"], (old) =>
        (old ?? []).filter((b) => b.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["batches"], ctx.prev);
      toast.error("Could not delete batch.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });

  // -------- Pantry --------
  const createPantryItem = useMutation({
    mutationFn: async (data: {
      name: string;
      category: PantryCategory;
      quantity: number;
      unit: string;
      lowStockAt?: number;
      location?: string;
      notes?: string;
    }) => {
      const r = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("create pantry failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const adjustPantryItem = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const items = qc.getQueryData<PantryItem[]>(["pantry"]) ?? [];
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error("not found");
      const next = Math.max(0, Number((item.quantity + delta).toFixed(2)));
      const r = await fetch(`/api/pantry/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: next }),
      });
      if (!r.ok) throw new Error("adjust pantry failed");
      return r.json();
    },
    onMutate: async ({ id, delta }) => {
      await qc.cancelQueries({ queryKey: ["pantry"] });
      const prev = qc.getQueryData<PantryItem[]>(["pantry"]);
      qc.setQueryData<PantryItem[]>(["pantry"], (old) =>
        (old ?? []).map((i) =>
          i.id === id
            ? { ...i, quantity: Math.max(0, Number((i.quantity + delta).toFixed(2))) }
            : i,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["pantry"], ctx.prev);
      toast.error("Could not adjust quantity.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const deletePantryItem = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/pantry/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("delete pantry failed");
      return r.json();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["pantry"] });
      const prev = qc.getQueryData<PantryItem[]>(["pantry"]);
      qc.setQueryData<PantryItem[]>(["pantry"], (old) =>
        (old ?? []).filter((i) => i.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["pantry"], ctx.prev);
      toast.error("Could not delete pantry item.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const editPantryItem = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        category: PantryCategory;
        quantity: number;
        unit: string;
        lowStockAt?: number;
        location?: string;
        notes?: string;
      };
    }) => {
      const r = await fetch(`/api/pantry/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("edit pantry failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  // -------- Shopping --------
  const createShoppingItem = useMutation({
    mutationFn: async (data: {
      name: string;
      quantity?: number;
      unit?: string;
      notes?: string;
      pantryItemId?: string;
    }) => {
      const r = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("create shopping failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const adjustShoppingItem = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const items = qc.getQueryData<ShoppingItem[]>(["shopping"]) ?? [];
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error("not found");
      const next = Math.max(0, Number((item.quantity + delta).toFixed(2)));
      const r = await fetch(`/api/shopping/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: next }),
      });
      if (!r.ok) throw new Error("adjust shopping failed");
      return r.json();
    },
    onMutate: async ({ id, delta }) => {
      await qc.cancelQueries({ queryKey: ["shopping"] });
      const prev = qc.getQueryData<ShoppingItem[]>(["shopping"]);
      qc.setQueryData<ShoppingItem[]>(["shopping"], (old) =>
        (old ?? []).map((i) =>
          i.id === id
            ? { ...i, quantity: Math.max(0, Number((i.quantity + delta).toFixed(2))) }
            : i,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["shopping"], ctx.prev);
      toast.error("Could not adjust quantity.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const toggleShoppingGot = useMutation({
    mutationFn: async ({ id, got }: { id: string; got: boolean }) => {
      const r = await fetch(`/api/shopping/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ got }),
      });
      if (!r.ok) throw new Error("toggle shopping got failed");
      return r.json();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const deleteShoppingItem = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/shopping/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("delete shopping failed");
      return r.json();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["shopping"] });
      const prev = qc.getQueryData<ShoppingItem[]>(["shopping"]);
      qc.setQueryData<ShoppingItem[]>(["shopping"], (old) =>
        (old ?? []).filter((i) => i.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["shopping"], ctx.prev);
      toast.error("Could not delete shopping item.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  // Restock pantry from a shopping item: add qty to the linked PantryItem
  // and delete the shopping item.
  const restockPantryFromShopping = useMutation({
    mutationFn: async ({
      shoppingId,
      pantryItemId,
      qty,
    }: {
      shoppingId: string;
      pantryItemId: string;
      qty: number;
    }) => {
      // Add qty to pantry
      const items = qc.getQueryData<PantryItem[]>(["pantry"]) ?? [];
      const item = items.find((i) => i.id === pantryItemId);
      const newQty = Math.max(0, Number(((item?.quantity ?? 0) + qty).toFixed(2)));
      const pr = await fetch(`/api/pantry/${pantryItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!pr.ok) throw new Error("restock pantry failed");
      // Delete shopping item
      const sr = await fetch(`/api/shopping/${shoppingId}`, { method: "DELETE" });
      if (!sr.ok) throw new Error("delete shopping failed");
      return { newQty };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["pantry"] });
      qc.invalidateQueries({ queryKey: ["shopping"] });
    },
  });

  const clearGotShopping = useMutation({
    mutationFn: async () => {
      const items = qc.getQueryData<ShoppingItem[]>(["shopping"]) ?? [];
      const got = items.filter((i) => i.gotAt);
      await Promise.all(
        got.map((i) =>
          fetch(`/api/shopping/${i.id}`, { method: "DELETE" }),
        ),
      );
      return { count: got.length };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const reseed = () => {
    fetch("/api/seed", { method: "POST" })
      .then(() => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
        qc.invalidateQueries({ queryKey: ["plantings"] });
        qc.invalidateQueries({ queryKey: ["batches"] });
        qc.invalidateQueries({ queryKey: ["pantry"] });
        qc.invalidateQueries({ queryKey: ["shopping"] });
        toast.success("All data reset to demo defaults.");
      })
      .catch(() => toast.error("Could not reseed."));
  };

  const tasks = tasksQ.data ?? [];
  const plantings = plantingsQ.data ?? [];
  const batches = batchesQ.data ?? [];
  const pantry = pantryQ.data ?? [];
  const shopping = shoppingQ.data ?? [];
  const loading =
    tasksQ.isLoading ||
    plantingsQ.isLoading ||
    batchesQ.isLoading ||
    pantryQ.isLoading ||
    shoppingQ.isLoading;

  const openTaskCount = tasks.filter((t) => !t.completed).length;
  const readyBatchCount = batches.filter(
    (b) => b.status === "bottling" || b.status === "ready",
  ).length;
  const lowStockCount = pantry.filter(isLowStock).length;
  const pendingShoppingCount = shopping.filter((i) => !i.gotAt).length;

  return (
    <div className="min-h-screen flex flex-col bg-background paper-texture">
      <Header
        batches={batches}
        onGoToCultures={() => setTab("batches")}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger value="dashboard" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="chores" className="gap-1.5">
                <ListTodo className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chores</span>
                {openTaskCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-accent/20 px-1.5 text-[10px] font-medium text-accent-foreground">
                    {openTaskCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="plantings" className="gap-1.5">
                <Sprout className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sill &amp; balcony</span>
              </TabsTrigger>
              <TabsTrigger value="batches" className="gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cultures</span>
                {readyBatchCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-accent/20 px-1.5 text-[10px] font-medium text-accent-foreground">
                    {readyBatchCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pantry" className="gap-1.5">
                <Archive className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pantry</span>
                {lowStockCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-accent/20 px-1.5 text-[10px] font-medium text-accent-foreground">
                    {lowStockCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="shopping" className="gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Shopping</span>
                {pendingShoppingCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-accent/20 px-1.5 text-[10px] font-medium text-accent-foreground">
                    {pendingShoppingCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  title="Wipe all data and restore demo seed"
                >
                  <Database className="mr-1.5 h-3.5 w-3.5" />
                  Reset all data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will <strong>permanently delete</strong> every chore,
                    planting, batch, pantry item, and shopping list entry you’ve
                    added, and restore the original demo data. This can’t be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={reseed}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, reset everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
            {loading ? (
              <LoadingCard />
            ) : (
              <Dashboard
                tasks={tasks}
                plantings={plantings}
                batches={batches}
                pantry={pantry}
                onGoToChores={() => setTab("chores")}
                onGoToBatches={() => setTab("batches")}
                onGoToPantry={() => setTab("pantry")}
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
                onEdit={(id, data) => {
                  editTask.mutate(
                    { id, data },
                    {
                      onSuccess: () => toast.success("Chore updated."),
                      onError: () => toast.error("Could not update chore."),
                    },
                  );
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
                    onSuccess: () => toast.success("Planting added to the counter garden."),
                    onError: () => toast.error("Could not add planting."),
                  });
                }}
                onEdit={(id, data) => {
                  editPlanting.mutate(
                    { id, data },
                    {
                      onSuccess: () => toast.success("Planting updated."),
                      onError: () => toast.error("Could not update planting."),
                    },
                  );
                }}
                onStatusChange={(id, status) =>
                  changePlantingStatus.mutate({ id, status })
                }
                onDelete={(id) => deletePlanting.mutate(id)}
              />
            )}
          </TabsContent>

          <TabsContent value="batches" className="m-0 focus-visible:outline-none">
            {loading ? (
              <LoadingCard />
            ) : (
              <Batches
                batches={batches}
                onCreate={(data) => {
                  createBatch.mutate(data, {
                    onSuccess: () => toast.success("Batch added to the counter."),
                    onError: () => toast.error("Could not add batch."),
                  });
                }}
                onEdit={(id, data) => {
                  editBatch.mutate(
                    { id, data },
                    {
                      onSuccess: () => toast.success("Batch updated."),
                      onError: () => toast.error("Could not update batch."),
                    },
                  );
                }}
                onAdvance={(id, status) => advanceBatch.mutate({ id, status })}
                onFeed={(id) => {
                  feedBatch.mutate(id, {
                    onSuccess: () => toast.success("Marked as fed — fresh start."),
                    onError: () => toast.error("Could not mark as fed."),
                  });
                }}
                onDelete={(id) => deleteBatch.mutate(id)}
              />
            )}
          </TabsContent>

          <TabsContent value="pantry" className="m-0 focus-visible:outline-none">
            {loading ? (
              <LoadingCard />
            ) : (
              <Pantry
                items={pantry}
                onCreate={(data) => {
                  createPantryItem.mutate(data, {
                    onSuccess: () => toast.success("Added to the pantry."),
                    onError: () => toast.error("Could not add pantry item."),
                  });
                }}
                onEdit={(id, data) => {
                  editPantryItem.mutate(
                    { id, data },
                    {
                      onSuccess: () => toast.success("Pantry item updated."),
                      onError: () => toast.error("Could not update pantry item."),
                    },
                  );
                }}
                onAdjust={(id, delta) => adjustPantryItem.mutate({ id, delta })}
                onAddToShopping={(item) => {
                  createShoppingItem.mutate(
                    {
                      name: item.name,
                      quantity: Math.max(1, item.lowStockAt ?? 1),
                      unit: item.unit,
                      pantryItemId: item.id,
                    },
                    {
                      onSuccess: () =>
                        toast.success(`${item.name} added to shopping list.`),
                      onError: () =>
                        toast.error("Could not add to shopping list."),
                    },
                  );
                }}
                onDelete={(id) => deletePantryItem.mutate(id)}
              />
            )}
          </TabsContent>

          <TabsContent value="shopping" className="m-0 focus-visible:outline-none">
            {loading ? (
              <LoadingCard />
            ) : (
              <Shopping
                items={shopping}
                lowStockPantry={pantry.filter(isLowStock)}
                onCreate={(data) => {
                  createShoppingItem.mutate(data, {
                    onSuccess: () => toast.success("Added to shopping list."),
                    onError: () => toast.error("Could not add to shopping list."),
                  });
                }}
                onAdjust={(id, delta) =>
                  adjustShoppingItem.mutate({ id, delta })
                }
                onToggleGot={(id, got) =>
                  toggleShoppingGot.mutate({ id, got })
                }
                onAddFromPantry={(item) => {
                  createShoppingItem.mutate(
                    {
                      name: item.name,
                      quantity: Math.max(1, item.lowStockAt ?? 1),
                      unit: item.unit,
                      pantryItemId: item.id,
                    },
                    {
                      onSuccess: () =>
                        toast.success(`${item.name} added to shopping list.`),
                      onError: () =>
                        toast.error("Could not add to shopping list."),
                    },
                  );
                }}
                onRestockPantry={(shoppingId, qty) => {
                  const sItem = shopping.find((i) => i.id === shoppingId);
                  if (!sItem?.pantryItemId) {
                    toast.error("No linked pantry item to restock.");
                    return;
                  }
                  restockPantryFromShopping.mutate(
                    {
                      shoppingId,
                      pantryItemId: sItem.pantryItemId,
                      qty,
                    },
                    {
                      onSuccess: () =>
                        toast.success("Pantry restocked and item cleared."),
                      onError: () =>
                        toast.error("Could not restock pantry."),
                    },
                  );
                }}
                onClearGot={() => {
                  clearGotShopping.mutate(undefined, {
                    onSuccess: (res) =>
                      toast.success(`Cleared ${res?.count ?? 0} got item(s).`),
                    onError: () => toast.error("Could not clear got items."),
                  });
                }}
                onDelete={(id) => deleteShoppingItem.mutate(id)}
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
            A quiet ledger for the apartment homestead.
          </p>
          <p>
            Data lives in a local SQLite file —{' '}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="underline underline-offset-2 hover:text-foreground">
                  reset all data
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes every entry and restores the
                    original demo data. Can’t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={reseed}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, reset everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
