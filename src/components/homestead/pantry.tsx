"use client";

import { useState } from "react";
import { AlertTriangle, Archive, Minus, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  type PantryCategory,
  type PantryItem,
  PANTRY_CATEGORIES,
  PANTRY_UNITS,
  formatDate,
  isLowStock,
  statusToneClass,
} from "./types";

interface Props {
  items: PantryItem[];
  onCreate: (data: {
    name: string;
    category: PantryCategory;
    quantity: number;
    unit: string;
    lowStockAt?: number;
    location?: string;
    notes?: string;
  }) => void;
  onAdjust: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}

export function Pantry({ items, onCreate, onAdjust, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  const lowStock = items.filter(isLowStock);
  const grouped = PANTRY_CATEGORIES.map((c) => ({
    ...c,
    items: items
      .filter((i) => i.category === c.value)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Pantry</h2>
          <p className="text-sm text-muted-foreground">
            Jars, bags, and bottles — what’s on the shelf and what’s running low.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" />
              Add item
            </Button>
          </DialogTrigger>
          <AddItemDialog
            onClose={() => setOpen(false)}
            onCreate={(data) => {
              onCreate(data);
              setOpen(false);
            }}
          />
        </Dialog>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <AlertTriangle className="h-4 w-4 shrink-0 text-accent" />
            <span className="text-sm text-foreground">
              <span className="font-medium">{lowStock.length}</span>{" "}
              {lowStock.length === 1 ? "item is" : "items are"} running low:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {lowStock.map((i) => (
                <span
                  key={i.id}
                  className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-foreground ring-1 ring-accent/30"
                >
                  {i.name} · {i.quantity} {i.unit}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Pantry’s empty — add your flour, salt, and starter supplies to begin.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.value}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusToneClass(group.tone)}`}
                >
                  {group.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <PantryRow
                    key={item.id}
                    item={item}
                    onAdjust={onAdjust}
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

function PantryRow({
  item,
  onAdjust,
  onDelete,
}: {
  item: PantryItem;
  onAdjust: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}) {
  const low = isLowStock(item);
  return (
    <div
      className={`group flex items-center gap-2 rounded-md border bg-card/60 px-3 py-2.5 transition hover:bg-card ${
        low ? "border-accent/40" : "border-border/70"
      }`}
    >
      <Archive className={`h-4 w-4 shrink-0 ${low ? "text-accent" : "text-primary/70"}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.location ?? "no spot"} · added {formatDate(item.dateAdded)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onAdjust(item.id, -1)}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span
          className={`min-w-[3.5rem] text-center text-sm font-medium ${
            low ? "text-accent" : "text-foreground"
          }`}
        >
          {item.quantity}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {item.unit}
          </span>
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onAdjust(item.id, 1)}
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label="Delete pantry item"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function AddItemDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    category: PantryCategory;
    quantity: number;
    unit: string;
    lowStockAt?: number;
    location?: string;
    notes?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PantryCategory>("dry");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("jar");
  const [lowStockAt, setLowStockAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Give the item a name first.");
      return;
    }
    onCreate({
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1,
      unit,
      lowStockAt: lowStockAt === "" ? undefined : Number(lowStockAt),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
    toast.success("Added to the pantry.");
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">Add a pantry item</DialogTitle>
        <DialogDescription>
          Jars, bags, bottles — anything you’d want to track before it runs out.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Item</Label>
          <Input
            id="name"
            placeholder="e.g. Croissant flour"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as PantryCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PANTRY_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PANTRY_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={0}
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="low">Low-stock alert at</Label>
            <Input
              id="low"
              type="number"
              min={0}
              step="0.1"
              value={lowStockAt}
              onChange={(e) => setLowStockAt(e.target.value)}
              placeholder="optional"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc">Location</Label>
          <Input
            id="loc"
            placeholder="e.g. Top shelf, Fridge door"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pn">Notes</Label>
          <Textarea
            id="pn"
            placeholder="Optional — supplier, expiry, batch"
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
        <Button onClick={submit}>Add to pantry</Button>
      </DialogFooter>
    </DialogContent>
  );
}
