import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

async function owns(id: string, userId: string | null) {
  const item = await db.batch.findUnique({ where: { id } });
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
  if (typeof body.type === "string") patch.type = body.type;
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.status === "string") patch.status = body.status;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (body.startDate !== undefined) {
    patch.startDate = body.startDate ? new Date(body.startDate) : null;
  }
  if (body.expectedEnd !== undefined) {
    patch.expectedEnd = body.expectedEnd ? new Date(body.expectedEnd) : null;
  }
  if (body.actualEnd !== undefined) {
    patch.actualEnd = body.actualEnd ? new Date(body.actualEnd) : null;
  }
  if (body.lastFedAt !== undefined) {
    patch.lastFedAt = body.lastFedAt ? new Date(body.lastFedAt) : null;
  }
  if (body.markFed === true) {
    patch.lastFedAt = new Date();
  }
  if (
    (body.status === "consumed" || body.status === "discarded") &&
    !(await db.batch.findUnique({ where: { id } })).then((b) => b?.actualEnd)
  ) {
    patch.actualEnd = new Date();
  }
  const updated = await db.batch.update({ where: { id }, data: patch });
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
  await db.batch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
