import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.planting.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.crop === "string") patch.crop = body.crop.trim();
  if (body.variety !== undefined) patch.variety = body.variety?.trim() || null;
  if (body.bed !== undefined) patch.bed = body.bed?.trim() || null;
  if (typeof body.status === "string") patch.status = body.status;
  if (body.quantity !== undefined) patch.quantity = Number(body.quantity) || 0;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (body.datePlanted !== undefined) {
    patch.datePlanted = body.datePlanted ? new Date(body.datePlanted) : null;
  }
  if (body.expectedHarvest !== undefined) {
    patch.expectedHarvest = body.expectedHarvest ? new Date(body.expectedHarvest) : null;
  }
  if (body.actualHarvest !== undefined) {
    patch.actualHarvest = body.actualHarvest ? new Date(body.actualHarvest) : null;
  }
  const updated = await db.planting.update({ where: { id }, data: patch });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.planting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
