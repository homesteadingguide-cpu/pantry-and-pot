import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

async function owns(id: string, userId: string | null, model: "planting") {
  const item = await db[model].findUnique({ where: { id } });
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
  if (!(await owns(id, user.id, "planting"))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (typeof body.crop === "string") patch.crop = body.crop.trim();
  if (body.variety !== undefined) patch.variety = body.variety?.trim() || null;
  if (body.spot !== undefined) patch.spot = body.spot?.trim() || null;
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
  const { user, canMutate } = await getSessionInfo();
  if (!user || !canMutate) {
    return NextResponse.json(
      { error: "Sign in to make changes." },
      { status: 401 },
    );
  }
  if (!(await owns(id, user.id, "planting"))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await db.planting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
