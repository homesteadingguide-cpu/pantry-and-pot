import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

async function owns(id: string, userId: string | null) {
  const item = await db.pantryItem.findUnique({ where: { id } });
  if (!item) return false;
  return item.userId === userId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, canMutate } = await getSessionInfo();
  if (!user || !canMutate) {
    return NextResponse.json(
      { error: "Sign in to make changes." },
      { status: 401 },
    );
  }
  if (!(await owns(id, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = await req.json();
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
  const { user, canMutate } = await getSessionInfo();
  if (!user || !canMutate) {
    return NextResponse.json(
      { error: "Sign in to make changes." },
      { status: 401 },
    );
  }
  if (!(await owns(id, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await db.pantryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
