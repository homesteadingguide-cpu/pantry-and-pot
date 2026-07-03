"use client";

import { useState } from "react";
import { Apple, Leaf, Pencil, Plus, Sprout, Trash2 } from "lucide-react";
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
  type Planting,
  type PlantingStatus,
  PLANTING_STATUSES,
  formatDate,
  formatRelative,
  statusToneClass,
} from "./types";

interface Props {
  plantings: Planting[];
  onCreate: (data: {
    crop: string;
    variety?: string;
    spot?: string;
    status: PlantingStatus;
    quantity: number;
    notes?: string;
    datePlanted?: string;
    expectedHarvest?: string;
  }) => void;
  onEdit: (id: string, data: {
    crop: string;
    variety?: string;
    spot?: string;
    status: PlantingStatus;
    quantity: number;
    notes?: string;
    datePlanted?: string;
    expectedHarvest?: string;
  }) => void;
  onStatusChange: (id: string, status: PlantingStatus) => void;
  onDelete: (id: string) => void;
}

export function Plantings({
  plantings,
  onCreate,
  onEdit,
  onStatusChange,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);

  const grouped = PLANTING_STATUSES.map((s) => ({
    ...s,
    items: plantings.filter((p) => p.status === s.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Plantings</h2>
          <p className="text-sm text-muted-foreground">
            Balcony pots, windowsill jars, and grow-shelf trays — from seed to plate.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" />
              New planting
            </Button>
          </DialogTrigger>
          <PlantingFormDialog
            title="Add a planting"
            description="A single pot, jar, or tray. Add as many as you like."
            submitLabel="Add to counter garden"
            onClose={() => setOpen(false)}
            onSubmit={(data) => {
              onCreate(data);
              setOpen(false);
              toast.success("Planting added to the counter garden.");
            }}
          />
        </Dialog>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No plantings yet — add your first row to begin the season.
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
                  {group.items.length} planting{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((p) => (
                  <PlantingCard
                    key={p.id}
                    planting={p}
                    onEdit={onEdit}
                    onStatusChange={onStatusChange}
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

function PlantingCard({
  planting,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  planting: Planting;
  onEdit: (id: string, data: {
    crop: string;
    variety?: string;
    spot?: string;
    status: PlantingStatus;
    quantity: number;
    notes?: string;
    datePlanted?: string;
    expectedHarvest?: string;
  }) => void;
  onStatusChange: (id: string, status: PlantingStatus) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = planting.status === "harvested" ? Apple : Sprout;
  const [editOpen, setEditOpen] = useState(false);
  const nextStatus: PlantingStatus | null = (() => {
    const order: PlantingStatus[] = [
      "planned",
      "seeded",
      "sprouted",
      "growing",
      "harvest-ready",
      "harvested",
    ];
    const i = order.indexOf(planting.status);
    if (i === -1 || i === order.length - 1) return null;
    return order[i + 1];
  })();

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
                {planting.crop}
              </h3>
              {planting.variety && (
                <p className="text-xs italic text-muted-foreground">
                  {planting.variety}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  aria-label="Edit planting"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <PlantingFormDialog
                title="Edit planting"
                description="Update the planting details."
                submitLabel="Save changes"
                initial={planting}
                onClose={() => setEditOpen(false)}
                onSubmit={(data) => {
                  onEdit(planting.id, data);
                  setEditOpen(false);
                }}
              />
            </Dialog>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(planting.id)}
              aria-label="Delete planting"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Field label="Spot" value={planting.spot ?? "—"} />
          <Field label="Quantity" value={`${planting.quantity}`} />
          <Field
            label="Planted"
            value={formatDate(planting.datePlanted)}
          />
          <Field
            label="Harvest"
            value={
              planting.actualHarvest
                ? formatDate(planting.actualHarvest)
                : formatRelative(planting.expectedHarvest)
            }
          />
        </div>

        {planting.notes && (
          <p className="mt-3 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
            {planting.notes}
          </p>
        )}

        {nextStatus && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => onStatusChange(planting.id, nextStatus)}
          >
            Mark as{" "}
            {PLANTING_STATUSES.find((s) => s.value === nextStatus)?.label.toLowerCase()}
            <Leaf className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
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

function PlantingFormDialog({
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
    crop: string;
    variety?: string | null;
    spot?: string | null;
    status: PlantingStatus;
    quantity: number;
    notes?: string | null;
    datePlanted?: string | null;
    expectedHarvest?: string | null;
  };
  onClose: () => void;
  onSubmit: (data: {
    crop: string;
    variety?: string;
    spot?: string;
    status: PlantingStatus;
    quantity: number;
    notes?: string;
    datePlanted?: string;
    expectedHarvest?: string;
  }) => void;
}) {
  const isoToInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [crop, setCrop] = useState(initial?.crop ?? "");
  const [variety, setVariety] = useState(initial?.variety ?? "");
  const [spot, setSpot] = useState(initial?.spot ?? "");
  const [status, setStatus] = useState<PlantingStatus>(initial?.status ?? "planned");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [datePlanted, setDatePlanted] = useState(isoToInput(initial?.datePlanted));
  const [expectedHarvest, setExpectedHarvest] = useState(isoToInput(initial?.expectedHarvest));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = () => {
    if (!crop.trim()) {
      toast.error("Give the crop a name first.");
      return;
    }
    onSubmit({
      crop: crop.trim(),
      variety: variety.trim() || undefined,
      spot: spot.trim() || undefined,
      status,
      quantity: Number(quantity) || 1,
      notes: notes.trim() || undefined,
      datePlanted: datePlanted || undefined,
      expectedHarvest: expectedHarvest || undefined,
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
            <Label htmlFor="crop">Crop</Label>
            <Input
              id="crop"
              placeholder="e.g. Basil"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variety">Variety</Label>
            <Input
              id="variety"
              placeholder="e.g. Genovese"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="spot">Spot / container</Label>
            <Input
              id="spot"
              placeholder="e.g. Balcony railing, Kitchen window"
              value={spot}
              onChange={(e) => setSpot(e.target.value)}
            />
          </div>
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
        </div>
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PlantingStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANTING_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="planted">Planted on</Label>
            <Input
              id="planted"
              type="date"
              value={datePlanted}
              onChange={(e) => setDatePlanted(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="harvest">Expected harvest</Label>
            <Input
              id="harvest"
              type="date"
              value={expectedHarvest}
              onChange={(e) => setExpectedHarvest(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pnotes">Notes</Label>
          <Textarea
            id="pnotes"
            placeholder="Optional — soil mix, light, companion plant"
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
