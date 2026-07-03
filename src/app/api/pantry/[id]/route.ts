import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.pantryItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.category === "string") patch.category = body.category;
  if (body.quantity !== undefined) patch.quantity = Number(body.quantity) || 0;
  if (typeof body.unit === "string") patch.unit = body.unit;
  if (body.lowStockAt !== undefined) {
    patch.lowStockAt = body.lowStockAt == null ? null : Number(body.lowStockAt);
  }
  if (body.location !== undefined) patch.location = body.location?.trim() || null;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  const updated = await db.pantryItem.update({ where: { id }, data: patch });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.pantryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
