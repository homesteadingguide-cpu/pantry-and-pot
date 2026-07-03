"use client";

import { useState } from "react";
import {
  FlaskConical,
  Leaf,
  Pencil,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  type Batch,
  type BatchStatus,
  type BatchType,
  BATCH_NEXT,
  BATCH_STATUSES,
  BATCH_TYPES,
  formatDate,
  formatRelative,
  statusToneClass,
} from "./types";

interface Props {
  batches: Batch[];
  onCreate: (data: {
    type: BatchType;
    name: string;
    status: BatchStatus;
    startDate?: string;
    expectedEnd?: string;
    notes?: string;
  }) => void;
  onEdit: (id: string, data: {
    type: BatchType;
    name: string;
    status: BatchStatus;
    startDate?: string;
    expectedEnd?: string;
    notes?: string;
  }) => void;
  onAdvance: (id: string, status: BatchStatus) => void;
  onFeed?: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Batches({ batches, onCreate, onEdit, onAdvance, onFeed, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  const grouped = BATCH_STATUSES.map((s) => ({
    ...s,
    items: batches.filter((b) => b.status === s.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Cultures &amp; ferments</h2>
          <p className="text-sm text-muted-foreground">
            Kombucha, sourdough, kraut, kefir — every living thing on your counter.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" />
              New batch
            </Button>
          </DialogTrigger>
          <BatchFormDialog
            title="Start a new batch"
            description="Kombucha, sourdough, kraut, kefir, kimchi — track each one from start to jar."
            submitLabel="Add to counter"
            onClose={() => setOpen(false)}
            onSubmit={(data) => {
              onCreate(data);
              setOpen(false);
              toast.success("Batch added to the counter.");
            }}
          />
        </Dialog>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No active cultures yet — start your first SCOBY hotel or sourdough starter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.value}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusToneClass(group.tone)}`}
                >
                  {group.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {group.items.length} batch{group.items.length === 1 ? "" : "es"} · {group.hint}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((b) => (
                  <BatchCard
                    key={b.id}
                    batch={b}
                    onEdit={onEdit}
                    onAdvance={onAdvance}
                    onFeed={onFeed}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function BatchCard({
  batch,
  onEdit,
  onAdvance,
  onFeed,
  onDelete,
}: {
  batch: Batch;
  onEdit: (id: string, data: {
    type: BatchType;
    name: string;
    status: BatchStatus;
    startDate?: string;
    expectedEnd?: string;
    notes?: string;
  }) => void;
  onAdvance: (id: string, status: BatchStatus) => void;
  onFeed?: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = FlaskConical;
  const [editOpen, setEditOpen] = useState(false);
  const next = BATCH_NEXT[batch.status];
  const nextLabel = next
    ? BATCH_STATUSES.find((s) => s.value === next)?.label.toLowerCase()
    : null;

  return (
    <Card className="group flex flex-col">
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg leading-tight text-foreground">
                {batch.name}
              </h3>
              <p className="text-xs capitalize text-muted-foreground">
                {batch.type}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  aria-label="Edit batch"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <BatchFormDialog
                title="Edit batch"
                description="Update the batch details."
                submitLabel="Save changes"
                initial={batch}
                onClose={() => setEditOpen(false)}
                onSubmit={(data) => {
                  onEdit(batch.id, data);
                  setEditOpen(false);
                }}
              />
            </Dialog>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(batch.id)}
              aria-label="Delete batch"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Field label="Started" value={formatDate(batch.startDate)} />
          <Field
            label={batch.status === "consumed" || batch.status === "discarded" ? "Finished" : "Expected"}
            value={
              batch.actualEnd
                ? formatDate(batch.actualEnd)
                : formatRelative(batch.expectedEnd)
            }
          />
        </div>

        {/* For fed cultures, show last-fed date as a third field. */}
        {showFeedField(batch) && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <Field
              label={batch.type === "sourdough" ? "Last fed" : "Last refreshed"}
              value={batch.lastFedAt ? formatRelative(batch.lastFedAt) : "—"}
            />
          </div>
        )}

        {batch.notes && (
          <p className="mt-3 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
            {batch.notes}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          {/* "Mark as fed" — only for active cultures that need recurring feeding. */}
          {batch.status === "active" &&
            (batch.type === "sourdough" ||
              batch.type === "kefir" ||
              batch.type === "kombucha") &&
            onFeed && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-accent/40 text-accent hover:bg-accent/10"
                onClick={() => onFeed(batch.id)}
              >
                <Sprout className="mr-1.5 h-3.5 w-3.5" />
                {batch.type === "sourdough" ? "Mark as fed" : "Mark as refreshed"}
              </Button>
            )}

          {next && nextLabel && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => onAdvance(batch.id, next)}
            >
              Mark as {nextLabel}
              <Leaf className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function showFeedField(batch: Batch): boolean {
  return (
    batch.type === "sourdough" ||
    batch.type === "kefir" ||
    batch.type === "kombucha"
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function BatchFormDialog({
  title,
  description,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  submitLabel: string;
  initial?: {
    type: BatchType;
    name: string;
    status: BatchStatus;
    startDate?: string | null;
    expectedEnd?: string | null;
    notes?: string | null;
  };
  onClose: () => void;
  onSubmit: (data: {
    type: BatchType;
    name: string;
    status: BatchStatus;
    startDate?: string;
    expectedEnd?: string;
    notes?: string;
  }) => void;
}) {
  const isoToInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [type, setType] = useState<BatchType>(initial?.type ?? "kombucha");
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<BatchStatus>(initial?.status ?? "active");
  const [startDate, setStartDate] = useState(isoToInput(initial?.startDate));
  const [expectedEnd, setExpectedEnd] = useState(isoToInput(initial?.expectedEnd));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Give the batch a name first.");
      return;
    }
    onSubmit({
      type,
      name: name.trim(),
      status,
      notes: notes.trim() || undefined,
      startDate: startDate || undefined,
      expectedEnd: expectedEnd || undefined,
    });
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as BatchType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BATCH_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Raspberry-ginger 2F"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as BatchStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BATCH_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start">Started on</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">Expected end</Label>
            <Input
              id="end"
              type="date"
              value={expectedEnd}
              onChange={(e) => setExpectedEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bnotes">Notes</Label>
          <Textarea
            id="bnotes"
            placeholder="Optional — recipe, ratios, observations"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit}>{submitLabel}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
