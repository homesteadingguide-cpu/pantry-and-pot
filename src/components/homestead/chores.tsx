"use client";

import { useState } from "react";
import {
  Croissant,
  CheckCircle2,
  Circle,
  FlaskConical,
  Archive,
  Leaf,
  Pencil,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  type Task,
  type TaskCategory,
  type TaskPriority,
  type TaskRecurrence,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  formatRelative,
  priorityClass,
} from "./types";

const CATEGORY_ICONS: Record<TaskCategory, React.ElementType> = {
  general: Leaf,
  kitchen: Croissant,
  balcony: Sprout,
  pantry: Archive,
  brewing: FlaskConical,
};

interface Props {
  tasks: Task[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onCreate: (data: {
    title: string;
    notes?: string;
    category: TaskCategory;
    recurrence: TaskRecurrence;
    priority: TaskPriority;
    dueDate?: string;
  }) => void;
  onEdit: (id: string, data: {
    title: string;
    notes?: string;
    category: TaskCategory;
    recurrence: TaskRecurrence;
    priority: TaskPriority;
    dueDate?: string;
  }) => void;
}

export function Chores({ tasks, onToggle, onDelete, onCreate, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<TaskCategory | "all">("all");

  const visible =
    filter === "all" ? tasks : tasks.filter((t) => t.category === filter);

  const active = visible.filter((t) => !t.completed);
  const done = visible.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Chore ledger</h2>
          <p className="text-sm text-muted-foreground">
            Recurring and one-off tasks, sorted by due date.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" />
              New chore
            </Button>
          </DialogTrigger>
          <ChoreFormDialog
            title="Add a chore"
            description="Recurring chores will show on their due day each cycle."
            submitLabel="Add to ledger"
            onClose={() => setOpen(false)}
            onSubmit={(data) => {
              onCreate(data);
              setOpen(false);
              toast.success("Chore added to the ledger.");
            }}
          />
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={tasks.length}
        />
        {TASK_CATEGORIES.map((c) => (
          <FilterChip
            key={c.value}
            active={filter === c.value}
            onClick={() => setFilter(c.value)}
            label={c.label}
            count={tasks.filter((t) => t.category === c.value).length}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Active */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Still to do</CardTitle>
            <CardDescription>{active.length} open chores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[40rem] overflow-y-auto pr-1">
            {active.length === 0 ? (
              <EmptyHint label="All caught up — go put the kettle on." />
            ) : (
              active.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Done */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Finished</CardTitle>
            <CardDescription>{done.length} ticked off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[40rem] overflow-y-auto pr-1">
            {done.length === 0 ? (
              <EmptyHint label="Nothing finished yet today." />
            ) : (
              done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: {
    title: string;
    notes?: string;
    category: TaskCategory;
    recurrence: TaskRecurrence;
    priority: TaskPriority;
    dueDate?: string;
  }) => void;
}) {
  const Icon = CATEGORY_ICONS[task.category] ?? Leaf;
  const [editOpen, setEditOpen] = useState(false);
  return (
    <div className="group flex items-start gap-3 rounded-md border border-border/70 bg-card/60 px-3 py-2.5 transition hover:bg-card">
      <button
        type="button"
        onClick={() => onToggle(task.id, !task.completed)}
        className="mt-0.5 shrink-0"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
        )}
      </button>
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${task.completed ? "text-muted-foreground/50" : "text-primary"}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="capitalize">{task.category}</span>
          {task.recurrence !== "none" && (
            <Badge variant="outline" className="border-border px-1.5 py-0 text-[10px] capitalize">
              {task.recurrence}
            </Badge>
          )}
          {task.dueDate && <span>· due {formatRelative(task.dueDate)}</span>}
          {task.priority !== "normal" && (
            <span className={priorityClass(task.priority)}>
              · {task.priority}
            </span>
          )}
        </div>
        {task.notes && (
          <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              aria-label="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <ChoreFormDialog
            title="Edit chore"
            description="Update the chore details."
            submitLabel="Save changes"
            initial={task}
            onClose={() => setEditOpen(false)}
            onSubmit={(data) => {
              onEdit(task.id, data);
              setEditOpen(false);
            }}
          />
        </Dialog>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-primary text-primary-foreground ring-1 ring-primary"
          : "bg-muted text-muted-foreground ring-1 ring-border hover:bg-secondary/60"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[10px] ${
          active ? "bg-primary-foreground/20" : "bg-background/70"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ChoreFormDialog({
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
    title: string;
    notes?: string | null;
    category: TaskCategory;
    recurrence: TaskRecurrence;
    priority: TaskPriority;
    dueDate?: string | null;
  };
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    notes?: string;
    category: TaskCategory;
    recurrence: TaskRecurrence;
    priority: TaskPriority;
    dueDate?: string;
  }) => void;
}) {
  const isoToInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [tTitle, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [category, setCategory] = useState<TaskCategory>(initial?.category ?? "general");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(initial?.recurrence ?? "none");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "normal");
  const [dueDate, setDueDate] = useState(isoToInput(initial?.dueDate));

  const submit = () => {
    if (!tTitle.trim()) {
      toast.error("Give the chore a name first.");
      return;
    }
    onSubmit({
      title: tTitle.trim(),
      notes: notes.trim() || undefined,
      category,
      recurrence,
      priority,
      dueDate: dueDate || undefined,
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
        <div className="space-y-1.5">
          <Label htmlFor="title">What needs doing?</Label>
          <Input
            id="title"
            placeholder="e.g. Feed the sourdough starter"
            value={tTitle}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as TaskRecurrence)}>
              <SelectTrigger className="capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_RECURRENCES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due">Due date</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Optional context, e.g. ‘1:1:1 ratio — 20g starter, 20g flour, 20g water’"
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

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
