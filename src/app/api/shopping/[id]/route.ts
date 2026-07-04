import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

async function owns(id: string, userId: string | null) {
  const item = await db.shoppingItem.findUnique({ where: { id } });
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
  if (body.quantity !== undefined) patch.quantity = Number(body.quantity) || 0;
  if (typeof body.unit === "string") patch.unit = body.unit;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (body.pantryItemId !== undefined) {
    patch.pantryItemId = body.pantryItemId || null;
  }
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
  await db.shoppingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
