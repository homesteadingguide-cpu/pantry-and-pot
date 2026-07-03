import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.shoppingItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (body.quantity !== undefined) patch.quantity = Number(body.quantity) || 0;
  if (typeof body.unit === "string") patch.unit = body.unit;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (body.pantryItemId !== undefined) {
    patch.pantryItemId = body.pantryItemId || null;
  }
  // Mark as got: set gotAt to now (or clear it if false).
  if (body.got === true) {
    patch.gotAt = new Date();
  } else if (body.got === false) {
    patch.gotAt = null;
  }
  const updated = await db.shoppingItem.update({ where: { id }, data: patch });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.shoppingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
