"use client";

import { useState } from "react";
import {
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Undo2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  type PantryItem,
  type ShoppingItem,
  PANTRY_UNITS,
  formatDate,
} from "./types";

interface Props {
  items: ShoppingItem[];
  lowStockPantry: PantryItem[];
  onCreate: (data: {
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    pantryItemId?: string;
  }) => void;
  onAdjust: (id: string, delta: number) => void;
  onToggleGot: (id: string, got: boolean) => void;
  onAddFromPantry: (item: PantryItem) => void;
  onRestockPantry: (id: string, qty: number) => void;
  onClearGot: () => void;
  onDelete: (id: string) => void;
}

export function Shopping({
  items,
  lowStockPantry,
  onCreate,
  onAdjust,
  onToggleGot,
  onAddFromPantry,
  onRestockPantry,
  onClearGot,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);

  const pending = items.filter((i) => !i.gotAt);
  const got = items.filter((i) => i.gotAt);

  // Low-stock pantry items not yet on the shopping list.
  const pantryIdsOnList = new Set(
    items.filter((i) => i.pantryItemId).map((i) => i.pantryItemId),
  );
  const suggestions = lowStockPantry.filter(
    (p) => !pantryIdsOnList.has(p.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Shopping list</h2>
          <p className="text-sm text-muted-foreground">
            Auto-suggested from your pantry plus anything else you need.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" />
              Add item
            </Button>
          </DialogTrigger>
          <AddShoppingDialog
            onClose={() => setOpen(false)}
            onCreate={(data) => {
              onCreate(data);
              setOpen(false);
            }}
          />
        </Dialog>
      </div>

      {/* Suggestions from pantry */}
      {suggestions.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium text-foreground">
                Suggested from your pantry
              </p>
              <span className="text-xs text-muted-foreground">
                {suggestions.length} item{suggestions.length === 1 ? "" : "s"} running low
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onAddFromPantry(p)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs ring-1 ring-accent/30 transition hover:bg-accent/10"
                >
                  <Plus className="h-3 w-3" />
                  {p.name}
                  <span className="text-muted-foreground">
                    ({p.quantity} {p.unit})
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending list */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-serif text-lg">To buy</p>
            <span className="text-xs text-muted-foreground">
              {pending.length} item{pending.length === 1 ? "" : "s"}
            </span>
          </div>
          {pending.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              List is empty. Add items above or accept a pantry suggestion.
            </div>
          ) : (
            <ul className="space-y-2">
              {pending.map((i) => (
                <ShoppingRow
                  key={i.id}
                  item={i}
                  onAdjust={onAdjust}
                  onToggleGot={onToggleGot}
                  onRestockPantry={onRestockPantry}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Got */}
      {got.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-serif text-lg">Got it</p>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={onClearGot}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Clear all
              </Button>
            </div>
            <ul className="space-y-2">
              {got.map((i) => (
                <ShoppingRow
                  key={i.id}
                  item={i}
                  onAdjust={onAdjust}
                  onToggleGot={onToggleGot}
                  onRestockPantry={onRestockPantry}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ShoppingRow({
  item,
  onAdjust,
  onToggleGot,
  onRestockPantry,
  onDelete,
}: {
  item: ShoppingItem;
  onAdjust: (id: string, delta: number) => void;
  onToggleGot: (id: string, got: boolean) => void;
  onRestockPantry: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
}) {
  const [restockOpen, setRestockOpen] = useState(false);
  const got = !!item.gotAt;

  return (
    <li
      className={`group flex items-center gap-2 rounded-md border bg-card/60 px-3 py-2.5 transition hover:bg-card ${
        got ? "border-border/50 opacity-70" : "border-border/70"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleGot(item.id, !got)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
          got
            ? "bg-primary text-primary-foreground"
            : "border-2 border-muted-foreground/30 text-transparent hover:border-primary"
        }`}
        aria-label={got ? "Mark as not got" : "Mark as got"}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${got ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.quantity} {item.unit}
          {item.notes ? ` · ${item.notes}` : ""}
          {got && item.gotAt && ` · got ${formatDate(item.gotAt)}`}
        </p>
      </div>
      {!got && (
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
      )}
      {got && item.pantryItemId && (
        <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-primary/30 text-primary hover:bg-primary/10"
            >
              Restock pantry
            </Button>
          </DialogTrigger>
          <RestockDialog
            itemName={item.name}
            onClose={() => setRestockOpen(false)}
            onSubmit={(qty) => {
              onRestockPantry(item.id, qty);
              setRestockOpen(false);
            }}
          />
        </Dialog>
      )}
      {got && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={() => onToggleGot(item.id, false)}
          aria-label="Move back to list"
          title="Move back to list"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label="Delete shopping item"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
}

function AddShoppingDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pack");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Give the item a name first.");
      return;
    }
    onCreate({
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      notes: notes.trim() || undefined,
    });
    onClose();
    toast.success("Added to shopping list.");
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">Add to shopping list</DialogTitle>
        <DialogDescription>
          Anything you need to pick up — ad-hoc items not tied to the pantry.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Item</Label>
          <Input
            id="name"
            placeholder="e.g. Eggs, Rice vinegar…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
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
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Optional — brand, store, substitute"
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
        <Button onClick={submit}>Add to list</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function RestockDialog({
  itemName,
  onClose,
  onSubmit,
}: {
  itemName: string;
  onClose: () => void;
  onSubmit: (qty: number) => void;
}) {
  const [qty, setQty] = useState("1");
  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">Restock pantry</DialogTitle>
        <DialogDescription>
          How much of <strong>{itemName}</strong> did you buy? This adds to the
          pantry quantity.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="restock-qty">Quantity to add</Label>
          <Input
            id="restock-qty"
            type="number"
            min={0}
            step="0.1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            const n = Number(qty);
            if (!Number.isFinite(n) || n <= 0) {
              toast.error("Enter a quantity greater than 0.");
              return;
            }
            onSubmit(n);
          }}
        >
          Restock
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
